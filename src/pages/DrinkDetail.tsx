
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Star } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { useFavorites } from '@/hooks/useFavorites';

const DrinkDetail = () => {
  const { id } = useParams();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Mock data - in real app this would come from API
  const mockDrinks = [
    {
      id: '1',
      name: 'Pink Drink Cloud Foam Remix',
      imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop',
      category: 'Pink Drinks',
      tags: ['SecretMenu', 'FoamQueen', 'Viral'],
      saves: 12543,
      isTrending: true,
      description: 'TikTok famous pink drink with extra coconut milk and vanilla cold foam swirl',
      price: '$6.50',
      ingredients: [
        'Passion Iced Tea',
        'Coconut Milk',
        'Vanilla Sweet Cream Cold Foam',
        'Strawberry Açaí Base',
        'Freeze-dried Strawberries'
      ],
      instructions: [
        'Order a Grande Passion Iced Tea',
        'Ask for coconut milk instead of water',
        'Add vanilla sweet cream cold foam on top',
        'Request extra strawberry inclusions',
        'Ask for it to be mixed gently for the perfect swirl'
      ],
      rating: 4.8,
      reviews: 342
    }
  ];

  const drink = mockDrinks.find(d => d.id === id) || mockDrinks[0];
  const isInFavorites = isFavorite(drink.id);

  const handleFavoriteClick = () => {
    if (isInFavorites) {
      removeFavorite(drink.id);
    } else {
      addFavorite({
        id: drink.id,
        name: drink.name,
        imageUrl: drink.imageUrl,
        category: drink.category,
      });
    }
  };

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": drink.name,
    "image": drink.imageUrl,
    "description": drink.description,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": drink.rating,
      "reviewCount": drink.reviews
    },
    "recipeIngredient": drink.ingredients,
    "recipeInstructions": drink.instructions.map((instruction, index) => ({
      "@type": "HowToStep",
      "text": instruction,
      "position": index + 1
    })),
    "recipeCuisine": "Beverage",
    "recipeCategory": "Drink",
    "keywords": drink.tags.join(", ")
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <SEOHead
        title={`${drink.name} Recipe - Secret Sips`}
        description={`Learn how to make ${drink.name} - ${drink.description}. Complete recipe with ingredients and step-by-step instructions.`}
        image={drink.imageUrl}
        url={`https://secret-sips.lovable.app/drink/${drink.id}`}
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
                src={drink.imageUrl}
                alt={`${drink.name} - ${drink.category} Starbucks recipe showing ${drink.description}`}
                className="w-full h-64 md:h-full object-cover"
                title={`${drink.name} - Complete recipe and ingredients`}
              />
            </div>
            
            <div className="md:w-1/2 p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-800">{drink.name}</h1>
                <button
                  onClick={handleFavoriteClick}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                  aria-label={isInFavorites ? `Remove ${drink.name} from favorites` : `Add ${drink.name} to favorites`}
                >
                  <Heart
                    size={24}
                    className={isInFavorites ? 'text-red-500 fill-current' : 'text-gray-600'}
                  />
                </button>
              </div>

              <p className="text-gray-600 mb-6 text-lg">{drink.description}</p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  <Star className="text-yellow-400 fill-current" size={20} />
                  <span className="ml-1 font-semibold">{drink.rating}</span>
                  <span className="text-gray-500 ml-1">({drink.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Bookmark size={16} className="mr-1" />
                  {drink.saves > 1000 ? `${(drink.saves/1000).toFixed(1)}k` : drink.saves} saves
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {drink.price}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {drink.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 border-t">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {drink.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Instructions</h2>
                <ol className="space-y-3">
                  {drink.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrinkDetail;
