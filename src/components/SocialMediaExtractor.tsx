
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

// Map extracted categories to valid database categories
const mapCategoryToValid = (extractedCategory: string): string => {
  const categoryMap: { [key: string]: string } = {
    'foam frenzy': 'Cold Drinks',
    'hot drinks': 'Hot Drinks',
    'cold drinks': 'Cold Drinks',
    'blended': 'Blended',
    'refreshers': 'Refreshers',
    'tea': 'Tea',
    'coffee': 'Hot Drinks',
    'frappuccino': 'Blended',
    'smoothie': 'Blended',
    'latte': 'Hot Drinks',
    'cappuccino': 'Hot Drinks',
    'espresso': 'Hot Drinks',
    'macchiato': 'Hot Drinks',
    'mocha': 'Hot Drinks',
    'americano': 'Hot Drinks',
    'refresher': 'Refreshers',
    'iced': 'Cold Drinks',
    'frozen': 'Blended',
    'shake': 'Blended',
    'juice': 'Cold Drinks'
  };

  const lowerExtracted = extractedCategory.toLowerCase();
  
  // Check for exact matches first
  if (categoryMap[lowerExtracted]) {
    return categoryMap[lowerExtracted];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerExtracted.includes(key) || key.includes(lowerExtracted)) {
      return value;
    }
  }
  
  // Default fallback
  return 'Cold Drinks';
};

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
      // Map the category to a valid one before passing to parent
      const mappedRecipe = {
        ...extractedRecipe,
        category: mapCategoryToValid(extractedRecipe.category)
      };
      
      onRecipeExtracted(mappedRecipe);
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
          recipe={{
            ...extractedRecipe,
            category: mapCategoryToValid(extractedRecipe.category)
          }}
          onUseRecipe={handleUseRecipe}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default SocialMediaExtractor;
