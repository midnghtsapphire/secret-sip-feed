
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedRecipe {
  name: string;
  description: string;
  instructions: string;
  ingredients: string[];
  imageUrl?: string;
  category?: string;
  source: string;
  originalUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          error: 'URL is required',
          details: 'Please provide a valid social media URL'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Extracting recipe from:', url);

    // Check for problematic Lemon8 URLs
    if (url.includes('v.lemon8-app.com') || url.includes('/al/') || url.startsWith('https://v.lemon8-ap')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Lemon8 URL Format',
          details: 'This appears to be a Lemon8 redirect or short URL. Please use the full Lemon8 post URL instead.\n\nTo get the full URL:\n1) Open the post in the Lemon8 app or website\n2) Look for a share button or copy link option\n3) Make sure the URL starts with "https://www.lemon8-app.com/" and includes the full post path\n\nExample: https://www.lemon8-app.com/post/123456789'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate URL is from supported platforms
    const supportedPlatforms = ['tiktok.com', 'instagram.com', 'lemon8-app.com'];
    const isSupported = supportedPlatforms.some(platform => url.includes(platform));
    
    if (!isSupported) {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported Platform',
          details: 'Please use a TikTok, Instagram, or Lemon8 URL. Make sure to use the full URL from the platform, not a shortened or redirect link.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await fetch(`https://api.firecrawl.dev/v0/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['img', 'meta', 'script[type="application/ld+json"]'],
        onlyMainContent: false,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch content',
          details: `Failed to fetch content from the URL. This might be due to the page being protected, requiring login, or being a redirect page. Please try a different URL or make sure you're using the direct post URL.`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Content extraction failed',
          details: 'Failed to extract content from the page. The page might be protected or require special access.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { markdown, html, metadata } = data.data;
    
    // Check if we got meaningful content
    const contentText = [markdown, metadata?.title, metadata?.description].filter(Boolean).join(' ').toLowerCase();
    
    if (contentText.length < 50 || contentText.includes('open app') || contentText.includes('better on the app')) {
      return new Response(
        JSON.stringify({ 
          error: 'App redirect detected',
          details: 'This URL appears to redirect to an app download page. Please use the direct post URL instead. For Lemon8, make sure the URL starts with "https://www.lemon8-app.com/" and goes directly to the post.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract images
    let imageUrl = '';
    
    // Try Open Graph image first
    if (metadata?.ogImage) {
      imageUrl = Array.isArray(metadata.ogImage) ? metadata.ogImage[0] : metadata.ogImage;
    }
    
    // Try Twitter image
    if (!imageUrl && metadata?.twitterImage) {
      imageUrl = Array.isArray(metadata.twitterImage) ? metadata.twitterImage[0] : metadata.twitterImage;
    }
    
    // Look for images in HTML if no social media image found
    if (!imageUrl && html) {
      const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Extract recipe name
    let recipeName = metadata?.title || '';
    
    // Clean up recipe name
    recipeName = recipeName
      .replace(/^.*?[·•]\s*/, '')
      .replace(/\s*[·•]\s*@.+$/, '')
      .replace(/Recipe Below[🍓]*/gi, '')
      .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🍓🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, '')
      .trim();

    // Extract ingredients and instructions from text
    const ingredients: string[] = [];
    const instructionSteps: string[] = [];
    
    // Look for numbered lists or bullet points for instructions
    const lines = markdown.split('\n');
    let inInstructions = false;
    let inIngredients = false;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      // Check for section headers
      if (/^(ingredients?|what you need|recipe|items?):?$/i.test(cleanLine)) {
        inIngredients = true;
        inInstructions = false;
        continue;
      }
      
      if (/^(instructions?|steps?|how to|directions?|method):?$/i.test(cleanLine)) {
        inInstructions = true;
        inIngredients = false;
        continue;
      }
      
      // Extract content based on current section
      if (inIngredients && (cleanLine.startsWith('•') || cleanLine.startsWith('-') || /^\d+\./.test(cleanLine))) {
        const ingredient = cleanLine.replace(/^[•\-\d\.]\s*/, '').trim();
        if (ingredient.length > 3) {
          ingredients.push(ingredient);
        }
      }
      
      if (inInstructions && (cleanLine.startsWith('•') || cleanLine.startsWith('-') || /^\d+\./.test(cleanLine))) {
        const step = cleanLine.replace(/^[•\-\d\.]\s*/, '').trim();
        if (step.length > 5) {
          instructionSteps.push(step);
        }
      }
      
      // Also look for ingredients and steps without explicit sections
      if (!inIngredients && !inInstructions) {
        if (/^\d+\.?\s/.test(cleanLine) && cleanLine.length > 10) {
          instructionSteps.push(cleanLine.replace(/^\d+\.?\s*/, ''));
        }
        if (/^[•\-]\s/.test(cleanLine) && cleanLine.length > 5) {
          ingredients.push(cleanLine.replace(/^[•\-]\s*/, ''));
        }
      }
    }

    // Determine category based on content
    let category = 'Pink Drinks'; // default
    
    if (contentText.includes('green tea') || contentText.includes('matcha')) {
      category = 'Green Teas';
    } else if (contentText.includes('blue') || contentText.includes('butterfly')) {
      category = 'Blue Drinks';
    } else if (contentText.includes('foam') || contentText.includes('cold foam')) {
      category = 'Foam Experts';
    } else if (contentText.includes('budget') || contentText.includes('cheap') || contentText.includes('affordable')) {
      category = 'Budget Babe Brews';
    } else if (contentText.includes('viral') || contentText.includes('trending') || contentText.includes('tiktok')) {
      category = 'Viral Today';
    }

    // Build instructions text
    let instructionsText = '';
    
    if (ingredients.length > 0) {
      instructionsText += 'INGREDIENTS:\n';
      ingredients.forEach(ingredient => {
        instructionsText += `• ${ingredient}\n`;
      });
      instructionsText += '\n';
    }
    
    if (instructionSteps.length > 0) {
      instructionsText += 'INSTRUCTIONS:\n';
      instructionSteps.forEach((step, index) => {
        instructionsText += `${index + 1}. ${step}\n`;
      });
      instructionsText += '\n';
    }
    
    // Add source attribution
    instructionsText += `\nImported from: ${url}`;

    // Validate that we found meaningful content
    if (!recipeName && ingredients.length === 0 && instructionSteps.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No recipe content found',
          details: 'No recipe content could be extracted from this URL. The page may be a redirect, app download prompt, or may not contain a recipe. Please make sure you\'re using the direct post URL and that the post contains recipe information.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const extractedRecipe: ExtractedRecipe = {
      name: recipeName || 'Imported Recipe',
      description: metadata?.description || `Delicious drink recipe imported from social media`,
      instructions: instructionsText,
      ingredients: ingredients,
      imageUrl: imageUrl,
      category: category,
      source: url.includes('tiktok.com') ? 'TikTok' : 
               url.includes('instagram.com') ? 'Instagram' : 
               url.includes('lemon8') ? 'Lemon8' : 'Social Media',
      originalUrl: url
    };

    console.log('Final extracted recipe:', JSON.stringify(extractedRecipe, null, 2));

    return new Response(JSON.stringify(extractedRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting recipe:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error', 
        details: error.message || 'An unexpected error occurred while processing the URL'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
