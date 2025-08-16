import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

// Helper function to extract and verify auth token
function extractAuthToken(req: VercelRequest): any | null {
  try {
    // Check Authorization header
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.expires && Date.now() > decoded.expires) {
        return null;
      }
      
      // Ensure token is for correct project
      if (decoded.projectName === 'smartflo') {
        return decoded;
      }
    }
    
    // Check cookies
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenMatch = cookies.match(/smartflo-auth=([^;]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        // Check if token is expired
        if (decoded.expires && Date.now() > decoded.expires) {
          return null;
        }
        
        // Ensure token is for correct project
        if (decoded.projectName === 'smartflo') {
          return decoded;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Token extraction error:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Extract and verify authentication token
      const authData = extractAuthToken(req);
      
      if (!authData || !authData.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Fetch user from database
      const user = await storage.getUserById(authData.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Return user data (excluding sensitive information)
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        companyName: user.companyName,
        createdAt: user.createdAt
      };
      
      res.status(200).json({ user: userResponse });
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}