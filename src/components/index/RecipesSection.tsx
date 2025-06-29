
import React from 'react';
import RecipesHeader from './RecipesHeader';
import EmptyRecipesState from './EmptyRecipesState';
import RecipesGrid from './RecipesGrid';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipesSectionProps {
  activeCategory: string;
  isLoading: boolean;
  filteredRecipes: Recipe[];
}

const RecipesSection: React.FC<RecipesSectionProps> = ({
  activeCategory,
  isLoading,
  filteredRecipes
}) => {
  return (
    <>
      <RecipesHeader
        activeCategory={activeCategory}
        isLoading={isLoading}
        recipesCount={filteredRecipes.length}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && filteredRecipes.length === 0 && (
        <EmptyRecipesState activeCategory={activeCategory} />
      )}
      
      {/* Recipes Grid */}
      {!isLoading && filteredRecipes.length > 0 && (
        <RecipesGrid recipes={filteredRecipes} />
      )}
    </>
  );
};

export default RecipesSection;
