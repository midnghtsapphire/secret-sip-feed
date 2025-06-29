
// Recipe name extraction utilities
export function extractRecipeName(content: string, comments?: string[]): string {
  // First try to extract from main content
  const patterns = [
    // Look for Starbucks-specific patterns
    /starbucks\s+([^.\n!?]{5,50})/i,
    /secret\s+menu\s*[:\-]?\s*([^.\n!?]{5,50})/i,
    /drink\s*[:\-]?\s*([^.\n!?]{5,50})\s*recipe/i,
    /recipe\s*[:\-]?\s*([^.\n!?]{5,50})/i,
    /how to make\s*[:\-]?\s*([^.\n!?]{5,50})/i,
    // General patterns
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:recipe|drink|latte|frappuccino|refresher)/i,
    /make\s+this\s+([^.\n!?]{5,50})/i,
    /try\s+this\s+([^.\n!?]{5,50})/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[^\w\s]/g, '').slice(0, 50);
      if (name.length >= 3 && !name.toLowerCase().includes('app') && !name.toLowerCase().includes('download')) {
        return name;
      }
    }
  }
  
  // If no good name found in main content, try comments
  if (comments && comments.length > 0) {
    const commentsText = comments.join(' ');
    for (const pattern of patterns) {
      const match = commentsText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim().replace(/[^\w\s]/g, '').slice(0, 50);
        if (name.length >= 3 && !name.toLowerCase().includes('app') && !name.toLowerCase().includes('download')) {
          return name;
        }
      }
    }
  }
  
  // Fallback: look for any capitalized words that might be a drink name
  const words = content.split(/\s+/).filter(word => 
    word.length > 2 && 
    /^[A-Z]/.test(word) && 
    !word.toLowerCase().includes('app') &&
    !word.toLowerCase().includes('download')
  );
  
  if (words.length >= 2) {
    return words.slice(0, 3).join(' ');
  }
  
  return words[0] || 'Starbucks Secret Menu Drink';
}
