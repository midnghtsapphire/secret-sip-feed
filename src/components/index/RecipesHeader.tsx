
import React from 'react';

interface RecipesHeaderProps {
  activeCategory: string;
  isLoading: boolean;
  recipesCount: number;
}

const RecipesHeader: React.FC<RecipesHeaderProps> = ({ 
  activeCategory, 
  isLoading, 
  recipesCount 
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        {activeCategory === 'All' ? '🔥 Trending Starbucks Recipes' : `✨ ${activeCategory} Recipes`}
      </h1>
      {activeCategory === 'Budget Babe Brews' && (
        <p className="text-pink-600 text-sm font-medium mb-2">
          Pretty, Tasty, Under $5 – Your wallet & tastebuds will thank you ⭐
        </p>
      )}
      <p className="text-gray-600 text-sm">
        {isLoading 
          ? 'Loading recipes...' 
          : `${recipesCount} viral recipe${recipesCount !== 1 ? 's' : ''} found`
        }
      </p>
    </div>
  );
};

export default RecipesHeader;
