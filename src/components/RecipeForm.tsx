
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { X, Link as LinkIcon } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import SocialMediaExtractor from './SocialMediaExtractor';
import RecipeFormHeader from './recipe-form/RecipeFormHeader';
import RecipeFormFields from './recipe-form/RecipeFormFields';
import SocialImportSection from './recipe-form/SocialImportSection';
import type { Database } from '@/integrations/supabase/types';

type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];

interface RecipeFormProps {
  onSubmit: (data: Omit<RecipeInsert, 'user_id'>) => void;
  onCancel: () => void;
  initialData?: Partial<RecipeInsert>;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showSocialExtractor, setShowSocialExtractor] = useState(!initialData);
  const { isAdmin } = useAdmin();

  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'Pretty n Pink',
      image_url: initialData?.image_url || '',
      images: initialData?.image_url ? [initialData.image_url] : [],
      base_price: initialData?.base_price || 0,
      instructions: initialData?.instructions || '',
      difficulty_level: initialData?.difficulty_level || 1,
      prep_time_minutes: initialData?.prep_time_minutes || 5,
      tags: initialData?.tags?.join(', ') || '',
      is_public: initialData?.is_public !== undefined ? initialData.is_public : true,
    },
  });

  const categories = [
    'Pretty n Pink',
    'Mad Matchas', 
    'Blues Clues',
    'Foam Frenzy',
    'Mocha Magic',
    'Budget Babe Brews'
  ];

  const handleSocialRecipeExtracted = (extractedRecipe: any) => {
    console.log('Extracted recipe:', extractedRecipe);
    
    // Set all the extracted data
    if (extractedRecipe.name) {
      form.setValue('name', extractedRecipe.name);
    }
    
    if (extractedRecipe.description) {
      form.setValue('description', extractedRecipe.description);
    }
    
    if (extractedRecipe.category) {
      form.setValue('category', extractedRecipe.category);
    }
    
    // Handle multiple images
    const images = []
    if (extractedRecipe.images && Array.isArray(extractedRecipe.images)) {
      images.push(...extractedRecipe.images.filter(img => img && typeof img === 'string'))
    } else if (extractedRecipe.imageUrl && extractedRecipe.imageUrl !== '/placeholder.svg') {
      images.push(extractedRecipe.imageUrl)
    }
    
    if (images.length > 0) {
      form.setValue('images', images)
      form.setValue('image_url', images[0]) // Primary image
    }
    
    if (extractedRecipe.instructions) {
      form.setValue('instructions', extractedRecipe.instructions);
    }
    
    // Handle tags
    let tags = [];
    if (extractedRecipe.tags && Array.isArray(extractedRecipe.tags)) {
      tags = extractedRecipe.tags.filter(tag => tag && tag.length > 0);
    }
    form.setValue('tags', tags.join(', '));

    // Set other fields with defaults
    form.setValue('base_price', 5.50);
    form.setValue('difficulty_level', 2);
    form.setValue('prep_time_minutes', 10);
    form.setValue('is_public', true);

    setShowSocialExtractor(false);
  };

  const handleSubmit = (data: any) => {
    const recipeData = {
      ...data,
      // Use the first image as primary, handle the images array separately if needed
      image_url: data.images && data.images.length > 0 ? data.images[0] : data.image_url,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag.length > 0) : [],
      base_price: parseFloat(data.base_price) || 0,
    };
    
    console.log('Submitting recipe:', recipeData);
    onSubmit(recipeData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <RecipeFormHeader 
        isEditing={!!initialData} 
        onCancel={onCancel} 
      />

      {isAdmin && (
        <SocialImportSection
          showSocialExtractor={showSocialExtractor}
          onToggleExtractor={setShowSocialExtractor}
          onRecipeExtracted={handleSocialRecipeExtracted}
        />
      )}

      {!isAdmin && showSocialExtractor && (
        <div className="mb-6">
          <SocialMediaExtractor onRecipeExtracted={handleSocialRecipeExtracted} />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <RecipeFormFields
            form={form}
            categories={categories}
            isAdmin={isAdmin}
          />

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
