
import { ExtractedRecipe } from './types.ts';

export class RecipeValidator {
  static validate(recipe: ExtractedRecipe): ExtractedRecipe {
    // Validate required fields
    if (!recipe.name || recipe.name.length < 2) {
      console.error('Extracted recipe missing valid name:', recipe);
      throw new Error('Could not extract a valid recipe name from the image');
    }

    // Ensure category is valid
    const validCategories = ['Pink Drinks', 'Blue Drinks', 'Green Teas', 'Foam Experts', 'Budget Babe Brews', 'Viral Today', 'Caramel Dreams', 'Merry Mocha', 'Expresso'];
    if (!validCategories.includes(recipe.category)) {
      recipe.category = 'Viral Today'; // Default category
    }

    // Ensure arrays are properly formatted
    if (!Array.isArray(recipe.tags)) {
      recipe.tags = [];
    }
    if (!Array.isArray(recipe.ingredients)) {
      recipe.ingredients = [];
    }

    // Add default values if missing
    if (!recipe.description) {
      recipe.description = `A delicious ${recipe.name} recipe`;
    }
    if (!recipe.instructions) {
      recipe.instructions = 'Follow the standard preparation method for this drink.';
    }

    return recipe;
  }
}
