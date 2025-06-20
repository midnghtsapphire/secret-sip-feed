
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ImportCallToAction = () => {
  return (
    <div className="mt-12 text-center">
      <p className="text-gray-600 mb-4">
        Want to create a recipe manually instead?
      </p>
      <Link to="/recipes">
        <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50">
          Create Recipe Manually
        </Button>
      </Link>
    </div>
  );
};

export default ImportCallToAction;
