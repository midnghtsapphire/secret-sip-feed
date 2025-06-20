
// URL conversion utilities for mobile to desktop links
export interface UrlConversionResult {
  originalUrl: string;
  convertedUrl: string;
  wasConverted: boolean;
  platform: string;
}

export function convertMobileToDesktopUrl(url: string): UrlConversionResult {
  const originalUrl = url.trim();
  let convertedUrl = originalUrl;
  let wasConverted = false;
  let platform = 'unknown';

  try {
    const urlObj = new URL(originalUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // TikTok conversions
    if (hostname.includes('tiktok')) {
      platform = 'TikTok';
      
      // Convert vm.tiktok.com to www.tiktok.com
      if (hostname.includes('vm.tiktok.com')) {
        convertedUrl = originalUrl.replace('vm.tiktok.com', 'www.tiktok.com');
        wasConverted = true;
      }
      // Convert m.tiktok.com to www.tiktok.com
      else if (hostname.includes('m.tiktok.com')) {
        convertedUrl = originalUrl.replace('m.tiktok.com', 'www.tiktok.com');
        wasConverted = true;
      }
      // Remove mobile app parameters
      if (convertedUrl.includes('?_r=1') || convertedUrl.includes('&_r=1')) {
        convertedUrl = convertedUrl.replace(/[?&]_r=1/g, '');
        wasConverted = true;
      }
    }
    
    // Instagram conversions
    else if (hostname.includes('instagram')) {
      platform = 'Instagram';
      
      // Convert mobile Instagram links
      if (hostname.includes('m.instagram.com')) {
        convertedUrl = originalUrl.replace('m.instagram.com', 'www.instagram.com');
        wasConverted = true;
      }
      // Remove mobile app parameters
      if (convertedUrl.includes('?igshid=') || convertedUrl.includes('&igshid=')) {
        convertedUrl = convertedUrl.replace(/[?&]igshid=[^&]*/g, '');
        wasConverted = true;
      }
    }
    
    // Lemon8 conversions
    else if (hostname.includes('lemon8')) {
      platform = 'Lemon8';
      
      // Convert v.lemon8-app.com to www.lemon8-app.com
      if (hostname.includes('v.lemon8-app.com')) {
        convertedUrl = originalUrl.replace('v.lemon8-app.com', 'www.lemon8-app.com');
        wasConverted = true;
      }
      // Convert mobile app links to web version
      else if (hostname.includes('lemon8-app.com') && !hostname.includes('www.')) {
        convertedUrl = originalUrl.replace(hostname, 'www.lemon8-app.com');
        wasConverted = true;
      }
    }
    
    // YouTube conversions
    else if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
      platform = 'YouTube';
      
      // Convert youtu.be to youtube.com
      if (hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        convertedUrl = `https://www.youtube.com/watch?v=${videoId}`;
        wasConverted = true;
      }
      // Convert mobile YouTube links
      else if (hostname.includes('m.youtube.com')) {
        convertedUrl = originalUrl.replace('m.youtube.com', 'www.youtube.com');
        wasConverted = true;
      }
    }
    
    // Twitter/X conversions
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      platform = 'Twitter/X';
      
      // Convert mobile Twitter links
      if (hostname.includes('mobile.twitter.com')) {
        convertedUrl = originalUrl.replace('mobile.twitter.com', 'twitter.com');
        wasConverted = true;
      }
      else if (hostname.includes('mobile.x.com')) {
        convertedUrl = originalUrl.replace('mobile.x.com', 'x.com');
        wasConverted = true;
      }
    }
    
    // Clean up any remaining mobile parameters
    const mobileParams = ['?mobile=1', '&mobile=1', '?m=1', '&m=1'];
    for (const param of mobileParams) {
      if (convertedUrl.includes(param)) {
        convertedUrl = convertedUrl.replace(param, '');
        wasConverted = true;
      }
    }
    
    // Clean up trailing ? or & if they exist after parameter removal
    convertedUrl = convertedUrl.replace(/[?&]$/, '');
    
  } catch (error) {
    console.error('Error converting URL:', error);
    // If URL parsing fails, return original
  }

  return {
    originalUrl,
    convertedUrl,
    wasConverted,
    platform
  };
}
