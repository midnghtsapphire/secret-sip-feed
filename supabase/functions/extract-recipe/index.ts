

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
    
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Firecrawl v1 API to scrape the social media post
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              ingredients: { type: 'array', items: { type: 'string' } },
              instructions: { type: 'array', items: { type: 'string' } },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        waitFor: 3000
      })
    });

    console.log('Firecrawl response status:', scrapeResponse.status);

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ error: `Failed to scrape content: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log('Scraped data structure:', Object.keys(scrapeData));

    // Extract recipe information from the scraped content
    const extractedRecipe = await extractRecipeFromContent(scrapeData, url);

    return new Response(
      JSON.stringify({ recipe: extractedRecipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-recipe function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractRecipeFromContent(scrapeData: any, originalUrl: string): Promise<ExtractedRecipe> {
  const content = scrapeData.data?.markdown || scrapeData.data?.content || scrapeData.markdown || scrapeData.content || '';
  const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};
  const extractedData = scrapeData.data?.extract || {};
  
  console.log('Content length:', content.length);
  console.log('Metadata keys:', Object.keys(metadata));
  console.log('Extracted data:', extractedData);
  
  // Extract title/name - prioritize extracted data, then metadata, then content parsing
  let name = extractedData.title || metadata.title || metadata.ogTitle || '';
  if (!name && content) {
    const titleMatch = content.match(/^#\s*(.+)/m);
    if (titleMatch) name = titleMatch[1];
  }
  
  // Clean up the name
  name = name.replace(/\|.*$/, '').replace(/on (TikTok|Instagram|Lemon8)/, '').trim();
  if (!name) name = 'Imported Recipe';

  // Extract description
  let description = extractedData.description || metadata.description || metadata.ogDescription || '';
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
  } else if (scrapeData.data?.html || scrapeData.html) {
    const html = scrapeData.data?.html || scrapeData.html;
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }

  // If no image found, use a default
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  }

  // Extract ingredients and instructions - prioritize extracted data, then parse content
  let ingredients: string[] = [];
  let instructions: string[] = [];
  
  if (extractedData.ingredients && Array.isArray(extractedData.ingredients)) {
    ingredients = extractedData.ingredients;
  }
  
  if (extractedData.instructions && Array.isArray(extractedData.instructions)) {
    instructions = extractedData.instructions;
  }
  
  // If no structured data found, parse from content
  if (content && (ingredients.length === 0 || instructions.length === 0)) {
    // Look for ingredient patterns
    if (ingredients.length === 0) {
      const ingredientPatterns = [
        /(?:ingredients?|what you need|order|ask for)[:]\s*(.+?)(?:\n\n|\n#|$)/gis,
        /[-•]\s*(.+?)(?=\n|$)/g
      ];
      
      for (const pattern of ingredientPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const ingredient = match[1]?.trim();
          if (ingredient && ingredient.length > 3 && ingredient.length < 100) {
            ingredients.push(ingredient);
          }
        }
      }
    }

    // Look for instruction patterns
    if (instructions.length === 0) {
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
      }
    }
  }

  // Extract tags - prioritize extracted data, then parse content
  let tags: string[] = [];
  if (extractedData.tags && Array.isArray(extractedData.tags)) {
    tags = extractedData.tags;
  } else if (content) {
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

  console.log('Extracted recipe:', { name, description: description.substring(0, 50), imageUrl: !!imageUrl, ingredientsCount: ingredients.length, instructionsCount: instructions.length });

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

