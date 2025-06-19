
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useRecipeExtraction = () => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
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

    // Clear previous error
    setLastError(null);

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

      console.log('Raw extraction response:', data);

      // Check if the response contains an error
      if (data && data.error) {
        throw new Error(data.details || data.error);
      }

      // The edge function returns the recipe data directly
      if (data && data.name) {
        console.log('Menu items found:', data.menuItems?.length || 0);
        if (data.menuItems && data.menuItems.length > 0) {
          console.log('Menu items:', data.menuItems);
        }
        
        setExtractedRecipe(data);
        toast({
          title: "Recipe Extracted!",
          description: `Successfully extracted "${data.name}" from ${data.source}${data.menuItems?.length ? ` with ${data.menuItems.length} menu items` : ''}`,
        });
      } else {
        throw new Error('No recipe data received');
      }
    } catch (error: any) {
      console.error('Error extracting recipe:', error);
      const errorMessage = error.message || "Failed to extract recipe from the URL";
      setLastError(errorMessage);
      
      toast({
        title: "Extraction Failed",
        description: errorMessage.length > 100 ? "See details below" : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setExtractedRecipe(null);
    setUrl('');
    setLastError(null);
  };

  return {
    url,
    setUrl,
    isExtracting,
    extractedRecipe,
    lastError,
    handleExtract,
    handleReset,
    setExtractedRecipe
  };
};
