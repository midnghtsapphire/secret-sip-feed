// Content extraction utilities
export interface ExtractedRecipe {
  name: string;
  description: string;
  category: string;
  instructions: string;
  tags: string[];
  imageUrl: string;
  images: string[];
  source: string;
  originalUrl: string;
}

export function extractRecipeName(content: string): string {
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

export function extractDescription(content: string): string {
  // Clean up content and get meaningful sentences
  const sentences = content
    .replace(/[#@]/g, '')
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 15)
    .filter(s => {
      const lower = s.toLowerCase();
      return !lower.includes('app') && 
             !lower.includes('download') && 
             !lower.includes('install') &&
             !lower.includes('follow') &&
             !lower.includes('like');
    })
    .slice(0, 3);
  
  return sentences.join('. ').trim().slice(0, 300) || 'Delicious Starbucks secret menu drink recipe!';
}

export function extractCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Check for specific drink categories based on keywords - match database enum exactly
  if (lowerContent.includes('pink') || lowerContent.includes('strawberry') || lowerContent.includes('berry') || lowerContent.includes('rose')) {
    return 'Pink Drinks';
  }
  if (lowerContent.includes('blue') || lowerContent.includes('blueberry') || lowerContent.includes('ocean')) {
    return 'Blue Drinks';
  }
  if (lowerContent.includes('matcha') || lowerContent.includes('green tea') || lowerContent.includes('green')) {
    return 'Green Teas';
  }
  if (lowerContent.includes('foam') || lowerContent.includes('frothy') || lowerContent.includes('whip') || lowerContent.includes('cream')) {
    return 'Foam Experts';
  }
  if (lowerContent.includes('mocha') || lowerContent.includes('chocolate') || lowerContent.includes('coffee') || lowerContent.includes('espresso')) {
    return 'Pink Drinks'; // Default mocha to Pink Drinks since there's no specific mocha category
  }
  if (lowerContent.includes('cheap') || lowerContent.includes('budget') || lowerContent.includes('under') || lowerContent.includes('$')) {
    return 'Budget Babe Brews';
  }
  if (lowerContent.includes('viral') || lowerContent.includes('trending') || lowerContent.includes('tiktok') || lowerContent.includes('popular')) {
    return 'Viral Today';
  }
  
  // Default to Pink Drinks for aesthetic drinks
  return 'Pink Drinks';
}

export function extractInstructions(content: string): string {
  const instructionPatterns = [
    /(?:instructions?|how to|steps?|recipe|order)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:ask for|get|order)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:ingredients?|what you need)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of instructionPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      const instructions = match[1].trim();
      if (!instructions.toLowerCase().includes('download') && !instructions.toLowerCase().includes('app')) {
        return instructions.slice(0, 500);
      }
    }
  }
  
  // Fallback: extract lines that look like instructions
  const lines = content.split('\n')
    .filter(line => line.trim().length > 10)
    .filter(line => {
      const lower = line.toLowerCase();
      return !lower.includes('app') && 
             !lower.includes('download') &&
             !lower.includes('follow') &&
             !lower.includes('like');
    })
    .slice(0, 5);
  
  return lines.join('\n') || 'Ask your barista to make this special drink!';
}

export function extractTags(content: string): string[] {
  const commonTags = [
    'viral', 'tiktok', 'instagram', 'lemon8', 'popular', 'trending', 
    'sweet', 'iced', 'hot', 'frappuccino', 'latte', 'pink', 'fruity', 
    'budget', 'cheap', 'starbucks', 'secret', 'menu', 'drink'
  ];
  const lowerContent = content.toLowerCase();
  
  return commonTags.filter(tag => lowerContent.includes(tag)).slice(0, 5);
}

export function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('tiktok')) return 'TikTok';
    if (domain.includes('instagram')) return 'Instagram';
    if (domain.includes('lemon8')) return 'Lemon8';
    if (domain.includes('youtube')) return 'YouTube';
    if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter/X';
    return domain;
  } catch {
    return 'Social Media';
  }
}
