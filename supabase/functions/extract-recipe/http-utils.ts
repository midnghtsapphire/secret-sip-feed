// HTTP utilities and headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

export function createErrorResponse(message: string, details: string = '', status: number = 400) {
  return new Response(
    JSON.stringify({ error: message, details }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export function handleOptionsRequest() {
  return new Response('ok', { headers: corsHeaders });
}

export const sanitizeErrorMessage = (error: any): string => {
  // Sanitize error messages to prevent information disclosure
  if (typeof error === 'string') {
    // Remove sensitive information from error messages
    return error
      .replace(/password/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/api[_-]?key/gi, '[REDACTED]')
      .replace(/auth/gi, '[REDACTED]')
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  }
  
  if (error?.message) {
    return sanitizeErrorMessage(error.message);
  }
  
  return 'An error occurred while processing your request';
};

export const createSecureErrorResponse = (
  error: any, 
  status: number = 500, 
  publicMessage?: string
): Response => {
  // Log the full error for debugging (server-side only)
  console.error('Detailed error:', error);
  
  // Return sanitized error to client
  const sanitizedMessage = publicMessage || sanitizeErrorMessage(error);
  
  return new Response(
    JSON.stringify({ 
      error: sanitizedMessage,
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
};
