
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import SocialMediaExtractor from '../components/SocialMediaExtractor';
import ImportHeader from '../components/import/ImportHeader';
import HowItWorks from '../components/import/HowItWorks';
import SupportedPlatforms from '../components/import/SupportedPlatforms';
import ImportCallToAction from '../components/import/ImportCallToAction';
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
      console.log('📥 IMPORT: Extracted recipe data received:', extractedRecipe);
      console.log('🖼️ IMPORT: Image data from extraction:', {
        imageUrl: extractedRecipe.imageUrl,
        images: extractedRecipe.images
      });
      
      const recipeData = {
        name: extractedRecipe.name,
        description: extractedRecipe.description,
        category: extractedRecipe.category,
        images: extractedRecipe.images || [],
        image_url: extractedRecipe.imageUrl || extractedRecipe.images?.[0] || '',
        instructions: extractedRecipe.instructions || '',
        base_price: 5.50,
        difficulty_level: 2,
        prep_time_minutes: 10,
        tags: extractedRecipe.tags || [],
        is_public: true,
      };

      console.log('💾 IMPORT: Recipe data being saved to database:', recipeData);
      console.log('🖼️ IMPORT: Final image data for save:', {
        images: recipeData.images,
        image_url: recipeData.image_url
      });

      await createRecipe.mutateAsync(recipeData);
      
      toast({
        title: "Recipe imported successfully! 🎉",
        description: `"${extractedRecipe.name}" has been added to your collection.`,
      });

      navigate('/recipes');
    } catch (error) {
      console.error('❌ IMPORT: Error importing recipe:', error);
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
        <ImportHeader />
        <HowItWorks />

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

        <SupportedPlatforms />
        <ImportCallToAction />
      </div>
    </div>
  );
};

export default ImportRecipes;
