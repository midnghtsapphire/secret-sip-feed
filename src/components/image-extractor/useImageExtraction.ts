
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
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const extractRecipe = async (onSuccess: (recipe: ExtractedRecipeData & { imageUrl: string }) => void) => {
    if (!selectedImage) {
      console.log('No image selected for extraction');
      return;
    }

    setIsExtracting(true);
    setExtractionError('');
    
    try {
      console.log('🔄 Starting image extraction process...');
      const base64Image = await convertToBase64(selectedImage);
      
      console.log('📷 Image converted to base64, calling extraction function...');
      
      const { data, error } = await supabase.functions.invoke('extract-image-recipe', {
        body: { image: base64Image }
      });

      console.log('📡 Supabase function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to call extraction function');
      }

      if (data?.error) {
        console.error('❌ Extraction function returned error:', data.error);
        const errorMessage = data.error;
        setExtractionError(errorMessage);
        
        toast({
          title: "Extraction failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.recipe) {
        console.log('✅ Recipe extracted successfully:', data.recipe);
        
        onSuccess({
          ...data.recipe,
          imageUrl: imagePreview
        });

        toast({
          title: "Recipe extracted successfully! 🎉",
          description: `Found recipe: "${data.recipe.name}" - Image preserved for recipe creation`,
        });
      } else {
        throw new Error('No recipe data found in response');
      }
    } catch (error) {
      console.error('❌ Error extracting recipe from image:', error);
      
      let errorMessage = 'Failed to extract recipe from image';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('OpenAI API key')) {
        errorMessage = "OpenAI API key not configured. Please contact support.";
      } else if (errorMessage.includes('Failed to call extraction function')) {
        errorMessage = "Service temporarily unavailable. Please try again later.";
      } else if (errorMessage === 'Failed to extract recipe from image') {
        errorMessage = "Could not extract recipe from image. Please try a clearer image with visible text.";
      }
      
      setExtractionError(errorMessage);
      
      toast({
        title: "Extraction failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      console.log('🏁 Image extraction process completed');
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
