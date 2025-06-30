
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
  images?: string[];
}

interface SocialMediaExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipe) => void;
}

// Map extracted categories to valid database categories
const mapCategoryToValid = (extractedCategory: string): string => {
  const categoryMap: { [key: string]: string } = {
    'cold drinks': 'Pink Drinks',
    'hot drinks': 'Merry Mocha',
    'foam frenzy': 'Foam Experts',
    'blended': 'Blue Drinks',
    'refreshers': 'Green Teas',
    'tea': 'Green Teas',
    'coffee': 'Merry Mocha',
    'frappuccino': 'Blue Drinks',
    'smoothie': 'Pink Drinks',
    'latte': 'Merry Mocha',
    'cappuccino': 'Merry Mocha',
    'espresso': 'Expresso',
    'macchiato': 'Merry Mocha',
    'mocha': 'Merry Mocha',
    'americano': 'Expresso',
    'refresher': 'Green Teas',
    'iced': 'Pink Drinks',
    'frozen': 'Blue Drinks',
    'shake': 'Pink Drinks',
    'juice': 'Pink Drinks',
    'pink': 'Pink Drinks',
    'blue': 'Blue Drinks',
    'green': 'Green Teas',
    'matcha': 'Green Teas',
    'strawberry': 'Pink Drinks',
    'caramel': 'Caramel Dreams',
    'chocolate': 'Merry Mocha'
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
  
  // Default fallback to Viral Today for new recipes
  return 'Viral Today';
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
      // Validate and clean up the recipe data before passing to parent
      let recipeName = extractedRecipe.name;
      
      // Fix numeric-only names from Instagram extraction
      if (/^\d+$/.test(recipeName)) {
        recipeName = `${extractedRecipe.source} Recipe ${recipeName}`;
      }
      
      // Ensure we have a meaningful description
      let description = extractedRecipe.description || '';
      if (!description && extractedRecipe.instructions) {
        description = extractedRecipe.instructions.substring(0, 200) + '...';
      }
      
      // Ensure we have proper image data
      const images = extractedRecipe.images || [];
      const imageUrl = extractedRecipe.imageUrl || images[0] || '';
      
      const mappedRecipe = {
        ...extractedRecipe,
        name: recipeName,
        description: description,
        category: mapCategoryToValid(extractedRecipe.category),
        images: images,
        imageUrl: imageUrl
      };
      
      console.log('Mapped recipe data:', mappedRecipe);
      
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
            name: /^\d+$/.test(extractedRecipe.name) ? `${extractedRecipe.source} Recipe ${extractedRecipe.name}` : extractedRecipe.name,
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
