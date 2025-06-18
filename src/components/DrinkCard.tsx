
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
  price?: string;
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
  price,
}) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const isInFavorites = isFavorite(id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-fit">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={`${name} - ${category} Starbucks recipe drink with ${tags.slice(0, 2).join(' and ')} ingredients`}
          className="w-full h-32 object-cover"
          loading="lazy"
          title={`${name} - ${description}`}
        />
        {isTrending && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
            <TrendingUp size={10} className="mr-1" />
            Hot
          </div>
        )}
        {price && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {price}
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute bottom-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
          aria-label={isInFavorites ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
        >
          <Heart 
            size={14} 
            className={isInFavorites ? 'text-red-500 fill-current' : 'text-gray-600'} 
          />
        </button>
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-800 leading-tight mb-1 line-clamp-2">{name}</h3>
        
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-gray-400 text-xs">+{tags.length - 2}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500 text-xs">
            <Bookmark size={12} className="mr-1" />
            {saves > 1000 ? `${(saves/1000).toFixed(1)}k` : saves}
          </div>
          
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:from-pink-600 hover:to-purple-700 transition-all">
            Recipe
          </button>
        </div>
      </div>
    </article>
  );
};

export default DrinkCard;
