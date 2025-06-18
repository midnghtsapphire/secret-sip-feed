
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import DrinkCard from '../components/DrinkCard';

const CategoryPage = () => {
  const { category } = useParams();
  const decodedCategory = decodeURIComponent(category || '');

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
      price: '$6.50'
    },
    {
      id: '7',
      name: 'Pink Drink Hack',
      imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop',
      category: 'Budget Babe Brews',
      tags: ['Budget', 'PinkVibes', 'Under5'],
      saves: 4521,
      description: 'Iced Passion Tango Tea with coconut milk and vanilla - looks like Pink Drink!',
      price: '$2.95'
    }
  ];

  const filteredDrinks = mockDrinks.filter(drink => drink.category === decodedCategory);

  const categoryDescriptions: { [key: string]: string } = {
    'Pink Drinks': 'Instagram-worthy pink beverages that are perfect for social media and taste amazing.',
    'Budget Babe Brews': 'Delicious and pretty drinks under $5 that won\'t break the bank.',
    'Blue Drinks': 'Stunning blue beverages that are as beautiful as they are refreshing.',
    'Green Teas': 'Matcha and green tea based drinks for the health-conscious coffee lover.',
    'Foam Experts': 'Drinks featuring amazing cold foam art and techniques.'
  };

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": `${decodedCategory} Starbucks Recipes`,
    "description": categoryDescriptions[decodedCategory] || `Discover amazing ${decodedCategory} recipes and drinks.`,
    "url": `https://secret-sips.lovable.app/category/${encodeURIComponent(decodedCategory)}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredDrinks.length,
      "itemListElement": filteredDrinks.map((drink, index) => ({
        "@type": "Recipe",
        "position": index + 1,
        "name": drink.name,
        "image": drink.imageUrl,
        "description": drink.description
      }))
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <SEOHead
        title={`${decodedCategory} Recipes - Secret Sips`}
        description={categoryDescriptions[decodedCategory] || `Discover amazing ${decodedCategory} Starbucks recipes and secret menu drinks.`}
        url={`https://secret-sips.lovable.app/category/${encodeURIComponent(decodedCategory)}`}
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back to all recipes
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ✨ {decodedCategory}
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            {categoryDescriptions[decodedCategory] || `Discover amazing ${decodedCategory} recipes and drinks.`}
          </p>
          <p className="text-gray-500">
            {filteredDrinks.length} recipe{filteredDrinks.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDrinks.map((drink) => (
            <DrinkCard key={drink.id} {...drink} />
          ))}
        </div>

        {filteredDrinks.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No recipes found</h2>
            <p className="text-gray-600 mb-6">We're working on adding more {decodedCategory} recipes!</p>
            <Link
              to="/"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Browse All Recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
