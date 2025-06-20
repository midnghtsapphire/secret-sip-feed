
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ExtractorFormProps {
  url: string;
  isExtracting: boolean;
  onUrlChange: (url: string) => void;
  onExtract: () => void;
}

const ExtractorForm: React.FC<ExtractorFormProps> = ({
  url,
  isExtracting,
  onUrlChange,
  onExtract
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 FORM SUBMIT: Form submitted with URL:', url);
    console.log('📝 FORM SUBMIT: isExtracting state:', isExtracting);
    console.log('📝 FORM SUBMIT: Calling onExtract function...');
    onExtract();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    console.log('📝 INPUT CHANGE: URL input changed to:', newUrl);
    onUrlChange(newUrl);
  };

  const handleButtonClick = () => {
    console.log('🔘 BUTTON CLICK: Extract Recipe button clicked directly');
    console.log('🔘 BUTTON CLICK: Current URL:', url);
    console.log('🔘 BUTTON CLICK: Current isExtracting:', isExtracting);
    console.log('🔘 BUTTON CLICK: Button disabled?', isExtracting || !url.trim());
    onExtract();
  };

  console.log('🎯 RENDER: ExtractorForm rendered with:', { url, isExtracting, hasUrl: !!url.trim() });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="social-url" className="block text-sm font-medium text-gray-700 mb-2">
          Social Media URL
        </label>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            id="social-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste TikTok, Instagram, or Lemon8 link here..."
            className="flex-1"
            disabled={isExtracting}
          />
          <Button 
            type="submit"
            disabled={isExtracting || !url.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
            onClick={handleButtonClick}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Recipe'
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-1">
          Supports TikTok, Instagram, Lemon8, YouTube, and Twitter/X recipe posts
        </p>
      </div>
    </div>
  );
};

export default ExtractorForm;
