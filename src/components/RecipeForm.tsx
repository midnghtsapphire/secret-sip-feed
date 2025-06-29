
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin } from '@/hooks/useAdmin';
import RecipeFormHeader from './recipe-form/RecipeFormHeader';
import SocialImportSection from './recipe-form/SocialImportSection';
import ManualFormSection from './recipe-form/ManualFormSection';
import { formSchema, FormData } from './recipe-form/recipeFormSchema';
import { useRecipeFormHandlers } from './recipe-form/useRecipeFormHandlers';

interface RecipeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [showSocialExtractor, setShowSocialExtractor] = useState(false);
  const { isAdmin } = useAdmin();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      basePrice: initialData?.base_price || 0,
      prepTimeMinutes: initialData?.prep_time_minutes || 5,
      difficultyLevel: initialData?.difficulty_level || 1,
      instructions: initialData?.instructions || '',
      tags: initialData?.tags?.join(', ') || '',
      isPublic: initialData?.is_public || false,
    },
  });

  const { isSubmitting, handleRecipeExtracted, handleSubmit } = useRecipeFormHandlers({
    form,
    images,
    onSubmit
  });

  const handleRecipeExtractedWithImages = (extractedRecipe: any) => {
    if (extractedRecipe.images) setImages(extractedRecipe.images);
    handleRecipeExtracted(extractedRecipe);
    setShowSocialExtractor(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <RecipeFormHeader 
        isEditing={!!initialData}
        onCancel={onCancel}
      />

      {/* Social Import Section - Always visible at the top */}
      <div className="mb-8">
        <SocialImportSection 
          showSocialExtractor={showSocialExtractor}
          onToggleExtractor={setShowSocialExtractor}
          onRecipeExtracted={handleRecipeExtractedWithImages}
        />
      </div>

      {/* Manual Entry Form - Only show when not using social extractor */}
      {!showSocialExtractor && (
        <ManualFormSection
          form={form}
          images={images}
          onImagesChange={setImages}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          isAdmin={isAdmin}
          initialData={initialData}
        />
      )}
    </div>
  );
};

export default RecipeForm;
