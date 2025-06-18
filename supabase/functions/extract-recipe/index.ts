
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

    // Extract recipe information directly
    const extractedRecipe = await extractRecipeFromUrl(url);

    return new Response(
      JSON.stringify({ recipe: extractedRecipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in extract-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract recipe', 
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractRecipeFromUrl(originalUrl: string): Promise<ExtractedRecipe> {
  console.log('Fetching content from:', originalUrl);
  
  // Set up headers to mimic a real browser
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };

  // Fetch the page content
  const response = await fetch(originalUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  console.log('HTML content length:', html.length);

  // Extract content using enhanced parsing strategies
  const extractedData = parseHtmlContent(html, originalUrl);
  
  return extractedData;
}

function parseHtmlContent(html: string, originalUrl: string): ExtractedRecipe {
  console.log('Starting enhanced HTML parsing...');
  
  // Extract JSON-LD structured data
  const jsonLdData = extractJsonLd(html);
  console.log('JSON-LD data found:', !!jsonLdData);
  
  // Extract Next.js data
  const nextJsData = extractNextJsData(html);
  console.log('Next.js data found:', !!nextJsData);
  
  // Extract meta tags
  const metaData = extractMetaData(html);
  console.log('Meta data extracted:', Object.keys(metaData));
  
  // Extract text content with better cleaning
  const textContent = extractCleanTextContent(html);
  console.log('Text content length:', textContent.length);
  
  // Try to find recipe content in various data sources
  let recipeData = null;
  
  if (jsonLdData) {
    recipeData = parseStructuredData(jsonLdData);
  }
  
  if (!recipeData && nextJsData) {
    recipeData = parseNextJsData(nextJsData);
  }
  
  if (!recipeData) {
    recipeData = parseTextContent(textContent);
  }
  
  // Build final recipe object
  const name = cleanRecipeName(
    recipeData?.name || 
    metaData.title || 
    metaData.ogTitle || 
    'Imported Recipe'
  );
  
  const description = recipeData?.description || 
    metaData.description || 
    metaData.ogDescription || 
    `Delicious ${name.toLowerCase()} recipe`;
  
  const imageUrl = recipeData?.image || 
    metaData.ogImage || 
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  
  const ingredients = recipeData?.ingredients || [];
  const instructions = recipeData?.instructions || [];
  const tags = extractHashtags(textContent);
  const category = determineCategory(name + ' ' + description + ' ' + textContent);
  const source = determineSource(originalUrl);
  
  console.log('Final parsed data:', {
    name: name.substring(0, 50),
    ingredientsCount: ingredients.length,
    instructionsCount: instructions.length,
    source
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

function extractJsonLd(html: string): any {
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const matches = html.matchAll(jsonLdRegex);
    
    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);
        if (data['@type'] === 'Recipe' || (Array.isArray(data) && data.some(item => item['@type'] === 'Recipe'))) {
          return Array.isArray(data) ? data.find(item => item['@type'] === 'Recipe') : data;
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.log('JSON-LD extraction failed:', error);
  }
  return null;
}

function extractNextJsData(html: string): any {
  try {
    const nextDataRegex = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/is;
    const match = html.match(nextDataRegex);
    
    if (match) {
      const data = JSON.parse(match[1]);
      return data?.props?.pageProps || data?.props || null;
    }
  } catch (error) {
    console.log('Next.js data extraction failed:', error);
  }
  return null;
}

function extractMetaData(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1];
  
  // Extract meta tags
  const metaRegex = /<meta[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*\/?>/gi;
  const metaMatches = html.matchAll(metaRegex);
  
  for (const match of metaMatches) {
    const key = match[1].toLowerCase().replace(':', '');
    meta[key] = match[2];
  }
  
  return meta;
}

function extractCleanTextContent(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseStructuredData(data: any): any {
  try {
    const recipe: any = {};
    
    if (data.name) recipe.name = data.name;
    if (data.description) recipe.description = data.description;
    if (data.image) {
      recipe.image = typeof data.image === 'string' ? data.image : 
        Array.isArray(data.image) ? data.image[0] : 
        data.image.url || data.image['@id'];
    }
    
    if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
      recipe.ingredients = data.recipeIngredient.map((ing: any) => 
        typeof ing === 'string' ? ing : ing.text || ing.name || String(ing)
      );
    }
    
    if (data.recipeInstructions && Array.isArray(data.recipeInstructions)) {
      recipe.instructions = data.recipeInstructions.map((inst: any) => {
        if (typeof inst === 'string') return inst;
        if (inst.text) return inst.text;
        if (inst.name) return inst.name;
        return String(inst);
      });
    }
    
    return recipe;
  } catch (error) {
    console.log('Structured data parsing failed:', error);
    return null;
  }
}

function parseNextJsData(data: any): any {
  try {
    // Look for recipe data in various possible locations
    const findRecipeData = (obj: any, path = ''): any => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Check if current object looks like recipe data
      if (obj.ingredients || obj.instructions || obj.recipe) {
        return obj;
      }
      
      // Recursively search
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const found = findRecipeData(value, `${path}.${key}`);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    return findRecipeData(data);
  } catch (error) {
    console.log('Next.js data parsing failed:', error);
    return null;
  }
}

function parseTextContent(text: string): any {
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 3);
  
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  // Enhanced patterns for ingredients
  const ingredientPatterns = [
    /(\d+(?:\.\d+)?\s*(?:cups?|tbsp|tsp|oz|ml|grams?|lbs?|pumps?|shots?|scoops?)[\s\w]+)/gi,
    /^[-•*]\s*(.+(?:syrup|milk|cream|base|powder|sauce|extract|vanilla|caramel|strawberry|chocolate).*)/gim,
    /(?:add|use|get|take|grab)\s+(.+(?:syrup|milk|cream|ice|base|powder|sauce))/gi
  ];
  
  // Enhanced patterns for instructions
  const instructionPatterns = [
    /^\d+[\.\)]\s*(.+)/gm,
    /^(?:first|then|next|after|finally|lastly)[,:\s]+(.+)/gim,
    /(?:add|pour|mix|stir|blend|shake|top|drizzle|combine|whisk|heat|cool|serve)\s+(.+)/gi
  ];
  
  // Extract ingredients
  for (const pattern of ingredientPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const ingredient = match[1] || match[0];
      if (ingredient && ingredient.length > 5 && ingredients.length < 10) {
        ingredients.push(ingredient.trim());
      }
    }
  }
  
  // Extract instructions
  for (const pattern of instructionPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const instruction = match[1] || match[0];
      if (instruction && instruction.length > 10 && instructions.length < 10) {
        instructions.push(instruction.trim());
      }
    }
  }
  
  // Remove duplicates
  const uniqueIngredients = [...new Set(ingredients)];
  const uniqueInstructions = [...new Set(instructions)];
  
  return {
    ingredients: uniqueIngredients,
    instructions: uniqueInstructions
  };
}

function cleanRecipeName(name: string): string {
  return name
    .replace(/^Lemon8\s*[·•]\s*/, '')
    .replace(/\s*[·•]\s*@.+$/, '')
    .replace(/Recipe Below[🍓]*/gi, '')
    .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Imported Recipe';
}

function extractHashtags(text: string): string[] {
  const hashtags: string[] = [];
  const hashtagMatches = text.matchAll(/#(\w+)/g);
  
  for (const match of hashtagMatches) {
    const tag = match[1];
    if (tag && tag.length > 2 && !hashtags.includes(tag) && hashtags.length < 5) {
      hashtags.push(tag);
    }
  }
  
  return hashtags;
}

function determineCategory(content: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('pink') || contentLower.includes('strawberry') || contentLower.includes('raspberry')) {
    return 'Pink Drinks';
  } else if (contentLower.includes('blue') || contentLower.includes('butterfly')) {
    return 'Blue Drinks';
  } else if (contentLower.includes('green') || contentLower.includes('matcha') || contentLower.includes('tea')) {
    return 'Green Teas';
  } else if (contentLower.includes('foam') || contentLower.includes('cold foam')) {
    return 'Foam Experts';
  } else if (contentLower.includes('budget') || contentLower.includes('cheap') || contentLower.includes('under')) {
    return 'Budget Babe Brews';
  } else if (contentLower.includes('viral') || contentLower.includes('trending')) {
    return 'Viral Today';
  }
  
  return 'Pink Drinks'; // default
}

function determineSource(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('lemon8')) return 'Lemon8';
  return 'Social Media';
}
