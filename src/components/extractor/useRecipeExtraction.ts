
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertMobileToDesktopUrl } from '@/utils/urlConverter';

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
    console.log('🚀 EXTRACT BUTTON CLICKED - Starting extraction process');
    console.log('🔍 DEBUG: Starting recipe extraction for URL:', url);
    
    if (!url.trim()) {
      console.log('❌ DEBUG: No URL provided');
      toast({
        title: "URL Required",
        description: "Please enter a valid social media URL",
        variant: "destructive",
      });
      return;
    }

    // Clear previous error
    setLastError(null);
    console.log('✅ DEBUG: Cleared previous errors');

    // Validate URL format
    try {
      new URL(url);
      console.log('✅ DEBUG: URL format is valid');
    } catch {
      console.log('❌ DEBUG: Invalid URL format');
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Convert mobile URL to desktop URL
    const conversionResult = convertMobileToDesktopUrl(url);
    console.log('🔄 DEBUG: URL conversion result:', conversionResult);
    
    if (conversionResult.wasConverted) {
      console.log('✅ DEBUG: URL converted from mobile to desktop version');
      toast({
        title: "Mobile Link Detected",
        description: `Converting ${conversionResult.platform} mobile link to desktop version for better extraction`,
        duration: 3000,
      });
    }

    const urlToUse = conversionResult.convertedUrl;

    // Validate URL is from supported platforms
    const supportedPlatforms = ['tiktok.com', 'instagram.com', 'lemon8', 'youtube.com', 'twitter.com', 'x.com'];
    const isSupported = supportedPlatforms.some(platform => urlToUse.toLowerCase().includes(platform));
    
    if (!isSupported) {
      console.log('❌ DEBUG: Unsupported platform detected');
      toast({
        title: "Unsupported Platform",
        description: "Please use a TikTok, Instagram, Lemon8, YouTube, or Twitter/X URL",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ DEBUG: Platform is supported');
    console.log('🔄 DEBUG: Setting isExtracting to true');
    setIsExtracting(true);
    
    try {
      console.log('🚀 DEBUG: About to call Supabase function extract-recipe');
      console.log('🚀 DEBUG: Supabase client available:', !!supabase);
      console.log('🚀 DEBUG: Function payload:', { url: urlToUse });
      
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url: urlToUse }
      });

      console.log('📡 DEBUG: Supabase function response received');
      console.log('📡 DEBUG: Response data:', data);
      console.log('📡 DEBUG: Response error:', error);

      if (error) {
        console.error('❌ DEBUG: Supabase function error:', error);
        console.error('❌ DEBUG: Full error object:', JSON.stringify(error, null, 2));
        
        // Provide more specific error messages based on the platform
        let userFriendlyMessage = 'Failed to extract recipe from the URL';
        
        if (urlToUse.includes('lemon8')) {
          userFriendlyMessage = 'Lemon8 is blocking access to this recipe. Try copying the recipe details manually or find it on TikTok/Instagram instead.';
        } else if (urlToUse.includes('instagram')) {
          userFriendlyMessage = 'Instagram is blocking access to this post. The post might be private or require login to view.';
        } else if (urlToUse.includes('tiktok')) {
          userFriendlyMessage = 'TikTok is blocking access to this video. Try a different TikTok URL or copy the recipe manually.';
        }
        
        setLastError(userFriendlyMessage);
        toast({
          title: "Extraction Failed",
          description: userFriendlyMessage,
          variant: "destructive",
        });
        return;
      }

      if (data && data.error) {
        const fullError = data.details ? `${data.error}\n\n${data.details}` : data.error;
        console.error('❌ DEBUG: Function returned error:', fullError);
        setLastError(fullError);
        
        toast({
          title: "Extraction Failed",
          description: fullError.length > 100 ? "See details below" : fullError,
          variant: "destructive",
        });
        return;
      }

      if (data && data.name) {
        console.log('✅ DEBUG: Recipe extracted successfully:', data.name);
        console.log('✅ DEBUG: Full extracted data:', JSON.stringify(data, null, 2));
        
        setExtractedRecipe(data);
        toast({
          title: "Recipe Extracted! 🎉",
          description: `Successfully extracted "${data.name}" from ${data.source}`,
        });
      } else {
        console.error('❌ DEBUG: No recipe data received:', data);
        console.error('❌ DEBUG: Data type:', typeof data);
        console.error('❌ DEBUG: Data keys:', data ? Object.keys(data) : 'data is null/undefined');
        
        // Provide platform-specific guidance
        let platformMessage = 'No recipe content could be extracted from this URL.';
        
        if (urlToUse.includes('lemon8')) {
          platformMessage = 'Lemon8 posts are often blocked from extraction. Try finding the same recipe on TikTok or Instagram, or enter the recipe details manually.';
        }
        
        setLastError(platformMessage);
        toast({
          title: "No Recipe Found",
          description: platformMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('💥 DEBUG: Error extracting recipe:', error);
      console.error('💥 DEBUG: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = error.message || "Failed to extract recipe from the URL";
      
      // Provide platform-specific error messages
      if (urlToUse.includes('lemon8')) {
        errorMessage = 'Lemon8 is protecting this content and blocking extraction. Try finding the recipe on TikTok or Instagram instead.';
      }
      
      setLastError(errorMessage);
      
      toast({
        title: "Extraction Failed",
        description: errorMessage.length > 100 ? "See details below" : errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 DEBUG: Extraction process finished, setting isExtracting to false');
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 DEBUG: Resetting extraction state');
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
