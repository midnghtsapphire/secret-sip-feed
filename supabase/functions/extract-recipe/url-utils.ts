
// URL utility functions
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
