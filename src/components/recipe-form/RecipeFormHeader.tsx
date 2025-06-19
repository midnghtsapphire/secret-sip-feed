
import React from 'react';
import { X } from 'lucide-react';

interface RecipeFormHeaderProps {
  isEditing: boolean;
  onCancel: () => void;
}

const RecipeFormHeader: React.FC<RecipeFormHeaderProps> = ({ isEditing, onCancel }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
      </h2>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
        <X size={24} />
      </button>
    </div>
  );
};

export default RecipeFormHeader;
