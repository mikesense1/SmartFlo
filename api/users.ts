import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic imports for serverless compatibility
async function getStorage() {
  try {
    const { storage } = await import('../server/storage.js');
    return storage;
  } catch (error) {
    console.error('Storage import error:', error);
    throw new Error('Database connection failed');
  }
}

// Set environment and CORS
function setupEnvironment() {
  process.env.VERCEL_PROJECT_NAME = 'smartflo';
  process.env.VERCEL_URL = process.env.VERCEL_URL || 'smartflo.vercel.app';
  // Debug: Log current environment for troubleshooting
  console.log('Users API Environment setup:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_NAME: process.env.VERCEL_PROJECT_NAME
  });
}

function setCorsHeaders(res: VercelResponse) {
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
}

// Authentication helper
async function authenticateRequest(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const token = req.cookies?.['smartflo-auth'] || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No auth token found in users API');
      return null;
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Debug: Log token validation for troubleshooting
    console.log('Users API Token validation:', {
      projectName: decoded.projectName,
      expectedProject: 'smartflo',
      expires: decoded.expires,
      currentTime: Date.now(),
      isExpired: decoded.expires < Date.now()
    });
    
    // More lenient project name validation to handle potential naming conflicts
    const validProjectNames = ['smartflo', 'payflow']; // Allow both during transition
    if (!validProjectNames.includes(decoded.projectName) || decoded.expires < Date.now()) {
      console.log('Users API Token validation failed');
      return null;
    }

    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error('Users API Authentication error:', error);
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

      const storage = await getStorage();
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
      
      const storage = await getStorage();
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