
import React, { useState } from 'react';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import FloatingAddButton from '../components/FloatingAddButton';
import QuickImportButton from '../components/QuickImportButton';
import ConfettiRain from '../components/ConfettiRain';
import SEOHead from '../components/SEOHead';
import ViralStickers from '../components/index/ViralStickers';
import BreadcrumbNavigation from '../components/index/BreadcrumbNavigation';
import RecipesSection from '../components/index/RecipesSection';
import SeoSection from '../components/index/SeoSection';
import RecipeCleanupButton from '../components/admin/RecipeCleanupButton';
import { useRecipes } from '../hooks/useRecipes';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const { recipes, isLoading } = useRecipes();

  const categories = [
    'All',
    'Pretty n Pink',
    'Mad Matchas', 
    'Blues Clues',
    'Foam Frenzy',
    'Mocha Magic',
    'Budget Babe Brews',
    'Caramel Dreams',
    'Merry Mocha',
    'Expresso'
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
      
      <ViralStickers />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pb-20 relative z-20">
        <BreadcrumbNavigation activeCategory={activeCategory} />

        {/* Admin Controls */}
        <div className="mb-4 flex justify-end">
          <RecipeCleanupButton />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilter 
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <RecipesSection
          activeCategory={activeCategory}
          isLoading={isLoading}
          filteredRecipes={filteredRecipes}
        />

        <SeoSection />
      </main>
      
      <FloatingAddButton />
      <QuickImportButton />
    </div>
  );
};

export default Index;
