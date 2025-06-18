
import React from 'react';
import { Heart, Bookmark, TrendingUp } from 'lucide-react';

interface DrinkCardProps {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  tags: string[];
  saves: number;
  isTrending?: boolean;
  description: string;
}

const DrinkCard: React.FC<DrinkCardProps> = ({
  name,
  imageUrl,
  category,
  tags,
  saves,
  isTrending,
  description
}) => {
  const getCategoryGradient = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pink drinks':
        return 'gradient-pink';
      case 'blue drinks':
        return 'gradient-blue';
      case 'green teas':
        return 'gradient-green';
      case 'foam experts':
        return 'gradient-foam';
      default:
        return 'bg-gradient-to-r from-purple-400 to-pink-400';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        {/* Trending Badge */}
        {isTrending && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 animate-trending">
            <TrendingUp size={12} />
            VIRAL
          </div>
        )}
        
        {/* Save Button */}
        <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
          <Bookmark size={16} className="text-gray-700" />
        </button>
        
        {/* Category Badge */}
        <div className={`absolute bottom-3 left-3 ${getCategoryGradient(category)} px-3 py-1 rounded-full`}>
          <span className="text-white text-xs font-medium">{category}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-500">
            <Heart size={14} />
            <span className="text-xs">{saves.toLocaleString()} saves</span>
          </div>
          <button className="text-pink-500 hover:text-pink-600 font-medium text-sm transition-colors">
            Get Recipe →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrinkCard;
