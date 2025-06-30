
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptionsRequest, createResponse, createErrorResponse } from './cors.ts';
import { OpenAIClient } from './openai-client.ts';
import { RecipeValidator } from './recipe-validator.ts';
import { ExtractionRequest } from './types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    const { image }: ExtractionRequest = await req.json();
    
    if (!image) {
      console.error('No image provided in request');
      return createErrorResponse('Image is required', 400);
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return createErrorResponse('OpenAI API key not configured. Please set OPENAI_API_KEY in Supabase Edge Function Secrets.', 500);
    }

    const openAIClient = new OpenAIClient(openAIApiKey);
    
    try {
      const extractedRecipe = await openAIClient.extractRecipeFromImage(image);
      const validatedRecipe = RecipeValidator.validate(extractedRecipe);

      console.log('Successfully extracted recipe:', validatedRecipe);

      return createResponse({ recipe: validatedRecipe });

    } catch (extractionError) {
      if (extractionError.message.includes('No recipe information found')) {
        console.log('AI could not find recipe information:', extractionError.message);
        return createErrorResponse(extractionError.message, 422);
      }
      
      if (extractionError.message.includes('Could not extract a valid recipe name')) {
        console.error('Validation error:', extractionError.message);
        return createErrorResponse(extractionError.message, 422);
      }

      throw extractionError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('Error in extract-image-recipe function:', error);
    
    if (error.message?.includes('Failed to parse')) {
      return createErrorResponse('Failed to parse recipe information from image analysis', 500);
    }
    
    return createErrorResponse(`Internal server error: ${error.message}`, 500);
  }
});
