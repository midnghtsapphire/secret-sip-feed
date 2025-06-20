
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import DrinkCard from '../components/DrinkCard';
import FloatingAddButton from '../components/FloatingAddButton';
import QuickImportButton from '../components/QuickImportButton';
import ConfettiRain from '../components/ConfettiRain';
import SEOHead from '../components/SEOHead';
import { useRecipes } from '../hooks/useRecipes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const { recipes, isLoading } = useRecipes();

  const categories = [
    'All',
    'Budget Babe Brews',
    'Pink Drinks',
    'Blue Drinks', 
    'Green Teas',
    'Foam Mixologists'
  ];

  const menuChoices = [
    'Frappuccinos',
    'Lattes', 
    'Macchiatos',
    'Cold Brew',
    'Refreshers',
    'Tea Lattes',
    'Hot Coffees',
    'Iced Coffees',
    'Chocolate Dreams',
    'Mocha Logic',
    'Mad Matchas',
    'Pretty n Pink',
    'Blues Clues',
    'Syrup Series - Multi Syrup',
    'Copycat Classics',
    'Make Your Own Creations'
  ];

  // Filter recipes based on active category and only show public recipes
  const filteredRecipes = recipes?.filter(recipe => {
    if (!recipe.is_public) return false;
    if (activeCategory === 'All') return true;
    return recipe.category === activeCategory;
  }) || [];

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    "name": "Secret Sips",
    "description": "Discover viral Starbucks recipes, secret menu drinks, and budget-friendly hacks from TikTok, Instagram & Lemon8.",
    "url": "https://secret-sips.lovable.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://secret-sips.lovable.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative">
      <ConfettiRain />
      <SEOHead structuredData={structuredData} />
      
      {/* Viral Stickers - Further apart with bouncing animation */}
      <div className="relative z-30 pt-6 pb-4">
        <div className="flex justify-center">
          <div className="flex gap-16 flex-wrap justify-center">
            <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transform rotate-3 hover:rotate-6 transition-transform border border-white animate-bounce">
              <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center mb-0.5 mx-auto">
                <span className="text-[8px]">🔥</span>
              </div>
              VIRAL
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transform -rotate-2 hover:-rotate-6 transition-transform border border-white animate-bounce" style={{ animationDelay: '0.5s' }}>
              <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center mb-0.5 mx-auto">
                <span className="text-[8px]">✨</span>
              </div>
              TRENDING
            </div>
          </div>
        </div>
      </div>
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pb-20 relative z-20">
        {/* Breadcrumbs for SEO */}
        <nav className="mb-4 text-sm text-gray-600">
          <span>Home</span>
          {activeCategory !== 'All' && (
            <>
              <span className="mx-2">/</span>
              <Link 
                to={`/category/${encodeURIComponent(activeCategory)}`}
                className="text-pink-600 hover:text-pink-700"
              >
                {activeCategory}
              </Link>
            </>
          )}
        </nav>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter 
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Menu Dropdown */}
        <div className="mb-6">
          <div className="max-w-xs">
            <label htmlFor="menu-select" className="block text-sm font-medium text-gray-700 mb-2">
              Choose Menu Category
            </label>
            <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select a menu category" />
              </SelectTrigger>
              <SelectContent>
                {menuChoices.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Header with SEO-friendly content */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {activeCategory === 'All' ? '🔥 Trending Starbucks Recipes' : `✨ ${activeCategory} Recipes`}
          </h1>
          {activeCategory === 'Budget Babe Brews' && (
            <p className="text-pink-600 text-sm font-medium mb-2">
              Pretty, Tasty, Under $5 – Your wallet & tastebuds will thank you ⭐
            </p>
          )}
          <p className="text-gray-600 text-sm">
            {isLoading 
              ? 'Loading recipes...' 
              : `${filteredRecipes.length} viral recipe${filteredRecipes.length !== 1 ? 's' : ''} found`
            }
          </p>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && filteredRecipes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥤</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 mb-6">
              {activeCategory === 'All' 
                ? "Be the first to add a viral recipe! Click the + button to get started."
                : `No recipes found in ${activeCategory}. Try a different category or add your own!`
              }
            </p>
            <Link 
              to="/recipes" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Add First Recipe ✨
            </Link>
          </div>
        )}
        
        {/* Recipes Grid */}
        {!isLoading && filteredRecipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} to={`/drink/${recipe.id}`} className="block">
                <DrinkCard 
                  id={recipe.id}
                  name={recipe.name}
                  imageUrl={recipe.image_url || '/placeholder.svg'}
                  category={recipe.category}
                  tags={recipe.tags || []}
                  saves={recipe.saves_count || 0}
                  isTrending={recipe.saves_count && recipe.saves_count > 100}
                  description={recipe.description || ''}
                  price={recipe.base_price ? `$${recipe.base_price}` : undefined}
                />
              </Link>
            ))}
          </div>
        )}

        {/* SEO Content Section */}
        <section className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">About Secret Sips</h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Viral Starbucks Recipes</h3>
              <p className="mb-4">
                Discover the most popular Starbucks secret menu drinks trending on TikTok, Instagram, and Lemon8. 
                From pink drinks to budget-friendly hacks, we've got all the recipes you need.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Budget-Friendly Options</h3>
              <p className="mb-4">
                Save money while still enjoying Instagram-worthy drinks with our Budget Babe Brews collection. 
                All recipes under $5 that taste just as good as the expensive originals.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <FloatingAddButton />
      <QuickImportButton />
    </div>
  );
};

export default Index;
