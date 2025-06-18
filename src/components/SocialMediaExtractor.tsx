
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedRecipe {
  name: string;
  description: string;
  imageUrl: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  category: string;
  source: string;
  originalUrl: string;
}

interface SocialMediaExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipe) => void;
}

const SocialMediaExtractor: React.FC<SocialMediaExtractorProps> = ({ onRecipeExtracted }) => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid social media URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL is from supported platforms
    const supportedPlatforms = ['tiktok.com', 'instagram.com', 'lemon8'];
    const isSupported = supportedPlatforms.some(platform => url.includes(platform));
    
    if (!isSupported) {
      toast({
        title: "Unsupported Platform",
        description: "Please use a TikTok, Instagram, or Lemon8 URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      console.log('Extracting recipe from:', url);
      
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url }
      });

      if (error) {
        console.error('Extraction error:', error);
        throw error;
      }

      if (data?.recipe) {
        setExtractedRecipe(data.recipe);
        toast({
          title: "Recipe Extracted!",
          description: `Successfully extracted "${data.recipe.name}" from ${data.recipe.source}`,
        });
      } else {
        throw new Error('No recipe data received');
      }
    } catch (error: any) {
      console.error('Error extracting recipe:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to extract recipe from the URL",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUseRecipe = () => {
    if (extractedRecipe) {
      onRecipeExtracted(extractedRecipe);
      setExtractedRecipe(null);
      setUrl('');
    }
  };

  const handleReset = () => {
    setExtractedRecipe(null);
    setUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="social-url" className="block text-sm font-medium text-gray-700 mb-2">
            Social Media URL
          </label>
          <div className="flex gap-2">
            <Input
              id="social-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste TikTok, Instagram, or Lemon8 link here..."
              className="flex-1"
              disabled={isExtracting}
            />
            <Button 
              onClick={handleExtract}
              disabled={isExtracting || !url.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Recipe'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supports TikTok, Instagram, and Lemon8 recipe posts
          </p>
        </div>
      </div>

      {extractedRecipe && (
        <Card className="p-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{extractedRecipe.name}</h3>
                <p className="text-sm text-gray-600">
                  Extracted from {extractedRecipe.source}
                </p>
              </div>
              <a
                href={extractedRecipe.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <img
                  src={extractedRecipe.imageUrl}
                  alt={extractedRecipe.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                    {extractedRecipe.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{extractedRecipe.description}</p>
                {extractedRecipe.tags && extractedRecipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {extractedRecipe.tags.slice(0, 3).map((tag, index) => (
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

            {extractedRecipe.ingredients && extractedRecipe.ingredients.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Ingredients:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {extractedRecipe.ingredients.slice(0, 3).map((ingredient, index) => (
                    <li key={index}>• {ingredient}</li>
                  ))}
                  {extractedRecipe.ingredients.length > 3 && (
                    <li className="text-gray-400">...and {extractedRecipe.ingredients.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUseRecipe}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white flex-1"
              >
                <Download size={16} className="mr-2" />
                Import This Recipe
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-300"
              >
                Try Another
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SocialMediaExtractor;
