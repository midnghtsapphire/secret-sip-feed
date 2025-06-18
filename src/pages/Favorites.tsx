
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

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
      <div className="max-w-md mx-auto px-4 py-8">
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
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">Start exploring and save drinks you love!</p>
            <Link
              to="/"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Discover Drinks
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex">
                  {favorite.drink_image_url && (
                    <img
                      src={favorite.drink_image_url}
                      alt={favorite.drink_name}
                      className="w-20 h-20 object-cover"
                    />
                  )}
                  <div className="flex-1 p-4">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
