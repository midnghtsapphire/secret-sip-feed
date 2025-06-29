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

export function extractDescription(content: string, comments?: string[]): string {
  // Get the full content without truncating too early
  const fullText = content.replace(/[#@]/g, '').trim();
  
  // Split into sentences and clean them
  const sentences = fullText
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .filter(s => {
      const lower = s.toLowerCase();
      return !lower.includes('app') && 
             !lower.includes('download') && 
             !lower.includes('install') &&
             !lower.includes('follow') &&
             !lower.includes('like') &&
             !lower.includes('comment');
    });
  
  // If we have good sentences from main content, use them
  if (sentences.length > 0) {
    const description = sentences.slice(0, 3).join('. ').trim();
    if (description.length > 50) {
      return description.slice(0, 500);
    }
  }
  
  // If main content is not descriptive enough, check comments
  if (comments && comments.length > 0) {
    const commentsText = comments.join(' ').slice(0, 500);
    const commentSentences = commentsText
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && !s.toLowerCase().includes('follow') && !s.toLowerCase().includes('like'));
    
    if (commentSentences.length > 0) {
      return commentSentences.slice(0, 2).join('. ').slice(0, 500);
    }
  }
  
  // Fallback to first meaningful chunk of text
  const fallback = fullText.slice(0, 300).replace(/\n+/g, ' ').trim();
  return fallback || 'Delicious Starbucks secret menu drink recipe!';
}

export function extractCategory(content: string, comments?: string[]): string {
  const allText = comments ? `${content} ${comments.join(' ')}` : content;
  const lowerContent = allText.toLowerCase();
  
  // Enhanced category detection with more keywords and patterns
  const categoryMatchers = [
    {
      category: 'Caramel Dreams',
      keywords: ['caramel', 'butterscotch', 'toffee', 'dulce', 'salted caramel', 'brown sugar'],
      strongKeywords: ['caramel macchiato', 'caramel frappuccino', 'caramel latte']
    },
    {
      category: 'Pretty n Pink',
      keywords: ['pink', 'strawberry', 'berry', 'rose', 'hibiscus', 'raspberry', 'cherry'],
      strongKeywords: ['pink drink', 'strawberry acai', 'pink paradise', 'barbie']
    },
    {
      category: 'Blues Clues',
      keywords: ['blue', 'blueberry', 'ocean', 'azure', 'sapphire', 'navy'],
      strongKeywords: ['blue drink', 'blueberry refresher', 'ocean drink']
    },
    {
      category: 'Mad Matchas',
      keywords: ['matcha', 'green tea', 'green', 'jade', 'earthy', 'zen'],
      strongKeywords: ['matcha latte', 'green tea frappuccino', 'matcha frappuccino']
    },
    {
      category: 'Foam Frenzy',
      keywords: ['foam', 'frothy', 'whip', 'cream', 'fluffy', 'airy', 'light'],
      strongKeywords: ['cold foam', 'foam topping', 'whipped cream']
    },
    {
      category: 'Merry Mocha',
      keywords: ['mocha', 'chocolate', 'cocoa', 'java chip', 'espresso', 'coffee', 'caffeine'],
      strongKeywords: ['mocha frappuccino', 'java chip', 'chocolate coffee', 'mocha latte']
    },
    {
      category: 'Budget Babe Brews',
      keywords: ['cheap', 'budget', 'affordable', 'under', '$', 'save', 'deal'],
      strongKeywords: ['budget drink', 'cheap starbucks', 'under $5']
    },
    {
      category: 'Viral Today',
      keywords: ['viral', 'trending', 'tiktok', 'popular', 'famous', 'instagram', 'trend'],
      strongKeywords: ['tiktok viral', 'viral drink', 'trending now']
    }
  ];
  
  // Check for strong keyword matches first (higher priority)
  for (const matcher of categoryMatchers) {
    for (const strongKeyword of matcher.strongKeywords) {
      if (lowerContent.includes(strongKeyword)) {
        return matcher.category;
      }
    }
  }
  
  // Then check regular keywords with scoring system
  const categoryScores = new Map<string, number>();
  
  for (const matcher of categoryMatchers) {
    let score = 0;
    for (const keyword of matcher.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      categoryScores.set(matcher.category, score);
    }
  }
  
  // Return category with highest score
  if (categoryScores.size > 0) {
    const bestCategory = Array.from(categoryScores.entries())
      .sort(([,a], [,b]) => b - a)[0][0];
    return bestCategory;
  }
  
  // Default fallback based on drink type detection
  if (lowerContent.includes('frappuccino') || lowerContent.includes('blended')) {
    return 'Foam Frenzy';
  }
  if (lowerContent.includes('refresher') || lowerContent.includes('iced')) {
    return 'Pretty n Pink';
  }
  if (lowerContent.includes('latte') || lowerContent.includes('hot')) {
    return 'Merry Mocha';
  }
  
  // Ultimate fallback
  return 'Pretty n Pink';
}

export function extractInstructions(content: string, comments?: string[]): string {
  // First try to find instructions in main content
  const fullOrderMatch = content.match(/FULL ORDER[:\s]*([^]+?)(?=\n\n|\n[A-Z]|$)/i);
  if (fullOrderMatch && fullOrderMatch[1] && fullOrderMatch[1].length > 20) {
    return fullOrderMatch[1].trim().slice(0, 1000);
  }
  
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
        return instructions.slice(0, 1000);
      }
    }
  }
  
  // If no good instructions in main content, check comments
  if (comments && comments.length > 0) {
    const commentsText = comments.join('\n');
    
    // Look for detailed recipe instructions in comments
    const recipeCommentPatterns = [
      /(?:recipe|order|instructions?)[:\s]*([^]+?)(?=\n\n|$)/i,
      /(?:here's how|how to make)[:\s]*([^]+?)(?=\n\n|$)/i,
      /(?:venti|grande|tall)[^]*?(?:pump|shot|add|with)[^]*?(?=\n\n|$)/i,
    ];
    
    for (const pattern of recipeCommentPatterns) {
      const match = commentsText.match(pattern);
      if (match && match[1] && match[1].length > 30) {
        const instructions = match[1].trim();
        if (!instructions.toLowerCase().includes('download') && !instructions.toLowerCase().includes('app')) {
          return instructions.slice(0, 1000);
        }
      }
    }
    
    // Look for any comment with recipe-like content (mentions sizes, pumps, etc.)
    const recipeKeywords = ['pump', 'shot', 'venti', 'grande', 'tall', 'add', 'ask for', 'extra', 'light', 'heavy'];
    const recipeComment = comments.find(comment => {
      const lower = comment.toLowerCase();
      return recipeKeywords.some(keyword => lower.includes(keyword)) && 
             comment.length > 30 && 
             !lower.includes('follow') && 
             !lower.includes('like');
    });
    
    if (recipeComment) {
      return recipeComment.slice(0, 1000);
    }
  }
  
  // Fallback: extract lines that look like instructions
  const lines = content.split('\n')
    .filter(line => line.trim().length > 5)
    .filter(line => {
      const lower = line.toLowerCase();
      return !lower.includes('app') && 
             !lower.includes('download') &&
             !lower.includes('follow') &&
             !lower.includes('like') &&
             !lower.includes('comment');
    })
    .slice(0, 10);
  
  return lines.join('\n') || 'Ask your barista to make this special drink!';
}

export function extractTags(content: string, comments?: string[]): string[] {
  const commonTags = [
    'viral', 'tiktok', 'instagram', 'lemon8', 'popular', 'trending', 
    'sweet', 'iced', 'hot', 'frappuccino', 'latte', 'pink', 'fruity', 
    'budget', 'cheap', 'starbucks', 'secret', 'menu', 'drink', 'caramel'
  ];
  
  const allText = comments ? `${content} ${comments.join(' ')}` : content;
  const lowerContent = allText.toLowerCase();
  
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
