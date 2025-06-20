
// Rate limiting functionality
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

export const defaultRateLimit: RateLimitConfig = {
  requests: 10,
  windowMs: 60000 // 1 minute
};

export function checkRateLimit(clientId: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + config.windowMs });
    return true;
  }
  
  if (clientData.count >= config.requests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

export function getClientId(request: Request): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}
