
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImageUploadAreaProps {
  onImageSelect: (file: File) => void;
}

const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
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
  );
};

export default ImageUploadArea;
