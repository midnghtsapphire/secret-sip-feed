
import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbNavigationProps {
  activeCategory: string;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ activeCategory }) => {
  return (
    <nav className="mb-4 text-sm text-gray-600">
      <span>Home</span>
      {activeCategory !== 'All' && (
        <>
          <span className="mx-2">/</span>
          <Link 
            to={`/category/${encodeURIComponent(activeCategory)}`}
            className="text-pink-600 hover:text-pink-700"
          >
            {activeCategory}
          </Link>
        </>
      )}
    </nav>
  );
};

export default BreadcrumbNavigation;
