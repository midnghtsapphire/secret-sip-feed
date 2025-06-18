
import React from 'react';
import { Search, Filter } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Logo */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Secret Sips ☕
          </h1>
          <p className="text-sm text-gray-600">Viral Starbucks Recipes</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search drinks, colors, flavors..."
            className="w-full pl-10 pr-12 py-3 bg-gray-50 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Filter size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
