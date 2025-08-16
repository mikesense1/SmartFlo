import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';

// Dynamic imports for serverless compatibility
async function getStorage() {
  try {
    const { storage } = await import('../server/storage');
    return storage;
  } catch (error) {
    console.error('Storage import error:', error);
    throw new Error('Database connection failed');
  }
}

async function getSchema() {
  try {
    const { insertUserRawSchema } = await import('../shared/schema');
    return { insertUserRawSchema };
  } catch (error) {
    console.error('Schema import error:', error);
    throw new Error('Schema validation failed');
  }
}

// Set environment for project name change from "payflow" to "smartflo"
function setupEnvironment() {
  process.env.VERCEL_PROJECT_NAME = 'smartflo';
  process.env.VERCEL_URL = process.env.VERCEL_URL || 'smartflo.vercel.app';
}

// Set CORS headers
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

  // Extract path from URL for proper routing
  let path = '';
  if (req.url) {
    const urlParts = req.url.split('?')[0].split('/api/')[1];
    path = urlParts || '';
  }
  
  // Fallback to query parameter
  if (!path && req.query.endpoint) {
    const { endpoint } = req.query;
    path = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
  }

  try {
    // Auth endpoints - handle both URL paths and query parameters
    if (path === 'auth/login' || path === 'login' || req.url?.includes('/auth/login')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const storage = await getStorage();
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await bcrypt.compare(password, user.passwordHash || '')) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        projectName: 'smartflo',
        expires: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');

      res.setHeader('Set-Cookie', `smartflo-auth=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`);

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          userType: user.userType,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt
        },
        token
      });
    }

    // Auth signup
    if (path === 'auth/signup' || path === 'signup' || req.url?.includes('/auth/signup')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const { email, password, fullName, userType } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Email, password, and full name are required' });
      }

      const storage = await getStorage();
      const { insertUserRawSchema } = await getSchema();
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const userData = insertUserRawSchema.parse({
        email,
        passwordHash,
        fullName,
        userType: userType || 'freelancer',
        subscriptionTier: 'free'
      });

      const user = await storage.createUser(userData);

      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        projectName: 'smartflo',
        expires: Date.now() + (24 * 60 * 60 * 1000)
      })).toString('base64');

      res.setHeader('Set-Cookie', `smartflo-auth=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`);

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          userType: user.userType,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt
        },
        token
      });
    }

    // Auth logout
    if (path === 'auth/logout' || path === 'logout' || req.url?.includes('/auth/logout')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      res.setHeader('Set-Cookie', `smartflo-auth=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`);
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    // Auth me
    if (path === 'auth/me' || path === 'me' || req.url?.includes('/auth/me')) {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const auth = await authenticateRequest(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const storage = await getStorage();
      const user = await storage.getUserById(auth.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          userType: user.userType,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt
        }
      });
    }

    // Milestones endpoints
    if (path === 'milestones') {
      if (req.method === 'GET') {
        const contractId = req.query.contractId as string;
        if (contractId) {
          const storage = await getStorage();
          const milestones = await storage.getMilestonesByContract(contractId);
          return res.status(200).json(milestones);
        }
        return res.status(400).json({ error: 'contractId required' });
      }
    }

    // Activity endpoints
    if (path === 'activity') {
      if (req.method === 'GET') {
        const contractId = req.query.contractId as string;
        if (contractId) {
          const storage = await getStorage();
          const activity = await storage.getContractActivity(contractId);
          return res.status(200).json(activity);
        }
      }
    }

    // Default route
    return res.status(404).json({ message: 'API endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      path: path,
      url: req.url
    });
  }
}