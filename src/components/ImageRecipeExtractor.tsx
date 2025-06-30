
import React from 'react';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import { useImageExtraction } from './image-extractor/useImageExtraction';
import ImageUploadArea from './image-extractor/ImageUploadArea';
import ImagePreview from './image-extractor/ImagePreview';
import { ImageRecipeExtractorProps } from './image-extractor/types';

const ImageRecipeExtractor: React.FC<ImageRecipeExtractorProps> = ({ onRecipeExtracted }) => {
  const {
    selectedImage,
    imagePreview,
    isExtracting,
    extractionError,
    handleImageSelect,
    extractRecipe,
    clearImage
  } = useImageExtraction();

  const handleExtract = () => {
    extractRecipe(onRecipeExtracted);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Extract Recipe from Cup Image
      </h3>
      
      <div className="space-y-4">
        {!selectedImage ? (
          <ImageUploadArea onImageSelect={handleImageSelect} />
        ) : (
          <ImagePreview
            imagePreview={imagePreview}
            extractionError={extractionError}
            isExtracting={isExtracting}
            onExtract={handleExtract}
            onClear={clearImage}
          />
        )}
      </div>
    </Card>
  );
};

export default ImageRecipeExtractor;
