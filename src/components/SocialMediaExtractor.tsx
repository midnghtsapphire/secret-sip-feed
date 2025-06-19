
import React from 'react';
import ExtractorForm from './extractor/ExtractorForm';
import ErrorDisplay from './extractor/ErrorDisplay';
import RecipePreview from './extractor/RecipePreview';
import { useRecipeExtraction } from './extractor/useRecipeExtraction';

interface ExtractedRecipe {
  name: string;
  description: string;
  imageUrl: string;
  ingredients?: string[];
  instructions?: string;
  menuItems?: Array<{
    name: string;
    type: string;
    quantity?: string;
  }>;
  tags?: string[];
  category: string;
  source: string;
  originalUrl: string;
}

interface SocialMediaExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipe) => void;
}

const SocialMediaExtractor: React.FC<SocialMediaExtractorProps> = ({ onRecipeExtracted }) => {
  const {
    url,
    setUrl,
    isExtracting,
    extractedRecipe,
    lastError,
    handleExtract,
    handleReset,
    setExtractedRecipe
  } = useRecipeExtraction();

  const handleUseRecipe = () => {
    if (extractedRecipe) {
      onRecipeExtracted(extractedRecipe);
      setExtractedRecipe(null);
      setUrl('');
    }
  };

  return (
    <div className="space-y-6">
      <ExtractorForm
        url={url}
        isExtracting={isExtracting}
        onUrlChange={setUrl}
        onExtract={handleExtract}
      />

      {lastError && (
        <ErrorDisplay error={lastError} onReset={handleReset} />
      )}

      {extractedRecipe && (
        <RecipePreview
          recipe={extractedRecipe}
          onUseRecipe={handleUseRecipe}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default SocialMediaExtractor;
