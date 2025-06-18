
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  // Fetch the page content
  const response = await fetch(originalUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  console.log('HTML content length:', html.length);

  // Extract content using various parsing strategies
  const extractedData = parseHtmlContent(html, originalUrl);
  
  return extractedData;
}

function parseHtmlContent(html: string, originalUrl: string): ExtractedRecipe {
  // Clean HTML and extract text content
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract metadata from HTML
  const getMetaContent = (property: string) => {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : '';
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let name = titleMatch ? titleMatch[1] : '';
  
  // Try og:title if title is empty or generic
  const ogTitle = getMetaContent('og:title');
  if (!name || name.includes('Lemon8') || name.length < 5) {
    name = ogTitle || 'Imported Recipe';
  }

  // Clean up the title
  name = name
    .replace(/^Lemon8\s*[·•]\s*/, '')
    .replace(/\s*[·•]\s*@.+$/, '')
    .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract description
  let description = getMetaContent('og:description') || getMetaContent('description') || '';
  if (!description || description === 'See the full post on Lemon8' || description.length < 10) {
    description = `Delicious ${name.toLowerCase()} recipe imported from social media`;
  }

  // Extract image
  let imageUrl = getMetaContent('og:image') || '';
  if (!imageUrl || imageUrl.includes('tiktokcdn')) {
    imageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop';
  }

  // Parse recipe content from text
  const recipeData = parseRecipeContent(textContent);

  // Extract tags from text content
  const tags = extractHashtags(textContent);

  // Determine category
  const category = determineCategory(name + ' ' + description + ' ' + textContent);

  // Determine source
  let source = 'Social Media';
  if (originalUrl.includes('tiktok.com')) source = 'TikTok';
  else if (originalUrl.includes('instagram.com')) source = 'Instagram';
  else if (originalUrl.includes('lemon8')) source = 'Lemon8';

  console.log('Parsed recipe data:', {
    name: name.substring(0, 50),
    description: description.substring(0, 50),
    ingredientsCount: recipeData.ingredients.length,
    instructionsCount: recipeData.instructions.length,
    source
  });

  return {
    name: name || 'Imported Recipe',
    description,
    imageUrl,
    ingredients: recipeData.ingredients,
    instructions: recipeData.instructions,
    tags: tags.length > 0 ? tags : ['Imported', source],
    category,
    source,
    originalUrl
  };
}

function parseRecipeContent(text: string): { ingredients: string[], instructions: string[] } {
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 5);
  
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  // Common ingredient keywords
  const ingredientKeywords = [
    'pump', 'shot', 'oz', 'ml', 'cup', 'tsp', 'tbsp', 'gram',
    'syrup', 'milk', 'cream', 'base', 'powder', 'sauce', 'drizzle',
    'vanilla', 'caramel', 'chocolate', 'strawberry', 'raspberry',
    'coconut', 'almond', 'oat', 'ice', 'water', 'espresso', 'coffee'
  ];
  
  // Common instruction keywords
  const instructionKeywords = [
    'add', 'pour', 'mix', 'stir', 'blend', 'shake', 'top', 'drizzle',
    'order', 'ask for', 'request', 'combine', 'whisk', 'heat', 'cool',
    'first', 'then', 'next', 'finally', 'serve', 'enjoy'
  ];
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Skip obvious non-recipe content
    if (lineLower.includes('follow') || 
        lineLower.includes('like') || 
        lineLower.includes('subscribe') ||
        lineLower.includes('@') ||
        line.length > 200) {
      continue;
    }
    
    // Check if line contains ingredient keywords
    const hasIngredientKeyword = ingredientKeywords.some(keyword => 
      lineLower.includes(keyword)
    );
    
    // Check if line contains instruction keywords
    const hasInstructionKeyword = instructionKeywords.some(keyword => 
      lineLower.includes(keyword)
    );
    
    // Check for measurement patterns
    const hasMeasurement = /\d+\s*(oz|ml|cup|tsp|tbsp|pump|shot)/i.test(line);
    
    // Check for numbered instructions
    const isNumberedInstruction = /^\d+[\.\)]\s*/.test(line);
    
    if (hasIngredientKeyword || hasMeasurement) {
      if (ingredients.length < 10) {
        ingredients.push(line.replace(/^[-•*]\s*/, ''));
      }
    } else if (hasInstructionKeyword || isNumberedInstruction) {
      if (instructions.length < 10) {
        instructions.push(line.replace(/^\d+[\.\)]\s*/, ''));
      }
    }
  }
  
  // If we didn't find specific ingredients/instructions, provide defaults
  if (ingredients.length === 0) {
    ingredients.push(
      'Your favorite coffee base',
      'Flavored syrup (to taste)',
      'Milk or cream',
      'Ice',
      'Toppings (optional)'
    );
  }
  
  if (instructions.length === 0) {
    instructions.push(
      'Add your coffee base to a cup',
      'Add flavored syrups according to taste',
      'Add milk or cream',
      'Add ice and mix well',
      'Top with whipped cream or other toppings if desired',
      'Enjoy your creation!'
    );
  }
  
  return { ingredients, instructions };
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
