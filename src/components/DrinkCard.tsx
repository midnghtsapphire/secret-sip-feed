
import React from 'react';
import { Heart, Bookmark, TrendingUp } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

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
  id,
  name,
  imageUrl,
  category,
  tags,
  saves,
  isTrending,
  description,
}) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const isInFavorites = isFavorite(id);

  const handleFavoriteClick = () => {
    if (isInFavorites) {
      removeFavorite(id);
    } else {
      addFavorite({
        id,
        name,
        imageUrl,
        category,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-48 object-cover"
        />
        {isTrending && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Trending
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
        >
          <Heart 
            size={18} 
            className={isInFavorites ? 'text-red-500 fill-current' : 'text-gray-600'} 
          />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-800 leading-tight">{name}</h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <span 
              key={index}
              className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500 text-sm">
            <Bookmark size={14} className="mr-1" />
            {saves.toLocaleString()} saves
          </div>
          
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all">
            Get Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrinkCard;
