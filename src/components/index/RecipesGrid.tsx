
import React from 'react';
import { Link } from 'react-router-dom';
import DrinkCard from '../DrinkCard';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipesGridProps {
  recipes: Recipe[];
}

const RecipesGrid: React.FC<RecipesGridProps> = ({ recipes }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recipes.map((recipe) => (
        <Link key={recipe.id} to={`/drink/${recipe.id}`} className="block">
          <DrinkCard 
            id={recipe.id}
            name={recipe.name}
            imageUrl={recipe.image_url || '/placeholder.svg'}
            category={recipe.category}
            tags={recipe.tags || []}
            saves={recipe.saves_count || 0}
            isTrending={recipe.saves_count && recipe.saves_count > 100}
            description={recipe.description || ''}
            price={recipe.base_price ? `$${recipe.base_price}` : undefined}
          />
        </Link>
      ))}
    </div>
  );
};

export default RecipesGrid;
