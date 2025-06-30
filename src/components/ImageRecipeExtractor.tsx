
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
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
    try {
      const base64Image = await convertToBase64(selectedImage);
      
      console.log('Extracting recipe from image...');
      
      const { data, error } = await supabase.functions.invoke('extract-image-recipe', {
        body: { image: base64Image }
      });

      if (error) {
        console.error('Error extracting recipe:', error);
        throw error;
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
      } else {
        throw new Error('No recipe data found in response');
      }
    } catch (error) {
      console.error('Error extracting recipe from image:', error);
      toast({
        title: "Extraction failed",
        description: "Could not extract recipe from image. Please try a clearer image or check if there's readable text on the cup.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
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
              Works best with clear images showing recipe names, ingredients, or instructions on cups
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
            
            <div className="flex gap-2">
              <Button
                onClick={extractRecipeFromImage}
                disabled={isExtracting}
                className="flex-1"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Recipe...
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
