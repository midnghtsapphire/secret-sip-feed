
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import SocialMediaExtractor from '../components/SocialMediaExtractor';
import { useRecipes } from '../hooks/useRecipes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ImportRecipes = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { createRecipe } = useRecipes();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRecipeExtracted = async (extractedRecipe: any) => {
    setIsImporting(true);
    
    try {
      const recipeData = {
        name: extractedRecipe.name,
        description: extractedRecipe.description,
        category: extractedRecipe.category,
        image_url: extractedRecipe.imageUrl !== '/placeholder.svg' ? extractedRecipe.imageUrl : '',
        instructions: extractedRecipe.instructions || '',
        base_price: 5.50,
        difficulty_level: 2,
        prep_time_minutes: 10,
        tags: extractedRecipe.tags || [],
        is_public: true,
      };

      await createRecipe.mutateAsync(recipeData);
      
      toast({
        title: "Recipe imported successfully! 🎉",
        description: `"${extractedRecipe.name}" has been added to your collection.`,
      });

      // Navigate to the recipe manager after successful import
      navigate('/recipes');
    } catch (error) {
      console.error('Error importing recipe:', error);
      toast({
        title: "Import failed",
        description: "There was an error importing the recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
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

        {/* How it works */}
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

        {/* Import Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Import Recipe from Social Media
          </h2>
          
          <SocialMediaExtractor 
            onRecipeExtracted={handleRecipeExtracted}
          />
          
          {isImporting && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Importing recipe to your collection...</p>
            </div>
          )}
        </Card>

        {/* Popular Platforms */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Supported Platforms</h3>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-lg">TT</span>
              </div>
              <p className="text-sm text-gray-600">TikTok</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-lg">IG</span>
              </div>
              <p className="text-sm text-gray-600">Instagram</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 text-black rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-lg">L8</span>
              </div>
              <p className="text-sm text-gray-600">Lemon8</p>
            </div>
          </div>
        </div>

        {/* Call to action */}
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
      </div>
    </div>
  );
};

export default ImportRecipes;
