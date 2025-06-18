
import React, { useState } from 'react';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import DrinkCard from '../components/DrinkCard';
import FloatingAddButton from '../components/FloatingAddButton';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Viral Today', 
    'Pink Drinks',
    'Blue Drinks', 
    'Green Teas',
    'Foam Experts'
  ];

  const mockDrinks = [
    {
      id: '1',
      name: 'Pink Drink Cloud Foam Remix',
      imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop',
      category: 'Pink Drinks',
      tags: ['SecretMenu', 'FoamQueen', 'Viral'],
      saves: 12543,
      isTrending: true,
      description: 'TikTok famous pink drink with extra coconut milk and vanilla cold foam swirl'
    },
    {
      id: '2',
      name: 'Icy Blue Paradise Refresher',
      imageUrl: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop',
      category: 'Blue Drinks',
      tags: ['BlueVibes', 'Refreshing', 'Summer'],
      saves: 8921,
      isTrending: true,
      description: 'Bright blue refresher with pineapple pieces and coconut flakes from Lemon8'
    },
    {
      id: '3',
      name: 'Matcha Cold Foam Dream',
      imageUrl: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=300&fit=crop',
      category: 'Green Teas',
      tags: ['MatchaHack', 'HealthyVibes', 'Instagram'],
      saves: 15234,
      description: 'Layered matcha latte with sweet cream cold foam and brown sugar syrup'
    },
    {
      id: '4',
      name: 'Caramel Cloud Macchiato',
      imageUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=400&h=300&fit=crop',
      category: 'Foam Experts',
      tags: ['FoamArt', 'Caramel', 'Cozy'],
      saves: 9876,
      description: 'Extra caramel drizzle with thick vanilla cold foam and cinnamon dust'
    },
    {
      id: '5',
      name: 'Sunset Ombre Frappuccino',
      imageUrl: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop',
      category: 'Pink Drinks',
      tags: ['Aesthetic', 'Layered', 'PhotoWorthy'],
      saves: 11432,
      description: 'Instagram-worthy ombre effect with strawberry, mango, and passion fruit'
    },
    {
      id: '6',
      name: 'Ocean Breeze Cold Brew',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop',
      category: 'Blue Drinks',
      tags: ['ColdBrew', 'Oceanic', 'TikTok'],
      saves: 7654,
      description: 'Blue spirulina cold brew with coconut cream foam and sea salt rim'
    }
  ];

  const filteredDrinks = activeCategory === 'All' 
    ? mockDrinks 
    : mockDrinks.filter(drink => drink.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <main className="max-w-md mx-auto px-4 pb-20">
        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter 
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
        
        {/* Trending Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {activeCategory === 'All' ? '🔥 Trending Now' : `✨ ${activeCategory}`}
          </h2>
          <p className="text-gray-600 text-sm">
            {filteredDrinks.length} viral recipes found
          </p>
        </div>
        
        {/* Drinks Feed */}
        <div className="space-y-6">
          {filteredDrinks.map((drink) => (
            <DrinkCard key={drink.id} {...drink} />
          ))}
        </div>
        
        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white text-gray-700 px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all">
            Load More Recipes ✨
          </button>
        </div>
      </main>
      
      <FloatingAddButton />
    </div>
  );
};

export default Index;
