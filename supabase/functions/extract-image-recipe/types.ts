
export interface ExtractedRecipe {
  name: string;
  description: string;
  category: string;
  instructions: string;
  tags: string[];
  ingredients: string[];
}

export interface ExtractionRequest {
  image: string;
}

export interface ExtractionResponse {
  recipe?: ExtractedRecipe;
  error?: string;
}
