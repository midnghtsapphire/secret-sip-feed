
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
  menuItems: Array<{
    name: string;
    type: string;
    quantity?: string;
  }>;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all menu items to match against
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('name, type, description');

    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Extracting recipe from:', url);

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
      throw new Error(`Firecrawl API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to scrape content');
    }

    const { markdown, html, metadata } = data.data;
    
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

    // Enhanced text processing for menu item extraction
    const fullText = [markdown, metadata?.title, metadata?.description].filter(Boolean).join(' ').toLowerCase();
    
    console.log('Full text for analysis:', fullText.substring(0, 500));

    // Create comprehensive menu item matching patterns
    const menuItemMatches: Array<{name: string; type: string; quantity?: string}> = [];
    
    if (menuItems) {
      for (const item of menuItems) {
        const itemName = item.name.toLowerCase();
        const baseNames = [
          itemName,
          itemName.replace(' syrup', ''),
          itemName.replace(' milk', ''),
          itemName.replace(' sauce', ''),
          itemName.replace(' drizzle', ''),
        ];
        
        for (const baseName of baseNames) {
          // Look for quantity + item patterns
          const quantityPatterns = [
            new RegExp(`(\\d+(?:\\.\\d+)?|half|one|two|three|four|five)\\s*(?:pumps?|shots?|splashes?|drops?)\\s*(?:of\\s*)?${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'),
            new RegExp(`${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:x|×)\\s*(\\d+)`, 'gi'),
            new RegExp(`(\\d+)\\s*${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'),
          ];
          
          for (const pattern of quantityPatterns) {
            const matches = fullText.matchAll(pattern);
            for (const match of matches) {
              const quantity = match[1] || 'standard';
              menuItemMatches.push({
                name: item.name,
                type: item.type,
                quantity: quantity
              });
              console.log(`Found menu item: ${item.name} (${quantity})`);
            }
          }
          
          // Simple name matching without quantity
          if (fullText.includes(baseName)) {
            // Avoid duplicates
            const exists = menuItemMatches.some(m => m.name === item.name);
            if (!exists) {
              menuItemMatches.push({
                name: item.name,
                type: item.type
              });
              console.log(`Found menu item: ${item.name}`);
            }
          }
        }
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
    const contentLower = fullText.toLowerCase();
    
    if (contentLower.includes('green tea') || contentLower.includes('matcha')) {
      category = 'Green Teas';
    } else if (contentLower.includes('blue') || contentLower.includes('butterfly')) {
      category = 'Blue Drinks';
    } else if (contentLower.includes('foam') || contentLower.includes('cold foam')) {
      category = 'Foam Experts';
    } else if (contentLower.includes('budget') || contentLower.includes('cheap') || contentLower.includes('affordable')) {
      category = 'Budget Babe Brews';
    } else if (contentLower.includes('viral') || contentLower.includes('trending') || contentLower.includes('tiktok')) {
      category = 'Viral Today';
    }

    // Build instructions text
    let instructionsText = '';
    
    if (menuItemMatches.length > 0) {
      instructionsText += 'MENU ITEMS NEEDED:\n';
      const grouped = menuItemMatches.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {} as Record<string, typeof menuItemMatches>);
      
      Object.entries(grouped).forEach(([type, items]) => {
        instructionsText += `\n${type.toUpperCase()}S:\n`;
        items.forEach(item => {
          instructionsText += `• ${item.name}${item.quantity ? ` (${item.quantity})` : ''}\n`;
        });
      });
      instructionsText += '\n';
    }
    
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
    if (!recipeName && menuItemMatches.length === 0 && ingredients.length === 0) {
      throw new Error('No recipe content could be extracted from this URL. Please check that the post contains a drink recipe with ingredients or menu items.');
    }

    const extractedRecipe: ExtractedRecipe = {
      name: recipeName || 'Imported Recipe',
      description: metadata?.description || `Delicious drink recipe imported from social media`,
      instructions: instructionsText,
      ingredients: ingredients,
      menuItems: menuItemMatches,
      imageUrl: imageUrl,
      category: category,
      source: url.includes('tiktok.com') ? 'TikTok' : 
               url.includes('instagram.com') ? 'Instagram' : 
               url.includes('lemon8-app.com') ? 'Lemon8' : 'Social Media',
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
        error: 'Failed to extract recipe', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
