
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Firecrawl to scrape the social media post
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['img', 'meta', 'title'],
        onlyMainContent: true
      })
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to scrape content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log('Scraped data:', JSON.stringify(scrapeData, null, 2));

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
  const content = scrapeData.data?.markdown || scrapeData.data?.content || '';
  const metadata = scrapeData.data?.metadata || {};
  
  // Extract title/name
  let name = metadata.title || '';
  if (!name && content) {
    const titleMatch = content.match(/^#\s*(.+)/m);
    if (titleMatch) name = titleMatch[1];
  }
  
  // Clean up the name
  name = name.replace(/\|.*$/, '').replace(/on (TikTok|Instagram|Lemon8)/, '').trim();
  if (!name) name = 'Imported Recipe';

  // Extract description
  let description = metadata.description || '';
  if (!description && content) {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    description = lines.slice(0, 3).join(' ').substring(0, 200);
  }

  // Extract image URL
  let imageUrl = '';
  if (metadata.ogImage) {
    imageUrl = metadata.ogImage;
  } else if (scrapeData.data?.html) {
    const imgMatch = scrapeData.data.html.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }

  // If no image found, use a default
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  }

  // Extract ingredients and instructions from content
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  if (content) {
    // Look for ingredient patterns
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
    }
  }

  // Extract tags
  const tags: string[] = [];
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
