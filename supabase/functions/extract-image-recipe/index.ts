
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Analyzing image for recipe extraction...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Starbucks recipe extraction expert. Analyze images of drink cups and extract recipe information. Look for:
            1. Drink names written on cups or labels
            2. Ingredient lists or modifications
            3. Size information
            4. Any recipe instructions visible
            5. Flavor combinations or customizations
            
            Return ONLY a JSON object with this exact structure:
            {
              "name": "drink name (required)",
              "description": "brief description of the drink",
              "category": "one of: Pink Drinks, Blue Drinks, Green Teas, Foam Experts, Budget Babe Brews, Viral Today, Caramel Dreams, Merry Mocha, Expresso",
              "instructions": "step by step instructions if visible",
              "tags": ["tag1", "tag2"],
              "ingredients": ["ingredient1", "ingredient2"]
            }
            
            If you cannot clearly identify a drink recipe, return {"error": "No clear recipe information found in image"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract the recipe information from this drink cup image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response:', content);

    try {
      const extractedRecipe = JSON.parse(content);
      
      if (extractedRecipe.error) {
        return new Response(
          JSON.stringify({ error: extractedRecipe.error }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 422 
          }
        );
      }

      // Validate required fields
      if (!extractedRecipe.name || extractedRecipe.name.length < 3) {
        return new Response(
          JSON.stringify({ error: 'Could not extract a valid recipe name from the image' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 422 
          }
        );
      }

      // Ensure category is valid
      const validCategories = ['Pink Drinks', 'Blue Drinks', 'Green Teas', 'Foam Experts', 'Budget Babe Brews', 'Viral Today', 'Caramel Dreams', 'Merry Mocha', 'Expresso'];
      if (!validCategories.includes(extractedRecipe.category)) {
        extractedRecipe.category = 'Viral Today'; // Default category
      }

      // Ensure arrays are properly formatted
      if (!Array.isArray(extractedRecipe.tags)) {
        extractedRecipe.tags = [];
      }
      if (!Array.isArray(extractedRecipe.ingredients)) {
        extractedRecipe.ingredients = [];
      }

      console.log('Successfully extracted recipe:', extractedRecipe);

      return new Response(
        JSON.stringify({ recipe: extractedRecipe }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe information from image' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Error in extract-image-recipe function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
