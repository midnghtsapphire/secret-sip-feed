
import { useEffect } from 'react';

// Hook to set security headers and CSP policies
export const useSecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cxxfpclyptwlzarlisnr.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://cxxfpclyptwlzarlisnr.supabase.co wss://cxxfpclyptwlzarlisnr.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    document.head.appendChild(meta);

    // Set additional security headers via meta tags
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options'; 
    xFrameOptions.content = 'DENY';
    document.head.appendChild(xFrameOptions);

    const xContentTypeOptions = document.createElement('meta');
    xContentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    xContentTypeOptions.content = 'nosniff';
    document.head.appendChild(xContentTypeOptions);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(meta);
      document.head.removeChild(xFrameOptions);
      document.head.removeChild(xContentTypeOptions);
    };
  }, []);
};
