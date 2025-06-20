
// Input validation utilities
export interface ValidationConfig {
  maxRequestSize: number;
  allowedDomains: string[];
}

export const defaultConfig: ValidationConfig = {
  maxRequestSize: 1024 * 1024, // 1MB
  allowedDomains: [
    'tiktok.com',
    'instagram.com', 
    'lemon8-app.com',
    'v.lemon8-app.com',
    'youtube.com',
    'twitter.com',
    'x.com'
  ]
};

export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function isDomainAllowed(url: string, allowedDomains: string[]): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return allowedDomains.some(domain => 
      hostname.includes(domain) || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000);
}

export function validateRequest(contentLength: string | null, maxSize: number): boolean {
  return !contentLength || parseInt(contentLength) <= maxSize;
}
