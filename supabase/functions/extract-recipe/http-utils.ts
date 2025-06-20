
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
