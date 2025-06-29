
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RecipePrivacyToggle from '@/components/RecipePrivacyToggle';

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

interface RecipeListProps {
  recipes: Recipe[];
  isAdmin: boolean;
  currentUserId: string;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string, userId: string) => void;
  onTogglePrivacy: (id: string, isPublic: boolean) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  isAdmin,
  currentUserId,
  onEditRecipe,
  onDeleteRecipe,
  onTogglePrivacy
}) => {
  return (
    <div className="grid gap-4">
      {recipes.map((recipe) => {
        // Use the first image from images array, fallback to image_url
        const displayImage = recipe.images && recipe.images.length > 0 
          ? recipe.images[0] 
          : recipe.image_url || '/placeholder.svg';

        return (
          <Card key={recipe.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 flex-1">
                {/* Recipe Image */}
                <div className="flex-shrink-0">
                  <img
                    src={displayImage}
                    alt={recipe.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                {/* Recipe Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{recipe.name}</h3>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                      {recipe.category}
                    </span>
                    {isAdmin && (
                      <RecipePrivacyToggle
                        recipeId={recipe.id}
                        isPublic={recipe.is_public}
                        onToggle={(isPublic) => onTogglePrivacy(recipe.id, isPublic)}
                      />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>${recipe.base_price}</span>
                    <span>{recipe.prep_time_minutes} min</span>
                    <span>Difficulty: {recipe.difficulty_level}/5</span>
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex gap-1">
                        {recipe.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-gray-100 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditRecipe(recipe)}
                >
                  Edit
                </Button>
                {(recipe.user_id === currentUserId || isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteRecipe(recipe.id, recipe.user_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RecipeList;
