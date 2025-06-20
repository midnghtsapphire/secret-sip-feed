
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecipeManagerHeaderProps {
  onAddRecipe: () => void;
}

const RecipeManagerHeader: React.FC<RecipeManagerHeaderProps> = ({ onAddRecipe }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Recipe Manager</h1>
        <p className="text-gray-600 mt-2">Create and manage your secret Starbucks recipes</p>
      </div>
      <Button
        onClick={onAddRecipe}
        className="bg-gradient-to-r from-pink-500 to-purple-600"
      >
        <Plus size={20} className="mr-2" />
        Add Recipe
      </Button>
    </div>
  );
};

export default RecipeManagerHeader;
