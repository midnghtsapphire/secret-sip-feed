
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
  images?: string[];
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

    // Extract multiple images with better validation
    const images: string[] = [];
    let primaryImageUrl = '';
    
    // Helper function to validate image URLs more strictly
    const isValidImageUrl = (imgUrl: string): boolean => {
      if (!imgUrl || typeof imgUrl !== 'string') return false;
      
      // Must be a proper URL
      try {
        new URL(imgUrl);
      } catch {
        return false;
      }
      
      // Filter out data URLs, broken URLs, and placeholder images
      if (imgUrl.startsWith('data:') || 
          imgUrl.includes('placeholder') || 
          imgUrl.includes('default') ||
          imgUrl.includes('blank') ||
          imgUrl.includes('loading') ||
          imgUrl.length < 15) {
        return false;
      }
      
      // Must be from a known CDN or have image extension
      const validPatterns = [
        /\.(jpg|jpeg|png|gif|webp)(\?|$)/i,
        /cdn\./i,
        /images\./i,
        /photo/i,
        /img\./i,
        /static\./i,
        /media\./i,
        /tiktokcdn/i,
        /instagramcdn/i,
        /fbcdn/i
      ];
      
      return validPatterns.some(pattern => pattern.test(imgUrl));
    };
    
    // Extract from Open Graph
    if (metadata?.ogImage) {
      const ogImages = Array.isArray(metadata.ogImage) ? metadata.ogImage : [metadata.ogImage];
      for (const img of ogImages) {
        const imgUrl = typeof img === 'string' ? img : img?.url;
        if (isValidImageUrl(imgUrl)) {
          images.push(imgUrl);
          if (!primaryImageUrl) primaryImageUrl = imgUrl;
        }
      }
    }
    
    // Extract from Twitter/X metadata
    if (metadata?.twitterImage) {
      const twitterImages = Array.isArray(metadata.twitterImage) ? metadata.twitterImage : [metadata.twitterImage];
      for (const img of twitterImages) {
        const imgUrl = typeof img === 'string' ? img : img?.url;
        if (isValidImageUrl(imgUrl) && !images.includes(imgUrl)) {
          images.push(imgUrl);
          if (!primaryImageUrl) primaryImageUrl = imgUrl;
        }
      }
    }
    
    // Extract from HTML img tags
    if (html) {
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let imgMatch;
      
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const imgUrl = imgMatch[1];
        if (isValidImageUrl(imgUrl) && !images.includes(imgUrl)) {
          images.push(imgUrl);
          if (!primaryImageUrl) primaryImageUrl = imgUrl;
        }
      }
    }
    
    // Extract from CSS background images
    if (html) {
      const bgImageRegex = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
      let bgMatch;
      
      while ((bgMatch = bgImageRegex.exec(html)) !== null) {
        const imgUrl = bgMatch[1];
        if (isValidImageUrl(imgUrl) && !images.includes(imgUrl)) {
          images.push(imgUrl);
          if (!primaryImageUrl) primaryImageUrl = imgUrl;
        }
      }
    }

    console.log(`Found ${images.length} valid images:`, images);
    console.log('Primary image:', primaryImageUrl);

    // Extract recipe name - clean up more aggressively
    let recipeName = metadata?.title || '';
    
    // Remove platform prefixes and suffixes
    recipeName = recipeName
      .replace(/^(Lemon8|TikTok|Instagram)\s*[·•-]\s*/i, '')
      .replace(/\s*[·•-]\s*(Lemon8|TikTok|Instagram)$/i, '')
      .replace(/\s*[·•-]\s*@.+$/i, '')
      .replace(/Recipe Below[🍓]*/gi, '')
      .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🍓🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, '')
      .trim();

    // Extract ingredients and instructions more carefully
    const ingredients: string[] = [];
    const instructionSteps: string[] = [];
    
    // Only process if we have meaningful markdown content
    if (markdown && markdown.length > 100) {
      const lines = markdown.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      let inInstructions = false;
      let inIngredients = false;
      
      for (const line of lines) {
        // Skip lines that are just URLs or metadata
        if (line.startsWith('http') || line.includes('tiktokcdn') || line.length < 3) {
          continue;
        }
        
        // Check for section headers
        if (/^(ingredients?|what you need|recipe|items?):?$/i.test(line)) {
          inIngredients = true;
          inInstructions = false;
          continue;
        }
        
        if (/^(instructions?|steps?|how to|directions?|method):?$/i.test(line)) {
          inInstructions = true;
          inIngredients = false;
          continue;
        }
        
        // Extract content based on current section
        if (inIngredients && (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))) {
          const ingredient = line.replace(/^[•\-\d\.]\s*/, '').trim();
          if (ingredient.length > 3 && !ingredient.includes('http')) {
            ingredients.push(ingredient);
          }
        }
        
        if (inInstructions && (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))) {
          const step = line.replace(/^[•\-\d\.]\s*/, '').trim();
          if (step.length > 5 && !step.includes('http')) {
            instructionSteps.push(step);
          }
        }
        
        // Also look for ingredients and steps without explicit sections
        if (!inIngredients && !inInstructions) {
          if (/^\d+\.?\s/.test(line) && line.length > 10 && !line.includes('http')) {
            instructionSteps.push(line.replace(/^\d+\.?\s*/, ''));
          }
          if (/^[•\-]\s/.test(line) && line.length > 5 && !line.includes('http')) {
            ingredients.push(line.replace(/^[•\-]\s*/, ''));
          }
        }
      }
    }

    // Determine category based on content
    let category = 'Pink Drinks'; // default
    
    const lowerContent = contentText.toLowerCase();
    if (lowerContent.includes('green tea') || lowerContent.includes('matcha')) {
      category = 'Green Teas';
    } else if (lowerContent.includes('blue') || lowerContent.includes('butterfly')) {
      category = 'Blue Drinks';
    } else if (lowerContent.includes('foam') || lowerContent.includes('cold foam')) {
      category = 'Foam Experts';
    } else if (lowerContent.includes('budget') || lowerContent.includes('cheap') || lowerContent.includes('affordable')) {
      category = 'Budget Babe Brews';
    } else if (lowerContent.includes('viral') || lowerContent.includes('trending') || lowerContent.includes('tiktok')) {
      category = 'Viral Today';
    }

    // Build instructions text only if we have real content
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
    
    // If we don't have good extracted content, provide a clean template
    if (instructionsText.length < 50) {
      instructionsText = `RECIPE: ${recipeName || 'Imported Recipe'}\n\n`;
      instructionsText += `SOURCE: ${url.includes('tiktok.com') ? 'TikTok' : url.includes('instagram.com') ? 'Instagram' : 'Lemon8'}\n\n`;
      instructionsText += 'INGREDIENTS:\n(Please add ingredients from the original post)\n\n';
      instructionsText += 'INSTRUCTIONS:\n(Please add preparation steps from the original post)\n\n';
    }
    
    // Add source attribution
    instructionsText += `\nImported from: ${url}`;

    // Validate that we found meaningful content
    if (!recipeName && ingredients.length === 0 && instructionSteps.length === 0 && !primaryImageUrl) {
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
      imageUrl: primaryImageUrl,
      images: images.length > 0 ? images : undefined,
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
