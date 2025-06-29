
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { 
  sanitizeInput, 
  validateRecipeName, 
  validateRecipeDescription, 
  validateRecipeTags 
} from '@/utils/inputValidation';
import { FormData } from './recipeFormSchema';

interface UseRecipeFormHandlersProps {
  form: UseFormReturn<FormData>;
  images: string[];
  onSubmit: (data: any) => void;
}

export const useRecipeFormHandlers = ({
  form,
  images,
  onSubmit
}: UseRecipeFormHandlersProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRecipeExtracted = (extractedRecipe: any) => {
    if (extractedRecipe.name) form.setValue('name', extractedRecipe.name);
    if (extractedRecipe.description) form.setValue('description', extractedRecipe.description);
    if (extractedRecipe.category) form.setValue('category', extractedRecipe.category);
    if (extractedRecipe.instructions) form.setValue('instructions', extractedRecipe.instructions);
    if (extractedRecipe.tags) form.setValue('tags', extractedRecipe.tags.join(', '));
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Create the correctly formatted database object
      const sanitizedData = {
        name: sanitizeInput(data.name),
        description: sanitizeInput(data.description),
        category: data.category,
        instructions: sanitizeInput(data.instructions),
        tags: data.tags.split(',').map(tag => sanitizeInput(tag.trim())).filter(tag => tag.length > 0),
        images,
        base_price: data.basePrice,
        prep_time_minutes: data.prepTimeMinutes,
        difficulty_level: data.difficultyLevel,
        is_public: data.isPublic,
      };

      // Additional validation
      const nameValidation = validateRecipeName(sanitizedData.name);
      if (!nameValidation.isValid) {
        toast({
          title: "Validation Error",
          description: nameValidation.error,
          variant: "destructive",
        });
        return;
      }

      const descValidation = validateRecipeDescription(sanitizedData.description);
      if (!descValidation.isValid) {
        toast({
          title: "Validation Error", 
          description: descValidation.error,
          variant: "destructive",
        });
        return;
      }

      const tagsValidation = validateRecipeTags(sanitizedData.tags);
      if (!tagsValidation.isValid) {
        toast({
          title: "Validation Error",
          description: tagsValidation.error,
          variant: "destructive",
        });
        return;
      }

      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleRecipeExtracted,
    handleSubmit
  };
};
