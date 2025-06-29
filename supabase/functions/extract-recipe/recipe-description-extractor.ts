
// Recipe description extraction utilities
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
