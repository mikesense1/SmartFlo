import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

// Set environment and CORS
function setupEnvironment() {
  process.env.VERCEL_PROJECT_NAME = 'smartflo';
  process.env.VERCEL_URL = process.env.VERCEL_URL || 'smartflo.vercel.app';
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

// Authentication helper
async function authenticateRequest(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const token = req.cookies?.['smartflo-auth'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (decoded.projectName !== 'smartflo' || decoded.expires < Date.now()) {
      return null;
    }

    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setupEnvironment();
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { endpoint } = req.query;
  const path = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

  try {
    const auth = await authenticateRequest(req);
    
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user by ID
    if (req.method === 'GET' && path) {
      const userId = path.split('/')[0];
      const action = path.split('/')[1];

      // Only allow users to access their own data
      if (userId !== auth.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (action === 'contracts') {
        const contracts = await storage.getContractsByUser(userId);
        return res.status(200).json(contracts);
      }

      // Return user data
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt
      };

      return res.status(200).json(userResponse);
    }

    // Update user
    if (req.method === 'PATCH' && path) {
      const userId = path.split('/')[0];

      // Only allow users to update their own data
      if (userId !== auth.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates = req.body;
      const { passwordHash, ...safeUpdates } = updates;
      
      const updatedUser = await storage.updateUser(userId, safeUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        userType: updatedUser.userType,
        subscriptionTier: updatedUser.subscriptionTier,
        createdAt: updatedUser.createdAt
      };

      return res.status(200).json(userResponse);
    }

    return res.status(404).json({ message: 'Endpoint not found' });

  } catch (error) {
    console.error('Users API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}