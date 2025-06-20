
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
    /recipe[:\s]*([^.\n!?]{3,50})/i,
    /drink[:\s]*([^.\n!?]{3,50})/i,
    /how to make[:\s]*([^.\n!?]{3,50})/i,
    /^([^.\n!?]{5,50})\s*recipe/i,
    /🍫🍓\s*([^🍓\n]{3,50})/i,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:recipe|drink|frappe|latte|coffee)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().slice(0, 1000);
      if (name.length > 3 && !name.toLowerCase().includes('app') && !name.toLowerCase().includes('download')) {
        return name;
      }
    }
  }
  
  return '';
}

export function extractDescription(content: string): string {
  const sentences = content.split(/[.!?]/)
    .filter(s => s.trim().length > 10)
    .filter(s => {
      const lower = s.toLowerCase();
      return !lower.includes('app') && !lower.includes('download') && !lower.includes('install');
    })
    .slice(0, 2);
  
  return sentences.join('. ').trim().slice(0, 1000);
}

export function extractCategory(content: string): string {
  const categories = [
    'Pretty n Pink',
    'Mad Matchas', 
    'Blues Clues',
    'Foam Frenzy',
    'Mocha Magic',
    'Budget Babe Brews'
  ];
  
  const lowerContent = content.toLowerCase();
  
  for (const category of categories) {
    if (lowerContent.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  // Check for drink type keywords
  if (lowerContent.includes('pink') || lowerContent.includes('strawberry') || lowerContent.includes('berry')) {
    return 'Pretty n Pink';
  }
  if (lowerContent.includes('blue') || lowerContent.includes('blueberry')) {
    return 'Blues Clues';
  }
  if (lowerContent.includes('matcha') || lowerContent.includes('green tea')) {
    return 'Mad Matchas';
  }
  if (lowerContent.includes('foam') || lowerContent.includes('frothy') || lowerContent.includes('whip')) {
    return 'Foam Frenzy';
  }
  if (lowerContent.includes('mocha') || lowerContent.includes('chocolate') || lowerContent.includes('coffee')) {
    return 'Mocha Magic';
  }
  if (lowerContent.includes('cheap') || lowerContent.includes('budget') || lowerContent.includes('under') || lowerContent.includes('$')) {
    return 'Budget Babe Brews';
  }
  
  return 'Pretty n Pink';
}

export function extractInstructions(content: string): string {
  const instructionPatterns = [
    /(?:instructions?|how to|steps?|recipe)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i,
    /(?:order|ask for|get)[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of instructionPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      const instructions = match[1].trim();
      if (!instructions.toLowerCase().includes('download') && !instructions.toLowerCase().includes('app')) {
        return instructions.slice(0, 1000);
      }
    }
  }
  
  return '';
}

export function extractTags(content: string): string[] {
  const commonTags = ['viral', 'tiktok', 'instagram', 'lemon8', 'popular', 'trending', 'sweet', 'iced', 'hot', 'frappuccino', 'latte', 'pink', 'fruity', 'budget', 'cheap'];
  const lowerContent = content.toLowerCase();
  
  return commonTags.filter(tag => lowerContent.includes(tag)).slice(0, 3);
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
