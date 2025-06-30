
import { ExtractedRecipe } from './types.ts';

export class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractRecipeFromImage(imageBase64: string): Promise<ExtractedRecipe> {
    console.log('Starting image analysis for recipe extraction...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
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
                  url: imageBase64,
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
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response:', data);
      throw new Error('No response content from AI analysis');
    }

    console.log('OpenAI response content:', content);
    return this.parseResponse(content);
  }

  private getSystemPrompt(): string {
    return `You are an expert at reading drink recipes from images. Analyze the image carefully and extract ANY visible recipe information. Look for:
            
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
            
            Return ONLY a valid JSON object with this exact structure (no markdown formatting):
            {
              "name": "extracted drink name",
              "description": "detailed description of the drink and customizations",
              "category": "Green Teas",
              "instructions": "step by step instructions based on visible information",
              "tags": ["relevant", "tags"],
              "ingredients": ["base drink", "modifications", "toppings"]
            }
            
            If you can see ANY recipe-related text or drink information, extract it. If absolutely no drink information is visible, return {"error": "No recipe information found in image"}
            
            IMPORTANT: Return only pure JSON, no markdown code blocks or formatting.`;
  }

  private parseResponse(content: string): ExtractedRecipe {
    // Clean the response by removing markdown code blocks if present
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks (```json ... ```)
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned content for parsing:', cleanedContent);
    
    const extractedRecipe = JSON.parse(cleanedContent);
    
    if (extractedRecipe.error) {
      console.log('AI could not find recipe information:', extractedRecipe.error);
      throw new Error(extractedRecipe.error);
    }

    return extractedRecipe;
  }
}
