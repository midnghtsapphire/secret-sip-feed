
import React from 'react';
import RecipesHeader from './RecipesHeader';
import EmptyRecipesState from './EmptyRecipesState';
import RecipesGrid from './RecipesGrid';
import ViralTodaySection from './ViralTodaySection';
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
  // Filter recipes created today with more inclusive date logic
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const todaysRecipes = filteredRecipes.filter(recipe => {
    if (!recipe.created_at) return false;
    const recipeDate = new Date(recipe.created_at);
    return recipeDate >= startOfToday && recipeDate <= endOfToday;
  });

  // Filter out today's recipes from the main list to avoid duplicates
  const otherRecipes = filteredRecipes.filter(recipe => {
    if (!recipe.created_at) return true;
    const recipeDate = new Date(recipe.created_at);
    return !(recipeDate >= startOfToday && recipeDate <= endOfToday);
  });

  console.log('Today\'s recipes found:', todaysRecipes.length);
  console.log('Other recipes:', otherRecipes.length);

  return (
    <>
      {/* Viral Today Section - only show if there are recipes from today */}
      {!isLoading && activeCategory === 'All' && (
        <ViralTodaySection todaysRecipes={todaysRecipes} />
      )}
      
      <RecipesHeader
        activeCategory={activeCategory}
        isLoading={isLoading}
        recipesCount={activeCategory === 'All' ? otherRecipes.length : filteredRecipes.length}
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
      {!isLoading && (activeCategory === 'All' ? otherRecipes.length > 0 : filteredRecipes.length > 0) && (
        <RecipesGrid recipes={activeCategory === 'All' ? otherRecipes : filteredRecipes} />
      )}
    </>
  );
};

export default RecipesSection;
