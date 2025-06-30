
export interface ExtractedRecipeData {
  name: string;
  description: string;
  category: string;
  instructions: string;
  tags: string[];
  ingredients?: string[];
}

export interface ImageRecipeExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipeData & { imageUrl: string }) => void;
}
