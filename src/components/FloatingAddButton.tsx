
import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FloatingAddButton = () => {
  const { user } = useAuth();

  // Don't show the button if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Link
      to="/recipes"
      className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 opacity-100"
      aria-label="Add new recipe"
    >
      <Plus size={24} />
    </Link>
  );
};

export default FloatingAddButton;
