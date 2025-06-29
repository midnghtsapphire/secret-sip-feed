
import React from 'react';
import { TrendingUp } from 'lucide-react';
import RecipesGrid from './RecipesGrid';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface ViralTodaySectionProps {
  todaysRecipes: Recipe[];
}

const ViralTodaySection: React.FC<ViralTodaySectionProps> = ({ todaysRecipes }) => {
  if (todaysRecipes.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-red-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">🔥 Viral Today</h2>
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
          {todaysRecipes.length} new
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        Fresh recipes added today - catch them while they're trending!
      </p>
      <RecipesGrid recipes={todaysRecipes} />
    </div>
  );
};

export default ViralTodaySection;
