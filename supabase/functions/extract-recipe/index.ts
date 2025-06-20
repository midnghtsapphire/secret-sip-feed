
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Rate limiting storage (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
const ALLOWED_DOMAINS = [
  'tiktok.com',
  'instagram.com',
  'lemon8-app.com',
  'v.lemon8-app.com',
  'youtube.com',
  'twitter.com',
  'x.com'
];

// Input validation functions
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function isDomainAllowed(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => 
      hostname.includes(domain) || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000); // Limit input length
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

serve(async (req) => {
  // Security headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Request size validation
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { url } = body;

    // Input validation
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const sanitizedUrl = sanitizeInput(url);

    if (!isValidUrl(sanitizedUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!isDomainAllowed(sanitizedUrl)) {
      return new Response(
        JSON.stringify({ error: 'Domain not allowed. Supported platforms: TikTok, Instagram, Lemon8, YouTube, Twitter/X' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Firecrawl API key from environment
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Scrape content with Firecrawl with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: sanitizedUrl,
          pageOptions: {
            onlyMainContent: true,
            includeHtml: false
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!scrapeResponse.ok) {
        console.error('Firecrawl API error:', scrapeResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to scrape content' }),
          { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeData.success || !scrapeData.data?.content) {
        return new Response(
          JSON.stringify({ error: 'No content found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Extract recipe information with basic validation
      const content = scrapeData.data.content.slice(0, 10000); // Limit content size
      
      const recipe = {
        name: extractRecipeName(content),
        description: extractDescription(content),
        category: extractCategory(content),
        instructions: extractInstructions(content),
        tags: extractTags(content),
        imageUrl: scrapeData.data.metadata?.image || null,
        source: getDomainFromUrl(sanitizedUrl),
        originalUrl: sanitizedUrl
      };

      // Validate extracted data
      if (!recipe.name || recipe.name.length < 2) {
        return new Response(
          JSON.stringify({ error: 'Could not extract valid recipe name' }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(recipe),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.error('Scraping error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for content extraction with validation
function extractRecipeName(content: string): string {
  const patterns = [
    /recipe[:\s]*([^.\n]+)/i,
    /drink[:\s]*([^.\n]+)/i,
    /how to make[:\s]*([^.\n]+)/i,
    /🍫🍓\s*([^🍓\n]+)/i,
    /([^·\n]+)\s*recipe/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return sanitizeInput(match[1].trim());
    }
  }
  
  // Fallback: look for title-like content
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    return sanitizeInput(lines[0].substring(0, 100));
  }
  
  return 'Imported Recipe';
}

function extractDescription(content: string): string {
  const sentences = content.split(/[.!?]/).slice(0, 3);
  return sanitizeInput(sentences.join('. '));
}

function extractCategory(content: string): string {
  const categories = ['Pink Drinks', 'Blue Drinks', 'Green Teas', 'Foam Experts', 'Budget Babe Brews', 'Viral Today'];
  const lowerContent = content.toLowerCase();
  
  for (const category of categories) {
    if (lowerContent.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  // Check for drink type keywords
  if (lowerContent.includes('pink') || lowerContent.includes('strawberry')) {
    return 'Pink Drinks';
  }
  if (lowerContent.includes('blue') || lowerContent.includes('berry')) {
    return 'Blue Drinks';
  }
  if (lowerContent.includes('matcha') || lowerContent.includes('green tea')) {
    return 'Green Teas';
  }
  
  return 'Pink Drinks'; // Default category
}

function extractInstructions(content: string): string {
  const instructionPatterns = [
    /instructions?[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /how to[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /steps?[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /recipe[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of instructionPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return sanitizeInput(match[1]);
    }
  }
  
  return '';
}

function extractTags(content: string): string[] {
  const commonTags = ['viral', 'tiktok', 'instagram', 'lemon8', 'popular', 'trending', 'sweet', 'iced', 'hot', 'frappuccino', 'latte', 'pink', 'fruity'];
  const lowerContent = content.toLowerCase();
  
  return commonTags.filter(tag => lowerContent.includes(tag)).slice(0, 5);
}

function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('tiktok')) return 'TikTok';
    if (domain.includes('instagram')) return 'Instagram';
    if (domain.includes('lemon8')) return 'Lemon8';
    if (domain.includes('youtube')) return 'YouTube';
    if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter/X';
    return domain;
  } catch {
    return 'Social Media';
  }
}
