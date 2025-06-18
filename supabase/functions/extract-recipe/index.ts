
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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    console.log('API key exists:', !!firecrawlApiKey);
    console.log('API key first 10 chars:', firecrawlApiKey ? firecrawlApiKey.substring(0, 10) + '...' : 'null');
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      })
    });

    console.log('Firecrawl response status:', scrapeResponse.status);
    console.log('Firecrawl response ok:', scrapeResponse.ok);

    // Get response text first to log it
    const responseText = await scrapeResponse.text();
    console.log('Firecrawl raw response:', responseText);

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error response status:', scrapeResponse.status);
      console.error('Firecrawl error response body:', responseText);
      
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
            details: 'The Firecrawl API key appears to be invalid or expired.',
            firecrawlError: responseText
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Firecrawl API error: ${errorMessage}`,
          details: responseText,
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
  
  // Extract title/name - prioritize metadata, then content parsing
  let name = metadata.title || metadata.ogTitle || '';
  if (!name && content) {
    const titleMatch = content.match(/^#\s*(.+)/m) || content.match(/^(.+)/m);
    if (titleMatch) name = titleMatch[1];
  }
  
  // Clean up the name
  name = name.replace(/\|.*$/, '').replace(/on (TikTok|Instagram|Lemon8)/, '').trim();
  if (!name) name = 'Imported Recipe';

  // Extract description
  let description = metadata.description || metadata.ogDescription || '';
  if (!description && content) {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    description = lines.slice(0, 3).join(' ').substring(0, 200);
  }

  // Extract image URL
  let imageUrl = '';
  if (metadata.ogImage) {
    imageUrl = metadata.ogImage;
  } else if (metadata.image) {
    imageUrl = metadata.image;
  } else if (html) {
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }

  // If no image found, use a default
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  }

  // Parse content for ingredients and instructions
  let ingredients: string[] = [];
  let instructions: string[] = [];
  
  if (content) {
    // Look for ingredient patterns
    const ingredientPatterns = [
      /(?:ingredients?|what you need|order|ask for)[:]\s*(.+?)(?:\n\n|\n#|$)/gis,
      /[-•*]\s*(.+?)(?=\n|$)/g
    ];
    
    for (const pattern of ingredientPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const ingredient = match[1]?.trim();
        if (ingredient && ingredient.length > 3 && ingredient.length < 100) {
          ingredients.push(ingredient);
        }
      }
      // Break after first successful pattern
      if (ingredients.length > 0) break;
    }

    // Look for instruction patterns
    const instructionPatterns = [
      /(?:instructions?|how to|steps?)[:]\s*(.+?)(?:\n\n|\n#|$)/gis,
      /\d+[.)]\s*(.+?)(?=\n|$)/g
    ];
    
    for (const pattern of instructionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const instruction = match[1]?.trim();
        if (instruction && instruction.length > 5) {
          instructions.push(instruction);
        }
      }
      // Break after first successful pattern
      if (instructions.length > 0) break;
    }
  }

  // Extract hashtags as tags
  let tags: string[] = [];
  if (content) {
    const hashtagMatches = content.matchAll(/#(\w+)/g);
    for (const match of hashtagMatches) {
      const tag = match[1];
      if (tag && !tags.includes(tag) && tags.length < 5) {
        tags.push(tag);
      }
    }
  }

  // Determine category based on content
  let category = 'Pink Drinks'; // default
  const contentLower = (name + ' ' + description + ' ' + content).toLowerCase();
  
  if (contentLower.includes('pink') || contentLower.includes('strawberry')) {
    category = 'Pink Drinks';
  } else if (contentLower.includes('blue') || contentLower.includes('butterfly')) {
    category = 'Blue Drinks';
  } else if (contentLower.includes('green') || contentLower.includes('matcha')) {
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

  console.log('Extracted recipe:', { 
    name, 
    description: description.substring(0, 50), 
    imageUrl: !!imageUrl, 
    ingredientsCount: ingredients.length, 
    instructionsCount: instructions.length,
    tagsCount: tags.length 
  });

  return {
    name,
    description: description || 'Imported from social media',
    imageUrl,
    ingredients: ingredients.length > 0 ? ingredients : ['Ask for ingredients from the post'],
    instructions: instructions.length > 0 ? instructions : ['Follow the instructions in the original post'],
    tags: tags.length > 0 ? tags : ['Imported', 'SocialMedia'],
    category,
    source,
    originalUrl
  };
}
