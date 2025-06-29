
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { useRecipeCleanup } from '@/hooks/useRecipeCleanup';
import { useAdmin } from '@/hooks/useAdmin';

const RecipeCleanupButton = () => {
  const { isAdmin } = useAdmin();
  const { categorizeOldRecipes, isProcessing } = useRecipeCleanup();

  if (!isAdmin) return null;

  return (
    <Button 
      onClick={categorizeOldRecipes}
      disabled={isProcessing}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Wand2 size={16} />
      {isProcessing ? 'Processing...' : 'Categorize Yesterday\'s Recipes'}
    </Button>
  );
};

export default RecipeCleanupButton;
