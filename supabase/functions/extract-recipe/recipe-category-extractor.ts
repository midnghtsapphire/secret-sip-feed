
// Recipe category extraction utilities
interface CategoryMatcher {
  category: string;
  keywords: string[];
  strongKeywords: string[];
}

export function extractCategory(content: string, comments?: string[]): string {
  const allText = comments ? `${content} ${comments.join(' ')}` : content;
  const lowerContent = allText.toLowerCase();
  
  // Enhanced category detection with more keywords and patterns
  const categoryMatchers: CategoryMatcher[] = [
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
