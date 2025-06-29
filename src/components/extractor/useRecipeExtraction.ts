
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
    console.log('🚀 EXTRACT: Starting extraction for URL:', url);
    
    if (!url.trim()) {
      console.log('❌ EXTRACT: No URL provided');
      toast({
        title: "URL Required",
        description: "Please enter a valid social media URL",
        variant: "destructive",
      });
      return;
    }

    setLastError(null);
    setIsExtracting(true);

    try {
      // Validate URL format
      new URL(url);
      console.log('✅ EXTRACT: URL format valid');
    } catch {
      console.log('❌ EXTRACT: Invalid URL format');
      setIsExtracting(false);
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Convert mobile URL to desktop URL
    const conversionResult = convertMobileToDesktopUrl(url);
    console.log('🔄 EXTRACT: URL conversion result:', conversionResult);
    
    if (conversionResult.wasConverted) {
      toast({
        title: "Mobile Link Detected",
        description: `Converting ${conversionResult.platform} mobile link for better extraction`,
        duration: 3000,
      });
    }

    const urlToUse = conversionResult.convertedUrl;

    // Validate platform support
    const supportedPlatforms = ['tiktok.com', 'instagram.com', 'lemon8', 'youtube.com', 'twitter.com', 'x.com'];
    const isSupported = supportedPlatforms.some(platform => urlToUse.toLowerCase().includes(platform));
    
    if (!isSupported) {
      console.log('❌ EXTRACT: Unsupported platform');
      setIsExtracting(false);
      toast({
        title: "Unsupported Platform",
        description: "Please use a TikTok, Instagram, Lemon8, YouTube, or Twitter/X URL",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📡 EXTRACT: Calling Supabase function with URL:', urlToUse);
      
      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { url: urlToUse }
      });

      console.log('📡 EXTRACT: Response received');
      console.log('📡 EXTRACT: Data:', data);
      console.log('📡 EXTRACT: Error:', error);

      if (error) {
        console.error('❌ EXTRACT: Supabase function error:', error);
        const errorMessage = `Function call failed: ${error.message}`;
        setLastError(errorMessage);
        toast({
          title: "Extraction Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error('❌ EXTRACT: Function returned error:', data.error);
        const errorMessage = data.details ? `${data.error}\n\n${data.details}` : data.error;
        setLastError(errorMessage);
        toast({
          title: "Extraction Failed",
          description: errorMessage.length > 100 ? "See error details below" : errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.name) {
        console.log('✅ EXTRACT: Recipe extracted successfully:', data.name);
        console.log('🖼️ EXTRACT: Raw image data from API:', {
          imageUrl: data.imageUrl,
          images: data.images
        });
        
        // Ensure images array is properly formatted and handle all image sources
        const images = [];
        
        // First, add any images from the images array
        if (data.images && Array.isArray(data.images)) {
          console.log('📷 EXTRACT: Processing images array:', data.images);
          data.images.forEach(img => {
            if (img && typeof img === 'string' && img.trim() !== '' && img !== '/placeholder.svg') {
              console.log('📷 EXTRACT: Adding image from array:', img);
              images.push(img.trim());
            }
          });
        }
        
        // Then, add the main imageUrl if it's not already included
        if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '' && data.imageUrl !== '/placeholder.svg') {
          if (!images.includes(data.imageUrl.trim())) {
            console.log('📷 EXTRACT: Adding main imageUrl:', data.imageUrl);
            images.unshift(data.imageUrl.trim()); // Add to beginning as primary image
          }
        }
        
        console.log('🖼️ EXTRACT: Final processed images array:', images);
        
        const enrichedData = {
          ...data,
          images,
          imageUrl: images.length > 0 ? images[0] : '/placeholder.svg'
        };
        
        console.log('✨ EXTRACT: Final enriched data:', enrichedData);
        
        setExtractedRecipe(enrichedData);
        toast({
          title: "Recipe Extracted! 🎉",
          description: `Successfully extracted "${data.name}" from ${data.source}`,
        });
      } else {
        console.error('❌ EXTRACT: No valid recipe data:', data);
        const errorMessage = 'No recipe content found in the response. The URL may not contain a recipe or the content format is not supported.';
        setLastError(errorMessage);
        toast({
          title: "No Recipe Found",
          description: errorMessage,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('💥 EXTRACT: Unexpected error:', error);
      const errorMessage = `Unexpected error: ${error.message}`;
      setLastError(errorMessage);
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 EXTRACT: Process finished');
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 EXTRACT: Resetting state');
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
