
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2, AlertTriangle } from 'lucide-react';

interface ImagePreviewProps {
  imagePreview: string;
  extractionError: string;
  isExtracting: boolean;
  onExtract: () => void;
  onClear: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imagePreview,
  extractionError,
  isExtracting,
  onExtract,
  onClear
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <img
          src={imagePreview}
          alt="Selected cup"
          className="w-full max-h-64 object-contain rounded-lg border"
        />
        <button
          onClick={onClear}
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
          onClick={onExtract}
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
          onClick={onClear}
          variant="outline"
          disabled={isExtracting}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default ImagePreview;
