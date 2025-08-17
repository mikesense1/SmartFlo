import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';

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

async function getSchema() {
  try {
    const { insertUserRawSchema } = await import('../shared/schema.js');
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
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
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

      res.setHeader('Set-Cookie', `smartflo-auth=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Max-Age=86400; Path=/`);

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

      res.setHeader('Set-Cookie', `smartflo-auth=${token}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Max-Age=86400; Path=/`);

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

    // AI Template Recommendations endpoint
    if (path === 'ai/template-recommendations') {
      if (req.method === 'POST') {
        try {
          const { projectType, scopeOfWork, projectDescription } = req.body;

          const prompt = `Based on the following project details, recommend 3 specialized contract templates with risk mitigation strategies:

Project Type: ${projectType}
Scope of Work: ${scopeOfWork}
Project Description: ${projectDescription}

For each template, provide:
1. Template name (specific to the work type)
2. Brief description
3. Key clauses that should be included
4. Risk mitigation strategies
5. Recommendation score (0-100 based on project fit)

Respond with JSON in this exact format:
{
  "templates": [
    {
      "id": "template-1",
      "name": "Template Name",
      "description": "Brief description of when to use this template",
      "projectTypes": ["Web Development", "Software Development"],
      "template": "Template overview text",
      "clauses": ["Clause 1", "Clause 2", "Clause 3"],
      "riskMitigation": ["Risk strategy 1", "Risk strategy 2"],
      "recommendationScore": 95
    }
  ]
}`;

          // Import OpenAI service dynamically
          const { aiContractService } = await import('../server/openai-service.js');
          const generatedRecommendations = await aiContractService.generateTemplateRecommendations(prompt);
          
          return res.status(200).json({ templates: generatedRecommendations });
        } catch (error) {
          console.error("Template recommendation error:", error);
          return res.status(500).json({ 
            message: "Failed to generate template recommendations",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
          });
        }
      }
    }

    // AI Contract Generation endpoint
    if (path === 'ai/generate-contract') {
      if (req.method === 'POST') {
        try {
          console.log("=== AI Contract Generation Request ===");
          console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
          console.log("Request body:", JSON.stringify(req.body, null, 2));
          
          const contractParams = req.body;
          console.log("Calling aiContractService.generateFreelanceContract...");
          
          // Import OpenAI service dynamically
          const { aiContractService } = await import('../server/openai-service.js');
          const generatedContract = await aiContractService.generateFreelanceContract(contractParams);
          console.log("Contract generated successfully, length:", generatedContract.length);
          
          return res.status(200).json({ contract: generatedContract });
        } catch (error) {
          console.error("=== Contract Generation Error ===");
          console.error("Error type:", (error as Error).constructor.name);
          console.error("Error message:", (error as Error).message);
          console.error("Full error:", error);
          
          // Check for specific OpenAI errors
          if ((error as Error).message?.includes('API key')) {
            console.error("This appears to be an API key issue");
          }
          
          return res.status(500).json({ 
            message: "Failed to generate contract",
            error: error instanceof Error ? error.message : "Unknown error",
            debug: {
              hasApiKey: !!process.env.OPENAI_API_KEY,
              errorType: (error as Error).constructor.name
            }
          });
        }
      }
    }

    // AI Risk Analysis endpoint
    if (path === 'ai/analyze-risks') {
      if (req.method === 'POST') {
        try {
          const contractParams = req.body;
          
          // Import OpenAI service dynamically
          const { aiContractService } = await import('../server/openai-service.js');
          const riskAnalysis = await aiContractService.analyzeContractRisks(contractParams);
          
          return res.status(200).json({ analysis: riskAnalysis });
        } catch (error) {
          console.error("Risk analysis error:", error);
          return res.status(500).json({ 
            message: "Failed to analyze contract risks",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
          });
        }
      }
    }

    // Default route
    return res.status(404).json({ message: 'API endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      path: path,
      url: req.url
    });
  }
}