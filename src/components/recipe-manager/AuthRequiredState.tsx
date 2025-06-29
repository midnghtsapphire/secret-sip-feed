
import React from 'react';
import Header from '@/components/Header';

const AuthRequiredState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to manage your recipes.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredState;
