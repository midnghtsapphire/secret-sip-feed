
// Recipe tags extraction utilities
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
