
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Link as LinkIcon } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import SocialMediaExtractor from './SocialMediaExtractor';
import type { Database } from '@/integrations/supabase/types';

type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];

interface RecipeFormProps {
  onSubmit: (data: Omit<RecipeInsert, 'user_id'>) => void;
  onCancel: () => void;
  initialData?: Partial<RecipeInsert>;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showSocialExtractor, setShowSocialExtractor] = useState(true);
  const { isAdmin } = useAdmin();

  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'Pink Drinks',
      image_url: initialData?.image_url || '',
      base_price: initialData?.base_price || 0,
      instructions: initialData?.instructions || '',
      difficulty_level: initialData?.difficulty_level || 1,
      prep_time_minutes: initialData?.prep_time_minutes || 5,
      tags: initialData?.tags?.join(', ') || '',
      is_public: initialData?.is_public !== undefined ? initialData.is_public : true,
    },
  });

  const categories = [
    'Pink Drinks',
    'Blue Drinks',
    'Green Teas',
    'Foam Experts',
    'Budget Babe Brews',
    'Viral Today'
  ];

  // Helper function to clean extracted text content
  const cleanContent = (content: string) => {
    if (!content) return '';
    
    return content
      // Remove image URLs and CDN links
      .replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)[^\s]*/gi, '')
      // Remove TikTok CDN URLs
      .replace(/tiktokcdn[^\s]+/gi, '')
      // Remove broken image markdown
      .replace(/!\[\]\([^)]*\)/g, '')
      // Remove excessive whitespace and line breaks
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      // Remove URL fragments
      .replace(/[?&][a-zA-Z0-9_]+=([^&\s]*)/g, '')
      .trim();
  };

  // Helper function to filter meaningful instructions
  const filterInstructions = (instructions: string[]) => {
    if (!Array.isArray(instructions)) return [];
    
    return instructions.filter(instruction => {
      const cleaned = cleanContent(instruction);
      return cleaned.length > 5 && 
             !cleaned.includes('tiktokcdn') && 
             !cleaned.includes('webp?') &&
             !cleaned.includes('jpeg?') &&
             !cleaned.match(/^https?:/);
    });
  };

  const handleSocialRecipeExtracted = (extractedRecipe: any) => {
    console.log('Full extracted recipe data:', extractedRecipe);
    
    // Clean up the recipe name
    let cleanName = extractedRecipe.name || '';
    cleanName = cleanName
      .replace(/^Lemon8\s*[·•]\s*/, '') 
      .replace(/\s*[·•]\s*@.+$/, '') 
      .replace(/Recipe Below[🍓]*/gi, '') 
      .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🍓🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, '') 
      .trim();

    // Clean up description
    let cleanDescription = extractedRecipe.description || '';
    if (cleanDescription === 'See the full post on Lemon8' || cleanDescription.length < 10) {
      cleanDescription = `Delicious ${cleanName.toLowerCase()} recipe imported from ${extractedRecipe.source || 'social media'}`;
    }

    // Build meaningful instructions with filtered content
    let instructionsText = '';
    
    // Filter and clean ingredients
    let meaningfulIngredients = [];
    if (extractedRecipe.ingredients && Array.isArray(extractedRecipe.ingredients)) {
      meaningfulIngredients = extractedRecipe.ingredients
        .map(ing => cleanContent(ing))
        .filter(ing => ing.length > 2 && !ing.includes('tiktokcdn'));
    }
    
    // Filter and clean instructions  
    let meaningfulInstructions = [];
    if (extractedRecipe.instructions && Array.isArray(extractedRecipe.instructions)) {
      meaningfulInstructions = filterInstructions(extractedRecipe.instructions)
        .map(inst => cleanContent(inst))
        .filter(inst => inst.length > 5);
    }
    
    // Clean the full content/description
    let cleanedContent = '';
    if (extractedRecipe.content && extractedRecipe.content.length > 50) {
      cleanedContent = cleanContent(extractedRecipe.content);
    }
    
    // Clean additional text
    let cleanedText = '';
    if (extractedRecipe.text && extractedRecipe.text.length > 20) {
      cleanedText = cleanContent(extractedRecipe.text);
    }
    
    // Build the final instructions
    if (meaningfulIngredients.length > 0) {
      instructionsText += 'INGREDIENTS:\n';
      meaningfulIngredients.forEach(ingredient => {
        instructionsText += `• ${ingredient}\n`;
      });
      instructionsText += '\n';
    }
    
    if (meaningfulInstructions.length > 0) {
      instructionsText += 'INSTRUCTIONS:\n';
      meaningfulInstructions.forEach((instruction, index) => {
        instructionsText += `${index + 1}. ${instruction}\n`;
      });
      instructionsText += '\n';
    }
    
    // Add cleaned content if meaningful
    if (cleanedContent && cleanedContent.length > 30) {
      instructionsText += 'RECIPE DETAILS:\n';
      instructionsText += cleanedContent + '\n\n';
    }
    
    // Add additional meaningful text
    if (cleanedText && cleanedText.length > 20 && cleanedText !== cleanedContent) {
      instructionsText += 'ADDITIONAL NOTES:\n';
      instructionsText += cleanedText + '\n\n';
    }
    
    // Fallback if no meaningful content
    if (!instructionsText.trim() || instructionsText.length < 50) {
      instructionsText = `RECIPE: ${cleanName}\n\n`;
      instructionsText += `This ${cleanName.toLowerCase()} recipe was imported from ${extractedRecipe.source || 'social media'}.\n\n`;
      instructionsText += 'PREPARATION:\n';
      instructionsText += 'Please refer to the original post for complete ingredient measurements and detailed preparation steps.\n\n';
      instructionsText += 'NOTES:\n';
      instructionsText += '• Check the original source for exact quantities\n';
      instructionsText += '• Adjust sweetness to taste\n';
      instructionsText += '• Serve immediately for best results\n\n';
    }
    
    // Add source attribution
    instructionsText += `\n---\nImported from: ${extractedRecipe.source || 'Social Media'}`;
    if (extractedRecipe.originalUrl) {
      instructionsText += `\nOriginal URL: ${extractedRecipe.originalUrl}`;
    }
    
    console.log('Final cleaned instructions:', instructionsText);
    
    // Update form values
    if (cleanName) {
      form.setValue('name', cleanName);
    }
    
    form.setValue('description', cleanDescription);
    
    if (extractedRecipe.category) {
      form.setValue('category', extractedRecipe.category);
    }
    
    if (extractedRecipe.imageUrl && extractedRecipe.imageUrl !== true) {
      form.setValue('image_url', extractedRecipe.imageUrl);
    }
    
    form.setValue('instructions', instructionsText);
    
    // Handle tags
    let tags = [];
    if (extractedRecipe.tags && Array.isArray(extractedRecipe.tags)) {
      tags = extractedRecipe.tags.filter(tag => tag && tag.length > 0);
    }
    
    tags.push('Imported', extractedRecipe.source || 'SocialMedia');
    
    if (extractedRecipe.category === 'Pink Drinks') {
      tags.push('Pink', 'Fruity');
    }
    
    form.setValue('tags', tags.join(', '));

    // Set estimated pricing
    const estimatedPrice = meaningfulIngredients.length 
      ? Math.max(4.50, meaningfulIngredients.length * 0.75)
      : 5.50;
    form.setValue('base_price', estimatedPrice);

    form.setValue('difficulty_level', 2);
    form.setValue('prep_time_minutes', 10);
    form.setValue('is_public', true);

    console.log('All form values after extraction:', form.getValues());
    
    form.trigger();
    setShowSocialExtractor(false);
  };

  const handleSubmit = (data: any) => {
    const recipeData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag.length > 0) : [],
      base_price: parseFloat(data.base_price) || 0,
    };
    
    console.log('Submitting recipe data:', recipeData);
    onSubmit(recipeData);
  };

  // Simple import-only interface for regular users
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import Recipe from Social Media</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-gray-600 mb-4">
            Import recipes directly from TikTok, Instagram, or Lemon8 posts
          </p>
        </div>

        <SocialMediaExtractor onRecipeExtracted={handleSocialRecipeExtracted} />

        {!showSocialExtractor && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pink Paradise Latte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your amazing recipe..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Recipe (Ingredients & Instructions)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Full recipe with ingredients and preparation steps..." 
                        className="min-h-[300px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600">
                  Create Recipe
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    );
  }

  // Full admin interface
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Edit Recipe' : 'Create New Recipe'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {!showSocialExtractor ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Import from Social Media</h3>
              <p className="text-sm text-gray-600">Extract recipe data from TikTok, Instagram, or Lemon8 posts</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowSocialExtractor(true)}
              variant="outline"
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              <LinkIcon size={16} className="mr-2" />
              Import
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <SocialMediaExtractor onRecipeExtracted={handleSocialRecipeExtracted} />
          <Button
            type="button"
            onClick={() => setShowSocialExtractor(false)}
            variant="outline"
            className="mt-4 w-full"
          >
            Manual Entry Instead
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipe Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pink Paradise Latte" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your amazing recipe..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions & Recipe Details</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Full recipe instructions including ingredients and preparation steps..." 
                    className="min-h-[200px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="difficulty_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty (1-5)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prep_time_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prep Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="viral, trendy, budget-friendly" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              {...form.register('is_public')}
              className="rounded"
            />
            <label htmlFor="is_public" className="text-sm font-medium">
              Make this recipe public (recommended - share with the community!)
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600">
              {initialData ? 'Update Recipe' : 'Create Recipe'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RecipeForm;
