
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

export const useRecipeCleanup = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const categorizeOldRecipes = async () => {
    setIsProcessing(true);
    
    try {
      // Get recipes from yesterday that might need categorization
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      console.log('Fetching recipes from:', yesterday.toISOString(), 'to', yesterdayEnd.toISOString());

      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .eq('is_public', true);

      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }

      if (!recipes || recipes.length === 0) {
        toast({
          title: "No recipes to process",
          description: "No recipes from yesterday found to categorize.",
        });
        return;
      }

      console.log(`Found ${recipes.length} recipes to process`);

      // Process each recipe for categorization
      const updates = recipes.map(recipe => 
        categorizeRecipe(recipe)
      ).filter(update => update !== null);

      if (updates.length > 0) {
        // Batch update recipes with new categories
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('recipes')
            .update({ category: update.category })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Error updating recipe ${update.id}:`, updateError);
          }
        }

        toast({
          title: "Cleanup completed",
          description: `Successfully categorized ${updates.length} recipes from yesterday.`,
        });
      } else {
        toast({
          title: "No updates needed",
          description: "All recipes from yesterday are already properly categorized.",
        });
      }

    } catch (error) {
      console.error('Cleanup failed:', error);
      toast({
        title: "Cleanup failed",
        description: "An error occurred while categorizing recipes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const categorizeRecipe = (recipe: Recipe): { id: string; category: Database['public']['Enums']['recipe_category'] } | null => {
    // Smart categorization based on recipe name, description, and tags
    const text = `${recipe.name} ${recipe.description || ''} ${recipe.tags?.join(' ') || ''}`.toLowerCase();
    
    // Category mapping based on keywords - using correct database enum values
    if (text.includes('pink') || text.includes('strawberry') || text.includes('raspberry') || text.includes('dragon')) {
      return { id: recipe.id, category: 'Pink Drinks' };
    }
    
    if (text.includes('blue') || text.includes('butterfly') || text.includes('ocean') || text.includes('mermaid')) {
      return { id: recipe.id, category: 'Blue Drinks' };
    }
    
    if (text.includes('matcha') || text.includes('green tea') || text.includes('jade') || text.includes('mint')) {
      return { id: recipe.id, category: 'Green Teas' };
    }
    
    if (text.includes('foam') || text.includes('cold foam') || text.includes('whipped') || text.includes('fluffy')) {
      return { id: recipe.id, category: 'Foam Experts' };
    }
    
    if (text.includes('caramel') || text.includes('butterscotch') || text.includes('toffee') || text.includes('dulce')) {
      return { id: recipe.id, category: 'Caramel Dreams' };
    }
    
    if (text.includes('mocha') || text.includes('chocolate') || text.includes('cocoa') || text.includes('peppermint')) {
      return { id: recipe.id, category: 'Merry Mocha' };
    }
    
    if (text.includes('espresso') || text.includes('americano') || text.includes('doppio') || text.includes('lungo')) {
      return { id: recipe.id, category: 'Expresso' };
    }
    
    // Check for budget-friendly indicators
    if (recipe.base_price && recipe.base_price <= 5) {
      return { id: recipe.id, category: 'Budget Babe Brews' };
    }
    
    // Default categorization - no change needed
    return null;
  };

  return {
    categorizeOldRecipes,
    isProcessing
  };
};
