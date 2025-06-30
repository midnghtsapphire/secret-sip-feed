
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedRecipeData } from './types';

export const useImageExtraction = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setExtractionError('');
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractRecipe = async (onSuccess: (recipe: ExtractedRecipeData & { imageUrl: string }) => void) => {
    if (!selectedImage) return;

    setIsExtracting(true);
    setExtractionError('');
    
    try {
      const base64Image = await convertToBase64(selectedImage);
      
      console.log('Starting recipe extraction from image...');
      
      const { data, error } = await supabase.functions.invoke('extract-image-recipe', {
        body: { image: base64Image }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        const errorMessage = typeof error === 'string' ? error : error.message || 'Failed to call extraction function';
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('Extraction function returned error:', data.error);
        setExtractionError(data.error);
        
        toast({
          title: "Extraction failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data?.recipe) {
        console.log('Recipe extracted successfully:', data.recipe);
        
        onSuccess({
          ...data.recipe,
          imageUrl: imagePreview
        });

        toast({
          title: "Recipe extracted successfully! 🎉",
          description: `Found recipe: "${data.recipe.name}"`,
        });

        clearImage();
      } else {
        throw new Error('No recipe data found in response');
      }
    } catch (error) {
      console.error('Error extracting recipe from image:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle cases where error might be an object with a message property
        errorMessage = (error as any).message || (error as any).error || 'Unknown error occurred';
      }
      
      setExtractionError(errorMessage);
      
      toast({
        title: "Extraction failed",
        description: errorMessage.includes('OpenAI API key') 
          ? "OpenAI API key not configured. Please contact support."
          : "Could not extract recipe from image. Please try a clearer image with visible text.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setExtractionError('');
  };

  return {
    selectedImage,
    imagePreview,
    isExtracting,
    extractionError,
    handleImageSelect,
    extractRecipe,
    clearImage
  };
};
