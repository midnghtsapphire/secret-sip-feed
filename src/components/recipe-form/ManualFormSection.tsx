
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import RecipeFormFields from './RecipeFormFields';
import ImageUpload from './ImageUpload';
import { FormData } from './recipeFormSchema';

interface ManualFormSectionProps {
  form: UseFormReturn<FormData>;
  images: string[];
  onImagesChange: (images: string[]) => void;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isAdmin: boolean;
  initialData?: any;
}

const ManualFormSection: React.FC<ManualFormSectionProps> = ({
  form,
  images,
  onImagesChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isAdmin,
  initialData
}) => {
  // Watch specific fields to ensure proper reactivity
  const nameValue = form.watch('name');
  const categoryValue = form.watch('category');
  
  // Simplified validation - just check if name exists and has minimum length, and category is selected
  const isFormValid = nameValue && nameValue.trim().length >= 2 && categoryValue && categoryValue.trim().length > 0;
  
  console.log('🔍 Form validation check:', {
    nameValue,
    categoryValue,
    isFormValid,
    nameLength: nameValue?.length || 0,
    isSubmitting
  });

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('📛 Cancel button clicked');
    onCancel();
  };

  const handleFormSubmit = (data: FormData) => {
    console.log('📝 Form submitted with data:', data);
    onSubmit(data);
  };
  
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Or Enter Recipe Details Manually</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <RecipeFormFields 
            form={form} 
            categories={[]}
            isAdmin={isAdmin}
          />
          
          <ImageUpload
            images={images}
            onImagesChange={onImagesChange}
            maxImages={5}
          />

          <div className="flex gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelClick}
              disabled={isSubmitting}
              className="hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update Recipe' : 'Create Recipe')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ManualFormSection;
