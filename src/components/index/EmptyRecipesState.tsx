
import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyRecipesStateProps {
  activeCategory: string;
}

const EmptyRecipesState: React.FC<EmptyRecipesStateProps> = ({ activeCategory }) => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🥤</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No recipes found
      </h3>
      <p className="text-gray-600 mb-6">
        {activeCategory === 'All' 
          ? "Be the first to add a viral recipe! Click the + button to get started."
          : `No recipes found in ${activeCategory}. Try a different category or add your own!`
        }
      </p>
      <Link 
        to="/recipes" 
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all"
      >
        Add First Recipe ✨
      </Link>
    </div>
  );
};

export default EmptyRecipesState;
