
import React from 'react';
import { Plus } from 'lucide-react';

const FloatingAddButton: React.FC = () => {
  return (
    <button className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 animate-float z-50">
      <Plus size={24} className="font-bold" />
    </button>
  );
};

export default FloatingAddButton;
