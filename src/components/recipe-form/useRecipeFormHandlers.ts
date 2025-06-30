
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

// Category mapping for social extraction compatibility
const categoryMapping: Record<string, string> = {
  'Pretty n Pink': 'Pink Drinks',
  'Mad Matchas': 'Green Teas', 
  'Blues Clues': 'Blue Drinks',
  'Foam Frenzy': 'Foam Experts',
  'Cold Drinks': 'Viral Today', // New recipes should go to Viral Today
  'Hot Drinks': 'Merry Mocha',
  'Iced Drinks': 'Blue Drinks'
};

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
    if (extractedRecipe.category) {
      // Map the category to a valid database enum value
      const mappedCategory = categoryMapping[extractedRecipe.category] || extractedRecipe.category;
      const validCategories = ['Pink Drinks', 'Blue Drinks', 'Green Teas', 'Foam Experts', 'Budget Babe Brews', 'Viral Today', 'Caramel Dreams', 'Merry Mocha', 'Expresso'];
      
      if (validCategories.includes(mappedCategory)) {
        form.setValue('category', mappedCategory);
      } else {
        // Default to Viral Today for new recipes
        form.setValue('category', 'Viral Today');
      }
    }
    if (extractedRecipe.instructions) form.setValue('instructions', extractedRecipe.instructions);
    if (extractedRecipe.tags) form.setValue('tags', extractedRecipe.tags.join(', '));
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Form submission - Images array:', images);
      console.log('Form submission - Form data:', data);
      
      // Create the correctly formatted database object
      const sanitizedData = {
        name: sanitizeInput(data.name),
        description: sanitizeInput(data.description),
        category: data.category,
        instructions: sanitizeInput(data.instructions),
        tags: data.tags.split(',').map(tag => sanitizeInput(tag.trim())).filter(tag => tag.length > 0),
        images: images || [], // Ensure images array is included
        base_price: data.basePrice,
        prep_time_minutes: data.prepTimeMinutes,
        difficulty_level: data.difficultyLevel,
        is_public: data.isPublic,
      };

      console.log('Sanitized data being submitted:', sanitizedData);

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
