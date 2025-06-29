
// Shared types and interfaces for recipe extraction
export interface ExtractedRecipe {
  name: string;
  description: string;
  category: string;
  instructions: string;
  tags: string[];
  imageUrl: string;
  images: string[];
  source: string;
  originalUrl: string;
}
