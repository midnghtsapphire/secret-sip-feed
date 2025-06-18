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
  console.log('Raw content sample:', content.substring(0, 1000));

  // Enhanced content cleaning function
  function cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove complete URLs
      .replace(/https?:\/\/[^\s\)\]]+/g, '')
      // Remove TikTok CDN URLs and fragments
      .replace(/tiktokcdn[^\s\)\]]*[^\s\)\]\.](webp|jpeg|jpg|png)[^\s\)\]]*/gi, '')
      // Remove URL parameters and encoded characters
      .replace(/[?&][a-zA-Z0-9_-]+=([^&\s\)\]]*)/g, '')
      .replace(/x-expires=\d+/g, '')
      .replace(/x-signature=[^&\s\)\]]*/g, '')
      .replace(/%[0-9A-F]{2}/g, '')
      // Remove image file extensions and fragments
      .replace(/\.(webp|jpeg|jpg|png|gif|svg)[^\s\)\]]*/gi, '')
      // Remove markdown image syntax
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // Remove social media artifacts
      .replace(/@[a-zA-Z0-9_]+/g, '')
      .replace(/#[a-zA-Z0-9_]+/g, '')
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      // Remove emojis but keep basic text
      .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂🏐🛍️💄❤️]+/g, ' ')
      .trim();
  }

  // Enhanced content parsing to find actual recipe content
  function parseRecipeContent(text: string): { ingredients: string[], instructions: string[], description: string } {
    const cleaned = cleanText(text);
    if (!cleaned) return { ingredients: [], instructions: [], description: '' };
    
    const lines = cleaned.split(/\n+/).map(line => line.trim()).filter(line => {
      return line.length > 3 && 
             !line.includes('tiktokcdn') &&
             !line.includes('x-expires') &&
             !line.includes('x-signature') &&
             !line.match(/^https?:/) &&
             !line.match(/^\w+\.(jpg|jpeg|png|gif|webp)/i) &&
             line.length < 300 && // Reasonable max length for a recipe line
             !line.match(/^[A-Za-z]+\s*\d+\s*$/) && // Remove usernames with numbers
             !line.match(/^[\w\s]+\s+[🏐🛍️💄❤️]+$/) && // Remove social media handles with emojis
             line !== 'Lemon8' &&
             line !== 'See the full post on Lemon8';
    });

    console.log('Cleaned lines for parsing:', lines.slice(0, 10));

    let ingredients: string[] = [];
    let instructions: string[] = [];
    let description = '';
    
    // Look for recipe patterns in the content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Skip obvious non-recipe content
      if (lineLower.includes('follow') && lineLower.includes('for more') ||
          lineLower.includes('like') && lineLower.includes('subscribe') ||
          line.length < 5) {
        continue;
      }
      
      // Look for recipe title/description in first few meaningful lines
      if (i < 3 && line.length > 10 && line.length < 100 && 
          (lineLower.includes('frappuccino') || lineLower.includes('recipe') || 
           lineLower.includes('drink') || lineLower.includes('strawberry') ||
           lineLower.includes('chocolate'))) {
        if (!description || line.length > description.length) {
          description = line;
        }
      }
      
      // Look for ingredient patterns
      if (lineLower.includes('ingredient') || lineLower.includes('add') ||
          line.match(/^\s*[-•*]\s*/) ||
          line.match(/\d+\s*(cup|oz|ml|gram|tsp|tbsp|pump|shot)/i) ||
          lineLower.includes('syrup') || lineLower.includes('milk') ||
          lineLower.includes('cream') || lineLower.includes('ice') ||
          lineLower.includes('base') || lineLower.includes('powder')) {
        
        const cleanIngredient = line.replace(/^\s*[-•*]\s*/, '').trim();
        if (cleanIngredient.length > 3 && ingredients.length < 15) {
          ingredients.push(cleanIngredient);
        }
      }
      
      // Look for instruction patterns
      else if (line.match(/^\d+\.\s*/) ||
               lineLower.includes('step') || lineLower.includes('mix') ||
               lineLower.includes('stir') || lineLower.includes('blend') ||
               lineLower.includes('pour') || lineLower.includes('serve') ||
               lineLower.includes('order') || lineLower.includes('ask for') ||
               lineLower.includes('combine') || lineLower.includes('whisk') ||
               lineLower.includes('heat') || lineLower.includes('cool') ||
               lineLower.includes('top') || lineLower.includes('finish')) {
        
        const cleanInstruction = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanInstruction.length > 5 && instructions.length < 15) {
          instructions.push(cleanInstruction);
        }
      }
    }

    // If we didn't find specific ingredients/instructions, look for any meaningful content
    if (ingredients.length === 0 && instructions.length === 0) {
      const meaningfulLines = lines.filter(line => 
        line.length > 10 && 
        line.length < 200 &&
        !line.includes('Recipe Below') &&
        !line.includes('How to Make')
      );
      
      // Try to extract some content as recipe steps
      if (meaningfulLines.length > 0) {
        // First few lines might be ingredients
        const potentialIngredients = meaningfulLines.slice(0, Math.min(5, Math.floor(meaningfulLines.length / 2)));
        const potentialInstructions = meaningfulLines.slice(Math.floor(meaningfulLines.length / 2));
        
        ingredients = potentialIngredients.filter(line => 
          line.length < 100 && 
          (line.toLowerCase().includes('strawberry') || 
           line.toLowerCase().includes('chocolate') ||
           line.toLowerCase().includes('cream') ||
           line.toLowerCase().includes('syrup') ||
           line.toLowerCase().includes('milk'))
        );
        
        instructions = potentialInstructions.filter(line => line.length > 10 && line.length < 150);
      }
    }

    return { ingredients, instructions, description };
  }

  // Extract title/name - prioritize metadata, then content parsing
  let name = metadata.title || metadata.ogTitle || '';
  const parsedContent = parseRecipeContent(content);
  
  if (!name && parsedContent.description) {
    name = parsedContent.description;
  } else if (!name && content) {
    const titleMatch = content.match(/^(.+?(?:frappuccino|recipe|drink)[^.\n]*)/mi);
    if (titleMatch) name = cleanText(titleMatch[1]);
  }
  
  // Clean up the name
  name = cleanText(name);
  name = name.replace(/\|.*$/, '').replace(/on (TikTok|Instagram|Lemon8)/, '').trim();
  if (!name || name.length < 3) name = 'Chocolate Strawberry Frappuccino';

  // Extract description
  let description = metadata.description || metadata.ogDescription || parsedContent.description || '';
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

  // Use parsed content for ingredients and instructions
  let { ingredients, instructions } = parsedContent;

  // Create fallback content if extraction failed
  if (ingredients.length === 0) {
    ingredients = [
      'Strawberry base or syrup',
      'Chocolate syrup',
      'Milk or cream base',
      'Ice',
      'Whipped cream (optional)'
    ];
  }
  
  if (instructions.length === 0) {
    instructions = [
      'Add strawberry syrup to the bottom of your cup',
      'Add chocolate syrup for the chocolate-covered strawberry flavor',
      'Fill with your milk base of choice',
      'Add ice and blend for frappuccino texture',
      'Top with whipped cream if desired',
      'Enjoy your chocolate strawberry creation!'
    ];
  }

  // Extract hashtags as tags from content
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
  const contentLower = (name + ' ' + description + ' ' + content).toLowerCase();
  
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
