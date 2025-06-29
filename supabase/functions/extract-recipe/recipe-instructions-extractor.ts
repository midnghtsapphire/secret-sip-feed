
// Recipe instructions extraction utilities
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
