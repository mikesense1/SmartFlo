import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../server/storage';

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
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Contract ID is required' });
      }

      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Return the generated contract document
      res.status(200).json({
        id: contract.id,
        document: contract.generatedContract || 'Contract document not available',
        title: contract.title,
        createdAt: contract.createdAt
      });
    } catch (error) {
      console.error('Error fetching contract document:', error);
      res.status(500).json({ error: 'Failed to fetch contract document' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}