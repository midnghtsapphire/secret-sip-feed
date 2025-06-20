
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';

const QuickImportButton = () => {
  return (
    <div className="fixed bottom-24 right-6 z-50">
      <Link to="/import">
        <Button 
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all animate-bounce"
          style={{ animationDuration: '2s' }}
        >
          <Download size={20} />
        </Button>
      </Link>
      <div className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
        Import Recipe
      </div>
    </div>
  );
};

export default QuickImportButton;
