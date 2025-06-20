
// Content validation utilities
export function isAppRedirectContent(content: string): boolean {
  const redirectIndicators = [
    'download the app',
    'open in app',
    'get the app',
    'app store',
    'google play',
    'better on the app',
    'continue in app',
    'install app'
  ];
  
  const lowerContent = content.toLowerCase();
  const hasRedirectContent = redirectIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  return hasRedirectContent && content.length < 500;
}

export function isValidRecipeName(name: string): boolean {
  return name && 
         name.length >= 3 && 
         !name.toLowerCase().includes('download') && 
         !name.toLowerCase().includes('app');
}
