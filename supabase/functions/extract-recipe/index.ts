
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedRecipe {
  name: string;
  description: string;
  imageUrl: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  category: string;
  source: string;
  originalUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting recipe from URL:', url);

    // Get the Firecrawl API key from Supabase secrets
    let firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    console.log('Raw API key exists:', !!firecrawlApiKey);
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the API key - remove any extra whitespace or prefixes
    firecrawlApiKey = firecrawlApiKey.trim();
    
    // Remove common prefixes that might have been added by mistake
    if (firecrawlApiKey.startsWith('Bearer ')) {
      firecrawlApiKey = firecrawlApiKey.substring(7);
    }
    if (firecrawlApiKey.startsWith('fc-')) {
      // This is correct format, keep as is
    } else {
      console.log('Warning: API key does not start with expected "fc-" prefix');
    }
    
    console.log('Cleaned API key prefix:', firecrawlApiKey.substring(0, 10) + '...');

    // Use Firecrawl v1 API to scrape the content with simple scrape
    console.log('Making request to Firecrawl API...');
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
        includeTags: ['p', 'div', 'span', 'h1', 'h2', 'h3', 'ul', 'li', 'ol']
      })
    });

    console.log('Firecrawl response status:', scrapeResponse.status);
    console.log('Firecrawl response ok:', scrapeResponse.ok);

    // Get response text first to log it
    const responseText = await scrapeResponse.text();
    console.log('Firecrawl raw response (first 200 chars):', responseText.substring(0, 200));

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error response status:', scrapeResponse.status);
      
      // Try to parse error response
      let errorMessage = 'Failed to scrape content';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.log('Parsed error:', errorMessage);
      } catch (parseError) {
        console.log('Could not parse error response as JSON');
      }
      
      // If API key is invalid, return a more user-friendly error
      if (scrapeResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid Firecrawl API key. Please check your API key configuration.',
            details: 'The Firecrawl API key appears to be invalid, expired, or incorrectly formatted. Make sure it starts with "fc-" and has no extra spaces or prefixes.',
            firecrawlError: errorMessage
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Firecrawl API error: ${errorMessage}`,
          details: responseText.substring(0, 500),
          status: scrapeResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response
    let scrapeData;
    try {
      scrapeData = JSON.parse(responseText);
      console.log('Parsed scrape data keys:', Object.keys(scrapeData));
      console.log('Scrape data success:', scrapeData.success);
    } catch (parseError) {
      console.error('Failed to parse Firecrawl response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from Firecrawl API',
          details: 'Response was not valid JSON'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scrapeData.success) {
      console.error('Firecrawl scraping failed:', scrapeData.error);
      return new Response(
        JSON.stringify({ error: scrapeData.error || 'Failed to scrape content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract recipe information from the scraped content
    const extractedRecipe = await extractRecipeFromContent(scrapeData, url);

    return new Response(
      JSON.stringify({ recipe: extractedRecipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-recipe function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message,
        type: 'UnexpectedError'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractRecipeFromContent(scrapeData: any, originalUrl: string): Promise<ExtractedRecipe> {
  const content = scrapeData.data?.markdown || scrapeData.data?.content || scrapeData.markdown || scrapeData.content || '';
  const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
  const html = scrapeData.data?.html || scrapeData.html || '';
  
  console.log('Content length:', content.length);
  console.log('HTML length:', html.length);
  console.log('Metadata keys:', Object.keys(metadata));
  console.log('Raw content sample:', content.substring(0, 500));

  // Helper function to clean and filter content
  function cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove URLs completely
      .replace(/https?:\/\/[^\s\)\]]+/g, '')
      // Remove CDN and image URLs
      .replace(/tiktokcdn[^\s\)\]]+/g, '')
      .replace(/[^\s]*\.(jpg|jpeg|png|gif|webp|svg)[^\s\)\]]*/gi, '')
      // Remove URL parameters and signatures
      .replace(/[?&][a-zA-Z0-9_-]+=([^&\s\)\]]*)/g, '')
      // Remove markdown image syntax
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // Remove excessive line breaks and whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      // Remove empty parentheses and brackets
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      // Clean up common social media artifacts
      .replace(/@[a-zA-Z0-9_]+/g, '')
      .replace(/#[a-zA-Z0-9_]+/g, '')
      .trim();
  }

  // Extract meaningful text content
  function extractMeaningfulContent(text: string): string[] {
    const cleaned = cleanText(text);
    if (!cleaned) return [];
    
    return cleaned
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => {
        return line.length > 5 && 
               !line.includes('tiktokcdn') &&
               !line.includes('x-expires') &&
               !line.includes('x-signature') &&
               !line.match(/^https?:/) &&
               !line.match(/^\w+\.(jpg|jpeg|png|gif|webp)/i) &&
               line.length < 200; // Reasonable max length for a line
      });
  }

  // Extract title/name - prioritize metadata, then content parsing
  let name = metadata.title || metadata.ogTitle || '';
  if (!name && content) {
    const titleMatch = content.match(/^#\s*(.+)/m) || content.match(/^(.+)/m);
    if (titleMatch) name = titleMatch[1];
  }
  
  // Clean up the name
  name = cleanText(name);
  name = name.replace(/\|.*$/, '').replace(/on (TikTok|Instagram|Lemon8)/, '').trim();
  if (!name || name.length < 3) name = 'Imported Social Media Recipe';

  // Extract description
  let description = metadata.description || metadata.ogDescription || '';
  if (!description && content) {
    const meaningfulLines = extractMeaningfulContent(content);
    description = meaningfulLines.slice(0, 2).join(' ').substring(0, 200);
  }
  description = cleanText(description);
  if (!description || description.length < 10) {
    description = `Delicious ${name.toLowerCase()} recipe imported from social media`;
  }

  // Extract image URL
  let imageUrl = '';
  if (metadata.ogImage && !metadata.ogImage.includes('tiktokcdn')) {
    imageUrl = metadata.ogImage;
  } else if (metadata.image && !metadata.image.includes('tiktokcdn')) {
    imageUrl = metadata.image;
  }

  // If no good image found, use a default
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  }

  // Extract meaningful content lines for ingredients and instructions
  const meaningfulLines = extractMeaningfulContent(content);
  console.log('Meaningful lines extracted:', meaningfulLines.length);
  console.log('Sample meaningful lines:', meaningfulLines.slice(0, 5));

  // Parse ingredients and instructions from meaningful content
  let ingredients: string[] = [];
  let instructions: string[] = [];
  
  // Look for recipe-related keywords to identify ingredients and instructions
  const ingredientKeywords = ['ingredient', 'add', 'cup', 'tablespoon', 'teaspoon', 'ounce', 'ml', 'gram', 'oz', 'tsp', 'tbsp'];
  const instructionKeywords = ['mix', 'stir', 'blend', 'pour', 'serve', 'combine', 'whisk', 'heat', 'cool', 'top', 'order', 'ask for'];

  for (const line of meaningfulLines) {
    const lineLower = line.toLowerCase();
    
    // Check if line contains ingredient-like content
    if (ingredientKeywords.some(keyword => lineLower.includes(keyword)) || 
        line.match(/^\s*[-•*]\s*/) || 
        line.match(/\d+\s*(cup|oz|ml|gram|tsp|tbsp)/i)) {
      if (ingredients.length < 10) { // Limit ingredients
        ingredients.push(line.replace(/^\s*[-•*]\s*/, '').trim());
      }
    }
    // Check if line contains instruction-like content
    else if (instructionKeywords.some(keyword => lineLower.includes(keyword)) ||
             line.match(/^\d+\.\s*/) ||
             (line.length > 15 && (lineLower.includes('step') || lineLower.includes('first') || lineLower.includes('then')))) {
      if (instructions.length < 10) { // Limit instructions
        instructions.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }
  }

  // If no specific ingredients/instructions found, use fallback approach
  if (ingredients.length === 0 && instructions.length === 0 && meaningfulLines.length > 0) {
    // Take first half as potential ingredients, second half as instructions
    const midPoint = Math.floor(meaningfulLines.length / 2);
    ingredients = meaningfulLines.slice(0, midPoint).slice(0, 5);
    instructions = meaningfulLines.slice(midPoint).slice(0, 5);
  }

  // Create fallback content if extraction failed
  if (ingredients.length === 0) {
    ingredients = [`${name} base ingredients`, 'Check original post for complete ingredient list'];
  }
  
  if (instructions.length === 0) {
    instructions = [
      'Follow the preparation steps shown in the original post',
      'Adjust sweetness and ingredients to taste',
      'Serve immediately for best results'
    ];
  }

  // Extract hashtags as tags from meaningful content
  let tags: string[] = [];
  const hashtagMatches = content.matchAll(/#(\w+)/g);
  for (const match of hashtagMatches) {
    const tag = match[1];
    if (tag && tag.length > 2 && !tags.includes(tag) && tags.length < 5) {
      tags.push(tag);
    }
  }

  // Determine category based on content
  let category = 'Pink Drinks'; // default
  const contentLower = (name + ' ' + description + ' ' + meaningfulLines.join(' ')).toLowerCase();
  
  if (contentLower.includes('pink') || contentLower.includes('strawberry') || contentLower.includes('raspberry')) {
    category = 'Pink Drinks';
  } else if (contentLower.includes('blue') || contentLower.includes('butterfly')) {
    category = 'Blue Drinks';
  } else if (contentLower.includes('green') || contentLower.includes('matcha') || contentLower.includes('tea')) {
    category = 'Green Teas';
  } else if (contentLower.includes('foam') || contentLower.includes('cold foam')) {
    category = 'Foam Experts';
  } else if (contentLower.includes('budget') || contentLower.includes('cheap') || contentLower.includes('under')) {
    category = 'Budget Babe Brews';
  } else if (contentLower.includes('viral') || contentLower.includes('trending')) {
    category = 'Viral Today';
  }

  // Determine source platform
  let source = 'Social Media';
  if (originalUrl.includes('tiktok.com')) source = 'TikTok';
  else if (originalUrl.includes('instagram.com')) source = 'Instagram';
  else if (originalUrl.includes('lemon8')) source = 'Lemon8';

  console.log('Final extracted recipe:', { 
    name, 
    description: description.substring(0, 50), 
    imageUrl: !!imageUrl, 
    ingredientsCount: ingredients.length, 
    instructionsCount: instructions.length,
    tagsCount: tags.length,
    ingredients: ingredients.slice(0, 3),
    instructions: instructions.slice(0, 3)
  });

  return {
    name,
    description,
    imageUrl,
    ingredients,
    instructions,
    tags: tags.length > 0 ? tags : ['Imported', source],
    category,
    source,
    originalUrl
  };
}
