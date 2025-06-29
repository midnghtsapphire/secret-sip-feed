
import React from 'react';
import RecipeManagerHeader from './RecipeManagerHeader';
import RecipeList from './RecipeList';
import EmptyRecipeState from './EmptyRecipeState';

interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  prep_time_minutes: number;
  difficulty_level: number;
  tags?: string[];
  is_public: boolean;
  image_url?: string;
  images?: string[];
}

interface RecipeManagerContentProps {
  isAdmin: boolean;
  currentUserId: string;
  isLoading: boolean;
  recipes: Recipe[];
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string, userId: string) => void;
  onTogglePrivacy: (id: string, isPublic: boolean) => void;
}

const RecipeManagerContent: React.FC<RecipeManagerContentProps> = ({
  isAdmin,
  currentUserId,
  isLoading,
  recipes,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onTogglePrivacy,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <RecipeManagerHeader onAddRecipe={onAddRecipe} />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {isAdmin ? 'All Recipes' : 'Your Recipes'}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading recipes...</p>
          </div>
        ) : recipes.length > 0 ? (
          <RecipeList
            recipes={recipes}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            onEditRecipe={onEditRecipe}
            onDeleteRecipe={onDeleteRecipe}
            onTogglePrivacy={onTogglePrivacy}
          />
        ) : (
          <EmptyRecipeState onCreateRecipe={onAddRecipe} />
        )}
      </div>
    </div>
  );
};

export default RecipeManagerContent;
