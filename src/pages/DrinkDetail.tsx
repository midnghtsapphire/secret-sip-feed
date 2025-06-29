
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '../components/SEOHead';
import { useFavorites } from '@/hooks/useFavorites';

const DrinkDetail = () => {
  const { id } = useParams();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Fetch recipe from database
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to recipes
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Recipe Not Found</h1>
            <p className="text-gray-600">The recipe you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const isInFavorites = isFavorite(recipe.id);

  // Use the first image from images array, fallback to image_url, then to placeholder
  const displayImage = recipe.images && recipe.images.length > 0 
    ? recipe.images[0] 
    : recipe.image_url || '/placeholder.svg';

  const handleFavoriteClick = () => {
    if (isInFavorites) {
      removeFavorite(recipe.id);
    } else {
      addFavorite({
        id: recipe.id,
        name: recipe.name,
        imageUrl: displayImage,
        category: recipe.category,
      });
    }
  };

  // Parse ingredients and instructions from the recipe instructions field
  const instructionLines = recipe.instructions ? recipe.instructions.split('\n').filter(line => line.trim()) : [];

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": recipe.name,
    "image": displayImage,
    "description": recipe.description,
    "recipeInstructions": instructionLines.map((instruction, index) => ({
      "@type": "HowToStep",
      "text": instruction,
      "position": index + 1
    })),
    "recipeCuisine": "Beverage",
    "recipeCategory": "Drink",
    "keywords": recipe.tags ? recipe.tags.join(", ") : ""
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <SEOHead
        title={`${recipe.name} Recipe - Secret Sips`}
        description={`Learn how to make ${recipe.name} - ${recipe.description}. Complete recipe with ingredients and step-by-step instructions.`}
        image={displayImage}
        url={`https://secret-sips.lovable.app/drink/${recipe.id}`}
        type="article"
        structuredData={structuredData}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to recipes
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img
                src={displayImage}
                alt={`${recipe.name} - ${recipe.category} recipe`}
                className="w-full h-64 md:h-full object-cover"
                title={`${recipe.name} - Complete recipe and ingredients`}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            
            <div className="md:w-1/2 p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-800">{recipe.name}</h1>
                <button
                  onClick={handleFavoriteClick}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                  aria-label={isInFavorites ? `Remove ${recipe.name} from favorites` : `Add ${recipe.name} to favorites`}
                >
                  <Heart
                    size={24}
                    className={isInFavorites ? 'text-red-500 fill-current' : 'text-gray-600'}
                  />
                </button>
              </div>

              <p className="text-gray-600 mb-6 text-lg">{recipe.description}</p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Difficulty: {recipe.difficulty_level}/5</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="text-sm">{recipe.prep_time_minutes} min prep</span>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  ${recipe.base_price}
                </span>
              </div>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-8 border-t">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recipe Instructions</h2>
              {instructionLines.length > 0 ? (
                <div className="space-y-3">
                  {instructionLines.map((instruction, index) => (
                    <div key={index} className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No instructions available for this recipe.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrinkDetail;
