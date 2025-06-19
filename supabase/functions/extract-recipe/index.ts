
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

    const extractedRecipe = await extractRecipeFromSocialMedia(url);

    if (!extractedRecipe) {
      return new Response(
        JSON.stringify({ error: 'Could not extract recipe data from this URL. Please check the link and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ recipe: extractedRecipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in extract-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract recipe from URL', 
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractRecipeFromSocialMedia(originalUrl: string): Promise<ExtractedRecipe | null> {
  console.log('Fetching content from:', originalUrl);
  
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

  const response = await fetch(originalUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  console.log('HTML content length:', html.length);

  const extractedData = extractRealContent(html, originalUrl);
  
  if (!extractedData || !isValidRecipeData(extractedData)) {
    console.log('No valid recipe data found');
    return null;
  }
  
  return extractedData;
}

function extractRealContent(html: string, originalUrl: string): ExtractedRecipe | null {
  console.log('Extracting real content from HTML...');
  
  const platform = getPlatform(originalUrl);
  console.log('Detected platform:', platform);
  
  const metaData = extractMetaTags(html);
  console.log('Meta data extracted:', Object.keys(metaData));
  
  const jsonLdData = extractStructuredData(html);
  console.log('Structured data found:', !!jsonLdData);
  
  const recipeContent = extractPlatformSpecificContent(html, platform);
  console.log('Platform-specific content extracted:', !!recipeContent);
  
  const name = extractRecipeName(metaData, jsonLdData, recipeContent);
  const description = extractDescription(metaData, jsonLdData, recipeContent);
  const imageUrl = extractImageUrl(metaData, jsonLdData, html);
  const tags = extractTags(html, platform);
  
  if (!name || name.length < 3) {
    console.log('No valid recipe name found');
    return null;
  }
  
  if (!description || description.length < 10) {
    console.log('No valid description found');
    return null;
  }

  if (!imageUrl) {
    console.log('No image found');
    return null;
  }
  
  const { ingredients, instructions } = extractRecipeSteps(recipeContent, metaData.description || '');
  
  return {
    name: cleanText(name),
    description: cleanText(description),
    imageUrl: imageUrl,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
    instructions: instructions.length > 0 ? instructions : undefined,
    tags: tags.length > 0 ? tags : undefined,
    category: categorizeFromTags(tags, name + ' ' + description),
    source: platform,
    originalUrl
  };
}

function getPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('lemon8')) return 'Lemon8';
  return 'Social Media';
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();
  
  const metaRegex = /<meta[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*\/?>/gi;
  let match;
  
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1].toLowerCase().replace(/[:_]/g, '');
    const value = match[2].trim();
    if (value && value.length > 0) {
      meta[key] = value;
    }
  }
  
  return meta;
}

function extractStructuredData(html: string): any {
  try {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    let match;
    
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data && (data['@type'] === 'Recipe' || data['@type'] === 'VideoObject' || data['@type'] === 'Article')) {
          return data;
        }
        if (Array.isArray(data)) {
          const recipeData = data.find(item => item['@type'] === 'Recipe' || item['@type'] === 'VideoObject');
          if (recipeData) return recipeData;
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

function extractPlatformSpecificContent(html: string, platform: string): string {
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  switch (platform) {
    case 'TikTok':
      const tiktokContent = cleanHtml.match(/<div[^>]*class="[^"]*video-meta[^"]*"[^>]*>[\s\S]*?<\/div>/i);
      if (tiktokContent) return tiktokContent[0];
      break;
      
    case 'Instagram':
      const igContent = cleanHtml.match(/<meta property="og:description" content="([^"]+)"/i);
      if (igContent) return igContent[1];
      break;
      
    case 'Lemon8':
      const lemon8Content = cleanHtml.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>/i);
      if (lemon8Content) return lemon8Content[0];
      break;
  }
  
  const contentAreas = [
    /<article[^>]*>[\s\S]*?<\/article>/i,
    /<main[^>]*>[\s\S]*?<\/main>/i,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>[\s\S]*?<\/div>/i
  ];
  
  for (const regex of contentAreas) {
    const match = cleanHtml.match(regex);
    if (match) return match[0];
  }
  
  return cleanHtml;
}

function extractRecipeName(metaData: Record<string, string>, jsonLd: any, content: string): string {
  if (jsonLd?.name) return jsonLd.name;
  
  if (metaData.ogtitle) return metaData.ogtitle;
  if (metaData.twittertitle) return metaData.twittertitle;
  if (metaData.title) return metaData.title;
  
  const contentText = content.replace(/<[^>]+>/g, ' ').trim();
  const lines = contentText.split('\n').filter(line => line.trim().length > 5);
  
  for (const line of lines.slice(0, 3)) {
    const cleanLine = line.trim();
    if (cleanLine.length > 5 && cleanLine.length < 100) {
      if (/recipe|drink|latte|coffee|tea|smoothie|beverage|starbucks/i.test(cleanLine)) {
        return cleanLine;
      }
    }
  }
  
  return '';
}

function extractDescription(metaData: Record<string, string>, jsonLd: any, content: string): string {
  if (jsonLd?.description) return jsonLd.description;
  
  if (metaData.ogdescription && metaData.ogdescription.length > 20) return metaData.ogdescription;
  if (metaData.twitterdescription && metaData.twitterdescription.length > 20) return metaData.twitterdescription;
  if (metaData.description && metaData.description.length > 20) return metaData.description;
  
  const contentText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const sentence of sentences.slice(0, 3)) {
    const cleanSentence = sentence.trim();
    if (cleanSentence.length > 30 && cleanSentence.length < 300) {
      return cleanSentence;
    }
  }
  
  return '';
}

function extractImageUrl(metaData: Record<string, string>, jsonLd: any, html: string): string | null {
  console.log('Extracting image URL...');
  
  // Try JSON-LD first
  if (jsonLd?.image) {
    const image = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
    if (typeof image === 'string' && image.startsWith('http')) {
      console.log('Found image in JSON-LD:', image);
      return image;
    }
    if (image?.url && image.url.startsWith('http')) {
      console.log('Found image URL in JSON-LD:', image.url);
      return image.url;
    }
  }
  
  // Try Open Graph image
  if (metaData.ogimage && metaData.ogimage.startsWith('http')) {
    console.log('Found Open Graph image:', metaData.ogimage);
    return metaData.ogimage;
  }
  
  // Try Twitter image
  if (metaData.twitterimage && metaData.twitterimage.startsWith('http')) {
    console.log('Found Twitter image:', metaData.twitterimage);
    return metaData.twitterimage;
  }
  
  // Try to find images in the HTML content
  const imageRegexes = [
    // Standard img tags with src
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    // CSS background images
    /background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
    // Data attributes that might contain images
    /data-[^=]*image[^=]*=["']([^"']+)["']/gi,
    // Content attributes that might contain images
    /content=["']([^"']*\.(jpg|jpeg|png|gif|webp)[^"']*)["']/gi
  ];
  
  for (const regex of imageRegexes) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      let imageUrl = match[1];
      
      // Skip very small images, icons, or tracking pixels
      if (imageUrl.includes('1x1') || imageUrl.includes('icon') || imageUrl.includes('logo')) {
        continue;
      }
      
      // Make sure it's a full URL
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        const urlObj = new URL(html);
        imageUrl = urlObj.origin + imageUrl;
      }
      
      if (imageUrl.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)/i.test(imageUrl)) {
        console.log('Found image in HTML:', imageUrl);
        return imageUrl;
      }
    }
  }
  
  console.log('No valid image found');
  return null;
}

function extractTags(html: string, platform: string): string[] {
  const tags: string[] = [];
  
  const hashtagRegex = /#(\w+)/g;
  let match;
  
  while ((match = hashtagRegex.exec(html)) !== null) {
    const tag = match[1];
    if (tag.length > 2 && !tags.includes(tag) && tags.length < 10) {
      tags.push(tag);
    }
  }
  
  tags.push(platform);
  
  return tags;
}

function extractRecipeSteps(content: string, description: string): { ingredients: string[], instructions: string[] } {
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  const fullText = (content + ' ' + description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  
  const ingredientPatterns = [
    /(\d+(?:\.\d+)?\s*(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ml|grams?|pumps?|shots?|scoops?)\s+[^.!?]+)/gi,
    /(?:add|use|get|mix|pour)\s+([^.!?]{10,80}(?:syrup|milk|cream|ice|powder|extract|vanilla|caramel|coffee))/gi
  ];
  
  for (const pattern of ingredientPatterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null && ingredients.length < 8) {
      const ingredient = match[1].trim();
      if (ingredient.length > 5 && !ingredients.includes(ingredient)) {
        ingredients.push(ingredient);
      }
    }
  }
  
  const instructionPatterns = [
    /(?:^|\n)\s*\d+[\.\)]\s*([^.!?\n]{15,150})/g,
    /(?:first|then|next|after|finally)\s*[,:]?\s*([^.!?\n]{15,150})/gi
  ];
  
  for (const pattern of instructionPatterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null && instructions.length < 8) {
      const instruction = match[1].trim();
      if (instruction.length > 10 && !instructions.includes(instruction)) {
        instructions.push(instruction);
      }
    }
  }
  
  return { ingredients, instructions };
}

function cleanText(text: string): string {
  return text
    .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeFromTags(tags: string[], content: string): string {
  const contentLower = (tags.join(' ') + ' ' + content).toLowerCase();
  
  if (contentLower.includes('pink') || contentLower.includes('strawberry') || contentLower.includes('berry')) {
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
  
  return 'Pink Drinks';
}

function isValidRecipeData(data: ExtractedRecipe): boolean {
  if (!data.name || data.name.length < 3) return false;
  if (!data.description || data.description.length < 10) return false;
  if (!data.imageUrl) return false;
  
  const genericPatterns = [
    /your favorite/i,
    /to taste/i,
    /according to taste/i,
    /enjoy your creation/i,
    /add.*base.*cup/i
  ];
  
  const fullContent = data.name + ' ' + data.description + ' ' + (data.instructions?.join(' ') || '');
  
  for (const pattern of genericPatterns) {
    if (pattern.test(fullContent)) {
      console.log('Detected generic content pattern:', pattern);
      return false;
    }
  }
  
  return true;
}
