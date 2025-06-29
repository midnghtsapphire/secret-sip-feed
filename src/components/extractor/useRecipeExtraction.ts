
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

// Helper function to create proxied image URL for mobile Instagram images
const createProxiedImageUrl = async (originalUrl: string): Promise<string> => {
  try {
    console.log('🔄 PROXY: Creating proxied URL for:', originalUrl);
    
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { imageUrl: originalUrl }
    });

    if (error) {
      console.error('❌ PROXY: Error creating proxied URL:', error);
      return originalUrl; // Fallback to original
    }

    // Create a blob URL from the response
    const blob = new Blob([data], { type: 'image/jpeg' });
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('✅ PROXY: Created blob URL:', blobUrl);
    return blobUrl;
    
  } catch (error) {
    console.error('💥 PROXY: Failed to create proxied URL:', error);
    return originalUrl; // Fallback to original
  }
};

export const useRecipeExtraction = () => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    console.log('🚀 EXTRACT: Starting extraction for URL:', url);
    console.log('📱 MOBILE: User agent:', navigator.userAgent);
    console.log('📱 MOBILE: Screen size:', window.innerWidth, 'x', window.innerHeight);
    
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
        
        // Check if we need to proxy images for mobile Instagram
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isInstagram = urlToUse.includes('instagram.com');
        
        console.log('📱 MOBILE: Is mobile device:', isMobile);
        console.log('📱 MOBILE: Is Instagram source:', isInstagram);
        
        let processedImages = [];
        let processedImageUrl = '/placeholder.svg';
        
        if (data.images && Array.isArray(data.images)) {
          console.log('📷 EXTRACT: Processing images array:', data.images);
          for (const img of data.images) {
            if (img && typeof img === 'string' && img.trim() !== '' && img !== '/placeholder.svg') {
              console.log('📷 EXTRACT: Processing image from array:', img);
              
              // If mobile Instagram, try to proxy the image
              if (isMobile && isInstagram) {
                try {
                  const proxiedUrl = await createProxiedImageUrl(img.trim());
                  processedImages.push(proxiedUrl);
                  console.log('📱 MOBILE: Added proxied image:', proxiedUrl);
                } catch (error) {
                  console.error('❌ PROXY: Failed to proxy image, using original:', error);
                  processedImages.push(img.trim());
                }
              } else {
                processedImages.push(img.trim());
              }
            }
          }
        }
        
        if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '' && data.imageUrl !== '/placeholder.svg') {
          const mainImageUrl = data.imageUrl.trim();
          
          if (isMobile && isInstagram) {
            try {
              const proxiedMainUrl = await createProxiedImageUrl(mainImageUrl);
              if (!processedImages.includes(proxiedMainUrl)) {
                processedImages.unshift(proxiedMainUrl);
              }
              processedImageUrl = proxiedMainUrl;
              console.log('📱 MOBILE: Added proxied main image:', proxiedMainUrl);
            } catch (error) {
              console.error('❌ PROXY: Failed to proxy main image, using original:', error);
              if (!processedImages.includes(mainImageUrl)) {
                processedImages.unshift(mainImageUrl);
              }
              processedImageUrl = mainImageUrl;
            }
          } else {
            if (!processedImages.includes(mainImageUrl)) {
              processedImages.unshift(mainImageUrl);
            }
            processedImageUrl = mainImageUrl;
          }
        }
        
        processedImageUrl = processedImages.length > 0 ? processedImages[0] : '/placeholder.svg';
        
        console.log('🖼️ EXTRACT: Final processed images array:', processedImages);
        console.log('📱 MOBILE: Image array length:', processedImages.length);
        
        const enrichedData = {
          ...data,
          images: processedImages,
          imageUrl: processedImageUrl
        };
        
        console.log('✨ EXTRACT: Final enriched data:', enrichedData);
        console.log('📱 MOBILE: Final image URL for display:', enrichedData.imageUrl);
        
        setExtractedRecipe(enrichedData);
        toast({
          title: "Recipe Extracted! 🎉",
          description: `Successfully extracted "${data.name}" from ${data.source}${isMobile && isInstagram ? ' (images processed for mobile)' : ''}`,
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
