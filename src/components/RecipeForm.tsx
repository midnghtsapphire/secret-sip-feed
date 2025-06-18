
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import SocialMediaExtractor from './SocialMediaExtractor';
import type { Database } from '@/integrations/supabase/types';

type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface RecipeFormProps {
  onSubmit: (data: Omit<RecipeInsert, 'user_id'>) => void;
  onCancel: () => void;
  initialData?: Partial<RecipeInsert>;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { groupedMenuItems } = useMenuItems();
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    menu_item_id: string;
    quantity: string;
    is_optional: boolean;
    notes: string;
  }>>([]);
  const [showSocialExtractor, setShowSocialExtractor] = useState(false);

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

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, {
      menu_item_id: '',
      quantity: '',
      is_optional: false,
      notes: ''
    }]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  const handleSocialRecipeExtracted = (extractedRecipe: any) => {
    console.log('Extracted recipe data:', extractedRecipe);
    
    // Clean up the recipe name - remove platform references and extra text
    let cleanName = extractedRecipe.name || '';
    cleanName = cleanName
      .replace(/^Lemon8\s*[·•]\s*/, '') // Remove "Lemon8 · " prefix
      .replace(/\s*[·•]\s*@.+$/, '') // Remove " · @username" suffix
      .replace(/Recipe Below[🍓]*/gi, '') // Remove "Recipe Below" text
      .replace(/[🍫🍓]+/g, '') // Remove excessive emojis
      .trim();

    // Populate form with extracted data
    if (cleanName) {
      form.setValue('name', cleanName);
    }
    
    if (extractedRecipe.description && extractedRecipe.description !== 'See the full post on Lemon8') {
      form.setValue('description', extractedRecipe.description);
    } else {
      // Create a better description from the cleaned name
      form.setValue('description', `Delicious ${cleanName.toLowerCase()} imported from ${extractedRecipe.source || 'social media'}`);
    }
    
    if (extractedRecipe.category) {
      form.setValue('category', extractedRecipe.category);
    }
    
    if (extractedRecipe.imageUrl) {
      form.setValue('image_url', extractedRecipe.imageUrl);
    }
    
    // Handle instructions - create meaningful instructions from ingredients if available
    if (extractedRecipe.instructions && Array.isArray(extractedRecipe.instructions) && extractedRecipe.instructions.length > 0) {
      const instructionsText = extractedRecipe.instructions
        .filter(instruction => instruction && instruction.trim() && instruction.length > 5)
        .join('\n\n');
      if (instructionsText) {
        form.setValue('instructions', instructionsText);
      }
    } else if (extractedRecipe.ingredients && Array.isArray(extractedRecipe.ingredients)) {
      // Create instructions from ingredients
      const ingredientInstructions = extractedRecipe.ingredients
        .map((ingredient, index) => `${index + 1}. Add ${ingredient.toLowerCase()}`)
        .join('\n');
      const fullInstructions = `${ingredientInstructions}\n\n${extractedRecipe.ingredients.length + 1}. Mix well and enjoy!\n\nNote: This recipe was imported from ${extractedRecipe.source}. Please refer to the original post for detailed preparation steps.`;
      form.setValue('instructions', fullInstructions);
    }
    
    // Handle tags - clean up and add meaningful tags
    let tags = [];
    if (extractedRecipe.tags && Array.isArray(extractedRecipe.tags)) {
      tags = extractedRecipe.tags.filter(tag => tag && tag.length > 0);
    }
    
    // Add source and import tags
    tags.push('Imported', extractedRecipe.source || 'SocialMedia');
    
    // Add category-based tags
    if (extractedRecipe.category === 'Pink Drinks') {
      tags.push('Pink', 'Fruity');
    }
    
    form.setValue('tags', tags.join(', '));

    // Set estimated pricing based on complexity
    const estimatedPrice = extractedRecipe.ingredients?.length 
      ? Math.max(4.50, extractedRecipe.ingredients.length * 0.75)
      : 5.50;
    form.setValue('base_price', estimatedPrice);

    // Set reasonable defaults for other fields
    form.setValue('difficulty_level', 2); // Medium difficulty for imported recipes
    form.setValue('prep_time_minutes', 10); // Default 10 minutes

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
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Step by step instructions..." 
                    className="min-h-[160px]"
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
