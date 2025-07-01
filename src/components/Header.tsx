
import React from 'react';
import { Heart, User, ArrowRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, loading, signOut } = useAuth();

  console.log('Header - User:', user, 'Loading:', loading);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Sign out button clicked');
    await signOut();
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top section with arrow positioned higher */}
        <div className="flex justify-end pt-2 pb-1">
          <ArrowRight className="text-gray-400" size={20} />
        </div>
        
        {/* Main header content */}
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-3xl">☕</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Secret Sips Cafe
              </h1>
              <p className="text-sm text-gray-600">Viral Starbucks Recipes</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/favorites"
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-500 transition-colors"
            >
              <Heart size={20} />
              <span className="hidden sm:inline">Favorites</span>
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/recipes"  
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-500 transition-colors"
                >
                  <User size={20} />
                  <span className="hidden sm:inline">
                    {user.email?.split('@')[0] || 'My Recipes'}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                  title="Sign Out"
                  type="button"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
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
      </div>
    </header>
  );
};

export default Header;
