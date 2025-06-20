
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
    console.log('Starting recipe extraction request');

    // Request size validation
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      console.error('Request too large:', contentLength);
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
      console.error('Rate limit exceeded for client:', clientId);
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
      console.log('Request body received:', { url: body?.url ? 'URL present' : 'No URL' });
    } catch (e) {
      console.error('Failed to parse JSON:', e);
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
      console.error('Invalid URL provided:', url);
      return new Response(
        JSON.stringify({ error: 'URL is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const sanitizedUrl = sanitizeInput(url);
    console.log('Processing URL:', sanitizedUrl);

    if (!isValidUrl(sanitizedUrl)) {
      console.error('Invalid URL format:', sanitizedUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!isDomainAllowed(sanitizedUrl)) {
      console.error('Domain not allowed:', sanitizedUrl);
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
        JSON.stringify({ error: 'Service configuration error - API key missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Making Firecrawl request...');

    // Scrape content with Firecrawl with timeout and better mobile handling
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
            includeHtml: false,
            waitFor: 2000, // Wait for dynamic content
            screenshot: false
          },
          extractorOptions: {
            mode: 'llm-extraction',
            extractionPrompt: 'Extract recipe name, ingredients, instructions, and drink details from this social media post. Ignore app download prompts and navigation elements.'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Firecrawl response status:', scrapeResponse.status);

      if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        console.error('Firecrawl API error:', scrapeResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Unable to extract recipe content from this URL', 
            details: 'The social media platform may be blocking automated access or the content is not accessible.'
          }),
          { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const scrapeData = await scrapeResponse.json();
      console.log('Firecrawl response success:', scrapeData.success);
      
      if (!scrapeData.success || !scrapeData.data?.content) {
        console.error('No content found in scrape response');
        return new Response(
          JSON.stringify({ 
            error: 'No recipe content found at this URL',
            details: 'The URL may not contain a recipe, or the content is not accessible to our scraper.'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Extract recipe information with better validation
      const content = scrapeData.data.content.slice(0, 10000);
      console.log('Content extracted, length:', content.length);
      console.log('Content preview:', content.substring(0, 300));
      
      // Check if content indicates mobile redirect or app download page
      const redirectIndicators = [
        'download the app',
        'open in app',
        'get the app',
        'app store',
        'google play',
        'better on the app',
        'continue in app',
        'install app'
      ];
      
      const lowerContent = content.toLowerCase();
      const hasRedirectContent = redirectIndicators.some(indicator => 
        lowerContent.includes(indicator)
      );
      
      if (hasRedirectContent && content.length < 500) {
        console.error('Content appears to be app download redirect page');
        return new Response(
          JSON.stringify({ 
            error: 'Unable to access recipe content',
            details: 'This URL redirects to an app download page. Social media platforms often block direct access to content. Try sharing a different URL or manually entering the recipe details.'
          }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const recipe = {
        name: extractRecipeName(content),
        description: extractDescription(content),
        category: extractCategory(content),
        instructions: extractInstructions(content),
        tags: extractTags(content),
        imageUrl: scrapeData.data.metadata?.image || '/placeholder.svg',
        images: scrapeData.data.metadata?.image ? [scrapeData.data.metadata.image] : [],
        source: getDomainFromUrl(sanitizedUrl),
        originalUrl: sanitizedUrl
      };

      console.log('Recipe extracted:', { name: recipe.name, category: recipe.category, hasInstructions: !!recipe.instructions });

      // Validate that we extracted meaningful content
      if (!recipe.name || recipe.name.length < 3 || recipe.name.toLowerCase().includes('download') || recipe.name.toLowerCase().includes('app')) {
        console.error('Could not extract valid recipe name from content');
        return new Response(
          JSON.stringify({ 
            error: 'No valid recipe found in the content',
            details: 'The URL does not appear to contain a recognizable recipe. Please try a different URL or manually enter the recipe details.'
          }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Returning successful recipe extraction');
      return new Response(
        JSON.stringify(recipe),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout',
            details: 'The website took too long to respond. Please try again or use a different URL.'
          }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.error('Scraping error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to extract recipe',
          details: 'Unable to access the content at this URL. The social media platform may be blocking automated access.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing your request.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for content extraction with better validation
function extractRecipeName(content: string): string {
  // Look for recipe-like patterns
  const patterns = [
    /recipe[:\s]*([^.\n!?]{3,50})/i,
    /drink[:\s]*([^.\n!?]{3,50})/i,
    /how to make[:\s]*([^.\n!?]{3,50})/i,
    /^([^.\n!?]{5,50})\s*recipe/i,
    /🍫🍓\s*([^🍓\n]{3,50})/i,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:recipe|drink|frappe|latte|coffee)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = sanitizeInput(match[1].trim());
      // Validate it's not app-related content
      if (name.length > 3 && !name.toLowerCase().includes('app') && !name.toLowerCase().includes('download')) {
        return name;
      }
    }
  }
  
  return '';
}

function extractDescription(content: string): string {
  // Look for meaningful sentences, avoiding app download text
  const sentences = content.split(/[.!?]/)
    .filter(s => s.trim().length > 10)
    .filter(s => {
      const lower = s.toLowerCase();
      return !lower.includes('app') && !lower.includes('download') && !lower.includes('install');
    })
    .slice(0, 2);
  
  return sanitizeInput(sentences.join('. '));
}

function extractCategory(content: string): string {
  const categories = [
    'Pretty n Pink',
    'Mad Matchas', 
    'Blues Clues',
    'Foam Frenzy',
    'Mocha Magic',
    'Budget Babe Brews'
  ];
  
  const lowerContent = content.toLowerCase();
  
  for (const category of categories) {
    if (lowerContent.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  // Check for drink type keywords
  if (lowerContent.includes('pink') || lowerContent.includes('strawberry') || lowerContent.includes('berry')) {
    return 'Pretty n Pink';
  }
  if (lowerContent.includes('blue') || lowerContent.includes('blueberry')) {
    return 'Blues Clues';
  }
  if (lowerContent.includes('matcha') || lowerContent.includes('green tea')) {
    return 'Mad Matchas';
  }
  if (lowerContent.includes('foam') || lowerContent.includes('frothy') || lowerContent.includes('whip')) {
    return 'Foam Frenzy';
  }
  if (lowerContent.includes('mocha') || lowerContent.includes('chocolate') || lowerContent.includes('coffee')) {
    return 'Mocha Magic';
  }
  if (lowerContent.includes('cheap') || lowerContent.includes('budget') || lowerContent.includes('under') || lowerContent.includes('$')) {
    return 'Budget Babe Brews';
  }
  
  return 'Pretty n Pink';
}

function extractInstructions(content: string): string {
  const instructionPatterns = [
    /(?:instructions?|how to|steps?|recipe)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:order|ask for|get)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of instructionPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      const instructions = match[1].trim();
      // Avoid app-related instructions
      if (!instructions.toLowerCase().includes('download') && !instructions.toLowerCase().includes('app')) {
        return sanitizeInput(instructions);
      }
    }
  }
  
  return '';
}

function extractTags(content: string): string[] {
  const commonTags = ['viral', 'tiktok', 'instagram', 'lemon8', 'popular', 'trending', 'sweet', 'iced', 'hot', 'frappuccino', 'latte', 'pink', 'fruity', 'budget', 'cheap'];
  const lowerContent = content.toLowerCase();
  
  return commonTags.filter(tag => lowerContent.includes(tag)).slice(0, 3);
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
