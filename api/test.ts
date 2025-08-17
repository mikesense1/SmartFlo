import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers with SSO bypass configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Support multiple origins for production and development
  const allowedOrigins = [
    'https://getsmartflo.com',
    'https://www.getsmartflo.com',
    'http://localhost:5173',
    'http://localhost:5000'
  ];
  
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : 'https://getsmartflo.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Add SSO bypass headers
  res.setHeader('X-Vercel-Protection-Bypass', process.env.VERCEL_PROTECTION_BYPASS || 'false');
  res.setHeader('X-SSO-Disabled', process.env.DISABLE_SSO || 'false');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    return res.status(200).json({
      message: 'API is working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Test endpoint failed',
      message: (error as Error).message
    });
  }
}