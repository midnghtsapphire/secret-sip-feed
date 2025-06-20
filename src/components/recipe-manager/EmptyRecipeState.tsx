
import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyRecipeStateProps {
  onCreateRecipe: () => void;
}

const EmptyRecipeState: React.FC<EmptyRecipeStateProps> = ({ onCreateRecipe }) => {
  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No recipes yet</h3>
      <p className="text-gray-600 mb-4">Create your first recipe to get started!</p>
      <Button
        onClick={onCreateRecipe}
        className="bg-gradient-to-r from-pink-500 to-purple-600"
      >
        <Plus size={16} className="mr-2" />
        Create Recipe
      </Button>
    </Card>
  );
};

export default EmptyRecipeState;
