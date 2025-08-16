import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple auth middleware for Vercel serverless functions
export function vercelAuth(req: VercelRequest): string | null {
  // In production, this would validate session tokens, JWTs, etc.
  // For now, we'll use a simple header-based auth for testing
  const userId = req.headers['x-user-id'] as string;
  
  // In a real deployment, you'd validate the session/token here
  // For now, return the user ID if present
  return userId || null;
}

export function requireAuth(req: VercelRequest, res: VercelResponse): string | null {
  const userId = vercelAuth(req);
  
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  
  return userId;
}