
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
      console.error('No image provided in request');
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
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase Edge Function Secrets.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Starting image analysis for recipe extraction...');

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
            content: `You are an expert at reading drink recipes from images. Analyze the image carefully and extract ANY visible recipe information. Look for:
            
            1. Drink names (on cups, labels, screens, or text anywhere in the image)
            2. Ingredient lists, modifications, or add-ons
            3. Size information (Tall, Grande, Venti)
            4. Recipe instructions or customizations
            5. Toppings or special preparations
            6. ANY text that describes how to make the drink
            
            Be very thorough - read ALL text in the image, including:
            - Text on cups or containers
            - Menu displays or screens
            - Written instructions or notes
            - Labels or stickers
            - Any overlay text or captions
            
            Return ONLY a JSON object with this exact structure:
            {
              "name": "extracted drink name",
              "description": "detailed description of the drink and customizations",
              "category": "Green Teas",
              "instructions": "step by step instructions based on visible information",
              "tags": ["relevant", "tags"],
              "ingredients": ["base drink", "modifications", "toppings"]
            }
            
            If you can see ANY recipe-related text or drink information, extract it. If absolutely no drink information is visible, return {"error": "No recipe information found in image"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please carefully analyze this image and extract all visible recipe information. Look at all text, labels, and any drink-related details:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error (${response.status}): ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response:', data);
      return new Response(
        JSON.stringify({ error: 'No response content from AI analysis' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('OpenAI response content:', content);

    try {
      const extractedRecipe = JSON.parse(content);
      
      if (extractedRecipe.error) {
        console.log('AI could not find recipe information:', extractedRecipe.error);
        return new Response(
          JSON.stringify({ error: extractedRecipe.error }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 422 
          }
        );
      }

      // Validate required fields
      if (!extractedRecipe.name || extractedRecipe.name.length < 2) {
        console.error('Extracted recipe missing valid name:', extractedRecipe);
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

      // Add default values if missing
      if (!extractedRecipe.description) {
        extractedRecipe.description = `A delicious ${extractedRecipe.name} recipe`;
      }
      if (!extractedRecipe.instructions) {
        extractedRecipe.instructions = 'Follow the standard preparation method for this drink.';
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
      console.error('Raw response content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe information from image analysis' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Error in extract-image-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
