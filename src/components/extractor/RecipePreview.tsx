
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';

interface ExtractedRecipe {
  name: string;
  description: string;
  imageUrl: string;
  ingredients?: string[];
  instructions?: string;
  menuItems?: Array<{
    name: string;
    type: string;
    quantity?: string;
  }>;
  tags?: string[];
  category: string;
  source: string;
  originalUrl: string;
}

interface RecipePreviewProps {
  recipe: ExtractedRecipe;
  onUseRecipe: () => void;
  onReset: () => void;
}

const RecipePreview: React.FC<RecipePreviewProps> = ({ recipe, onUseRecipe, onReset }) => {
  return (
    <Card className="p-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{recipe.name}</h3>
            <p className="text-sm text-gray-600">
              Extracted from {recipe.source}
              {recipe.menuItems && recipe.menuItems.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {recipe.menuItems.length} menu items found
                </span>
              )}
            </p>
          </div>
          <a
            href={recipe.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            {recipe.imageUrl && (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                {recipe.category}
              </span>
            </div>
            <p className="text-sm text-gray-700">{recipe.description}</p>
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Show menu items prominently */}
        {recipe.menuItems && recipe.menuItems.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-green-800 mb-2">🔥 Starbucks Menu Items Found:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.menuItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  {item.quantity && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {item.quantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-2">Ingredients:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                <li key={index}>• {ingredient}</li>
              ))}
              {recipe.ingredients.length > 3 && (
                <li className="text-gray-400">...and {recipe.ingredients.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onUseRecipe}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white flex-1"
          >
            <Download size={16} className="mr-2" />
            Import This Recipe
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="border-gray-300"
          >
            Try Another
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RecipePreview;
