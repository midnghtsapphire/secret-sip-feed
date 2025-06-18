
import React from 'react';
import { Search, Filter, User, LogOut, Heart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

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
        <div className="relative mb-4">
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

        {/* Auth Section */}
        <div className="flex items-center justify-end">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-600" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              {isAdmin && (
                <Link to="/recipes" className="text-purple-600 hover:text-purple-700" title="Manage Recipes">
                  <Plus size={20} />
                </Link>
              )}
              <Link to="/favorites" className="text-pink-600 hover:text-pink-700">
                <Heart size={20} />
              </Link>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-800"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
