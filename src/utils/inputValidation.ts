
// Input validation utilities for security
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateRecipeName = (name: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length < 2) {
    return { isValid: false, error: 'Recipe name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Recipe name must be less than 100 characters' };
  }
  
  // Check for suspicious patterns
  if (/[<>{}\\]/.test(sanitized)) {
    return { isValid: false, error: 'Recipe name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateRecipeDescription = (description: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(description);
  
  if (sanitized.length > 1000) {
    return { isValid: false, error: 'Description must be less than 1000 characters' };
  }
  
  return { isValid: true };
};

export const validateRecipeInstructions = (instructions: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(instructions);
  
  if (sanitized.length > 2000) {
    return { isValid: false, error: 'Instructions must be less than 2000 characters' };
  }
  
  return { isValid: true };
};

export const validateRecipeTags = (tags: string[]): { isValid: boolean; error?: string } => {
  if (tags.length > 10) {
    return { isValid: false, error: 'Maximum 10 tags allowed' };
  }
  
  for (const tag of tags) {
    const sanitized = sanitizeInput(tag);
    if (sanitized.length > 30) {
      return { isValid: false, error: 'Each tag must be less than 30 characters' };
    }
    if (/[<>{}\\]/.test(sanitized)) {
      return { isValid: false, error: 'Tags contain invalid characters' };
    }
  }
  
  return { isValid: true };
};
