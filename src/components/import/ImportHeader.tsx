
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ImportHeader = () => {
  return (
    <div className="mb-8">
      <Link 
        to="/" 
        className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Home
      </Link>
      
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Import Viral Recipes 🔥
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Extract recipes from TikTok, Instagram, and Lemon8 posts automatically
        </p>
      </div>
    </div>
  );
};

export default ImportHeader;
