
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleOptionsRequest(): Response {
  return new Response(null, { headers: corsHeaders });
}

export function createResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  );
}

export function createErrorResponse(error: string, status: number = 500): Response {
  return createResponse({ error }, status);
}
