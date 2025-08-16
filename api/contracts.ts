import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertContractSchema } from '../shared/schema';

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

    // Get contracts
    if (req.method === 'GET' && (!path || path === '')) {
      const contracts = await storage.getContractsByUser(auth.userId);
      return res.status(200).json(contracts);
    }

    // Create contract
    if (req.method === 'POST' && (!path || path === '')) {
      const contractData = insertContractSchema.parse({
        ...req.body,
        creatorId: auth.userId
      });

      const contract = await storage.createContract(contractData);
      return res.status(201).json(contract);
    }

    // Get contract by ID
    if (req.method === 'GET' && path) {
      const contractId = path.split('/')[0];
      const action = path.split('/')[1];

      const contract = await storage.getContract(contractId);
      
      if (!contract || contract.creatorId !== auth.userId) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      if (action === 'document') {
        return res.status(200).json({
          contract: contract.generatedContract || 'Contract document not generated yet'
        });
      }

      if (action === 'blockchain-status') {
        return res.status(200).json({
          status: contract.blockchainStatus || 'pending',
          address: contract.solanaProgramAddress,
          network: contract.blockchainNetwork || 'devnet'
        });
      }

      return res.status(200).json(contract);
    }

    return res.status(404).json({ message: 'Endpoint not found' });

  } catch (error) {
    console.error('Contracts API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}