
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';

const QuickImportButton = () => {
  return (
    <div className="fixed bottom-6 right-4 z-50 md:bottom-8 md:right-6">
      <Link to="/import">
        <Button 
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg hover:shadow-xl transition-all animate-bounce flex items-center justify-center"
          style={{ animationDuration: '2s' }}
          aria-label="Import Recipe"
        >
          <Download size={16} className="md:w-5 md:h-5" />
        </Button>
      </Link>
      <div className="absolute -top-10 -left-8 md:-top-8 md:right-0 md:left-auto bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Import Recipe
      </div>
    </div>
  );
};

export default QuickImportButton;
