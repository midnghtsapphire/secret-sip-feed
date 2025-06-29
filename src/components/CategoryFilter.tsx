
import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'all': return '🔥';
      case 'pretty n pink': return '🥤'; // Pink drink cup
      case 'mad matchas': return '🧋'; // Bubble tea cup for matcha
      case 'blues clues': return '🥤'; // Blue drink cup
      case 'foam frenzy': return '🥛'; // Milk/foam cup
      case 'mocha magic': return '☕'; // Hot coffee for mocha
      case 'budget babe brews': return '💰';
      case 'caramel dreams': return '🥤'; // Caramel drink cup
      case 'merry mocha': return '☕'; // Hot coffee for mocha
      case 'expresso': return '☕'; // Coffee for espresso
      default: return '🥤';
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
            activeCategory === category
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
          }`}
        >
          <span>{getCategoryIcon(category)}</span>
          <span className="font-medium text-sm">{category}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
