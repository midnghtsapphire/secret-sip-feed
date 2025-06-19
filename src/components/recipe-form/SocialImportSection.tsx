
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import SocialMediaExtractor from '../SocialMediaExtractor';

interface SocialImportSectionProps {
  showSocialExtractor: boolean;
  onToggleExtractor: (show: boolean) => void;
  onRecipeExtracted: (recipe: any) => void;
}

const SocialImportSection: React.FC<SocialImportSectionProps> = ({
  showSocialExtractor,
  onToggleExtractor,
  onRecipeExtracted
}) => {
  if (!showSocialExtractor) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Import from Social Media</h3>
            <p className="text-sm text-gray-600">Extract recipe data from TikTok, Instagram, or Lemon8 posts</p>
          </div>
          <Button
            type="button"
            onClick={() => onToggleExtractor(true)}
            variant="outline"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <LinkIcon size={16} className="mr-2" />
            Import
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <SocialMediaExtractor onRecipeExtracted={onRecipeExtracted} />
      <Button
        type="button"
        onClick={() => onToggleExtractor(false)}
        variant="outline"
        className="mt-4 w-full"
      >
        Manual Entry Instead
      </Button>
    </div>
  );
};

export default SocialImportSection;
