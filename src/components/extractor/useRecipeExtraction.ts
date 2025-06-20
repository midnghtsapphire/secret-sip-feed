
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedRecipe {
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
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
    console.log('Starting recipe extraction for URL:', url);
    
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

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL is from supported platforms
    const supportedPlatforms = ['tiktok.com', 'instagram.com', 'lemon8', 'youtube.com', 'twitter.com', 'x.com'];
    const isSupported = supportedPlatforms.some(platform => url.toLowerCase().includes(platform));
    
    if (!isSupported) {
      toast({
        title: "Unsupported Platform",
        description: "Please use a TikTok, Instagram, Lemon8, YouTube, or Twitter/X URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      console.log('Calling Supabase function with URL:', url);
      
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url: url.trim() }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to extract recipe');
      }

      if (data && data.error) {
        const fullError = data.details ? `${data.error}\n\n${data.details}` : data.error;
        console.error('Function returned error:', fullError);
        setLastError(fullError);
        
        toast({
          title: "Extraction Failed",
          description: fullError.length > 100 ? "See details below" : fullError,
          variant: "destructive",
        });
        return;
      }

      if (data && data.name) {
        console.log('Recipe extracted successfully:', data.name);
        console.log('Menu items found:', data.menuItems?.length || 0);
        if (data.menuItems && data.menuItems.length > 0) {
          console.log('Menu items:', data.menuItems);
        }
        
        setExtractedRecipe(data);
        toast({
          title: "Recipe Extracted! 🎉",
          description: `Successfully extracted "${data.name}" from ${data.source}${data.menuItems?.length ? ` with ${data.menuItems.length} menu items` : ''}`,
        });
      } else {
        console.error('No recipe data received:', data);
        throw new Error('No recipe data received from the extraction service');
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
    console.log('Resetting extraction state');
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
