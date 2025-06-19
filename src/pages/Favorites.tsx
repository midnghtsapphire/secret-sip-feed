
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();
  const [activeCategory, setActiveCategory] = useState('All');

  const favoriteCategories = [
    'All',
    'Pink Pretties', 
    'Blue Beauties',
    'Green Goddesses',
    'Copycat Creations',
    'My Originals'
  ];

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'all': return '💖';
      case 'pink pretties': return '🌸';
      case 'blue beauties': return '💙';
      case 'green goddesses': return '🍃';
      case 'copycat creations': return '✨';
      case 'my originals': return '🎨';
      default: return '💕';
    }
  };

  const categorizeFavorite = (favorite: any) => {
    const category = favorite.drink_category?.toLowerCase() || '';
    if (category.includes('pink')) return 'Pink Pretties';
    if (category.includes('blue')) return 'Blue Beauties';
    if (category.includes('green')) return 'Green Goddesses';
    // You can add logic here to determine if it's a copycat or original
    return 'Copycat Creations';
  };

  const filteredFavorites = favorites.filter(favorite => {
    if (activeCategory === 'All') return true;
    return categorizeFavorite(favorite) === activeCategory;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to drinks
          </Link>
          
          <div className="text-center">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign in to view favorites</h1>
            <p className="text-gray-600 mb-6">Create an account to save your favorite drinks</p>
            <Link
              to="/auth"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to drinks
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            💖 Your Favorites
          </h1>
          <p className="text-gray-600">
            {favorites.length} saved recipes
          </p>
        </div>

        {/* Category Filter for Favorites */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {favoriteCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
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
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {activeCategory === 'All' ? 'No favorites yet' : `No ${activeCategory} yet`}
            </h2>
            <p className="text-gray-600 mb-6">
              {activeCategory === 'All' 
                ? 'Start exploring and save drinks you love!' 
                : `Save some ${activeCategory.toLowerCase()} to see them here!`
              }
            </p>
            <Link
              to="/"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Discover Drinks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {favorite.drink_image_url && (
                    <img
                      src={favorite.drink_image_url}
                      alt={favorite.drink_name}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {getCategoryIcon(categorizeFavorite(favorite))}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {favorite.drink_name}
                  </h3>
                  {favorite.drink_category && (
                    <p className="text-sm text-gray-600 mb-2">
                      {favorite.drink_category}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Saved {new Date(favorite.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
