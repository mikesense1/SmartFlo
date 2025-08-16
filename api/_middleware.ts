import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function middleware(request: VercelRequest, response: VercelResponse) {
  // Set environment variables for OpenID Connect Federation
  // This ensures the project name change from "payflow" to "smartflo" is handled correctly
  process.env.VERCEL_PROJECT_NAME = 'smartflo';
  process.env.VERCEL_URL = process.env.VERCEL_URL || 'smartflo.vercel.app';
  
  // Set proper CORS headers for all API requests
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // Continue with the request
  return;
}

export const config = {
  matcher: '/api/:path*',
}