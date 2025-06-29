
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import RecipeFormHeader from './recipe-form/RecipeFormHeader';
import RecipeFormFields from './recipe-form/RecipeFormFields';
import ImageUpload from './recipe-form/ImageUpload';
import SocialImportSection from './recipe-form/SocialImportSection';
import { 
  sanitizeInput, 
  validateRecipeName, 
  validateRecipeDescription, 
  validateRecipeInstructions,
  validateRecipeTags 
} from '@/utils/inputValidation';

// Enhanced form schema with security validation
const formSchema = z.object({
  name: z.string()
    .min(2, 'Recipe name must be at least 2 characters')
    .max(100, 'Recipe name must be less than 100 characters')
    .refine((val) => validateRecipeName(val).isValid, {
      message: 'Recipe name contains invalid characters'
    }),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .refine((val) => validateRecipeDescription(val).isValid, {
      message: 'Description contains invalid content'
    }),
  category: z.string().min(1, 'Please select a category'),
  basePrice: z.number().min(0, 'Price must be positive').max(50, 'Price seems too high'),
  prepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 minute').max(480, 'Prep time seems too long'),
  difficultyLevel: z.number().min(1).max(5),
  instructions: z.string()
    .max(2000, 'Instructions must be less than 2000 characters')
    .refine((val) => validateRecipeInstructions(val).isValid, {
      message: 'Instructions contain invalid content'
    }),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .refine((val) => validateRecipeTags(val).isValid, {
      message: 'Tags contain invalid characters'
    }),
  isPublic: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface RecipeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      tags: initialData?.tags || [],
      isPublic: initialData?.is_public || false,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Sanitize all string inputs before submission
      const sanitizedData = {
        ...data,
        name: sanitizeInput(data.name),
        description: sanitizeInput(data.description),
        instructions: sanitizeInput(data.instructions),
        tags: data.tags.map(tag => sanitizeInput(tag)).filter(tag => tag.length > 0),
        images,
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <RecipeFormHeader 
        isEditing={!!initialData}
        onCancel={onCancel}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <RecipeFormFields form={form} />
          
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />

          <SocialImportSection />

          <div className="flex gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update Recipe' : 'Create Recipe')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RecipeForm;
