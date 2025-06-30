
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Camera, X, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedRecipeData {
  name: string;
  description: string;
  category: string;
  instructions: string;
  tags: string[];
  ingredients?: string[];
}

interface ImageRecipeExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipeData & { imageUrl: string }) => void;
}

const ImageRecipeExtractor: React.FC<ImageRecipeExtractorProps> = ({ onRecipeExtracted }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Clear any previous errors
    setExtractionError('');
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractRecipeFromImage = async () => {
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
        throw new Error(error.message || 'Failed to call extraction function');
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
        
        // Include the image as part of the extracted recipe
        onRecipeExtracted({
          ...data.recipe,
          imageUrl: imagePreview
        });

        toast({
          title: "Recipe extracted successfully! 🎉",
          description: `Found recipe: "${data.recipe.name}"`,
        });

        // Reset the form
        setSelectedImage(null);
        setImagePreview('');
        setExtractionError('');
      } else {
        throw new Error('No recipe data found in response');
      }
    } catch (error) {
      console.error('Error extracting recipe from image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Extract Recipe from Cup Image
      </h3>
      
      <div className="space-y-4">
        {!selectedImage ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Upload an image of a drink cup with recipe information
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Works with images showing recipe names, ingredients, instructions, or menu details
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected cup"
                className="w-full max-h-64 object-contain rounded-lg border"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {extractionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800">Extraction Error</h4>
                    <p className="text-sm text-red-700 mt-1">{extractionError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={extractRecipeFromImage}
                disabled={isExtracting}
                className="flex-1"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Extract Recipe
                  </>
                )}
              </Button>
              
              <Button
                onClick={clearImage}
                variant="outline"
                disabled={isExtracting}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ImageRecipeExtractor;
