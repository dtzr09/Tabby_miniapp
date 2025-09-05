import { NextApiRequest } from 'next';

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiter
export function rateLimit(req: NextApiRequest, limit: number = 100, windowMs: number = 60000): boolean {
  const key = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const record = rateLimitMap.get(key as string);
  
  if (!record || record.resetTime <= windowStart) {
    rateLimitMap.set(key as string, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}