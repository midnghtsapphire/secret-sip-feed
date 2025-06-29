
import React from 'react';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickImportButton = () => {
  return (
    <Link
      to="/import"
      className="fixed bottom-6 right-20 z-40 bg-gradient-to-r from-green-500 to-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Import recipes"
    >
      <Download size={20} />
    </Link>
  );
};

export default QuickImportButton;
