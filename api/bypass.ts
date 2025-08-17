import type { VercelRequest, VercelResponse } from '@vercel/node';

// Bypass endpoint to test if SSO protection is active
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'SSO Bypass Successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL,
      project: process.env.VERCEL_PROJECT_NAME,
      protection_bypass: process.env.VERCEL_PROTECTION_BYPASS,
      sso_disabled: process.env.DISABLE_SSO
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}