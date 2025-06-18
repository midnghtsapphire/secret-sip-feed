import React, { useState } from 'react';
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
      is_public: initialData?.is_public || false,
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
    // Populate form with extracted data
    form.setValue('name', extractedRecipe.name);
    form.setValue('description', extractedRecipe.description);
    form.setValue('category', extractedRecipe.category);
    form.setValue('image_url', extractedRecipe.imageUrl);
    
    if (extractedRecipe.instructions && Array.isArray(extractedRecipe.instructions)) {
      form.setValue('instructions', extractedRecipe.instructions.join('\n\n'));
    }
    
    if (extractedRecipe.tags && Array.isArray(extractedRecipe.tags)) {
      form.setValue('tags', extractedRecipe.tags.join(', '));
    }

    // Add source tag
    const currentTags = form.getValues('tags');
    const sourceTag = `ImportedFrom${extractedRecipe.source}`;
    form.setValue('tags', currentTags ? `${currentTags}, ${sourceTag}` : sourceTag);

    setShowSocialExtractor(false);
  };

  const handleSubmit = (data: any) => {
    const recipeData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
      base_price: parseFloat(data.base_price) || 0,
    };
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Textarea placeholder="Step by step instructions..." {...field} />
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
              Make this recipe public
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
