
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import SocialMediaExtractor from '../SocialMediaExtractor';
import ImageRecipeExtractor from '../ImageRecipeExtractor';

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
  const handleRecipeExtracted = (recipe: any) => {
    // Call the parent handler and then close the extractor to show the manual form
    onRecipeExtracted(recipe);
    onToggleExtractor(false);
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Link className="w-5 h-5 text-pink-500" />
          Import Recipe
        </h2>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onToggleExtractor(!showSocialExtractor)}
          className="text-gray-600 hover:text-gray-800"
        >
          {showSocialExtractor ? (
            <>
              Hide <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Show Options <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {showSocialExtractor && (
        <div className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Quickly import recipes from social media or extract from cup images
          </div>

          {/* Social Media Extractor */}
          <SocialMediaExtractor onRecipeExtracted={handleRecipeExtracted} />

          {/* Image Recipe Extractor */}
          <ImageRecipeExtractor onRecipeExtracted={handleRecipeExtracted} />
        </div>
      )}
    </Card>
  );
};

export default SocialImportSection;
