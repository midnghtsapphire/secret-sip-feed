
import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, Download } from 'lucide-react';

const HowItWorks = () => {
  return (
    <Card className="p-6 mb-8 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">How it works</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <ExternalLink size={20} />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">1. Copy Link</h3>
          <p className="text-sm text-gray-600">Copy the URL from TikTok, Instagram, or Lemon8</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <Download size={20} />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">2. Extract</h3>
          <p className="text-sm text-gray-600">Our AI extracts the recipe details automatically</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">✨</span>
          </div>
          <h3 className="font-medium text-gray-800 mb-1">3. Save</h3>
          <p className="text-sm text-gray-600">Review and save to your recipe collection</p>
        </div>
      </div>
    </Card>
  );
};

export default HowItWorks;
