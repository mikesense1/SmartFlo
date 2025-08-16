import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock blockchain status for Vercel deployment
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
    const { id } = req.query;
    
    // Mock successful blockchain deployment status
    const mockStatus = {
      status: 'deployed',
      contractAddress: `CTH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      escrowAddress: `ESH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      deploymentTx: `usdc_${Math.random().toString(36).substring(2, 10)}`,
      network: 'solana-devnet',
      createdAt: new Date().toISOString()
    };

    console.log(`Blockchain status for contract ${id}:`, mockStatus);
    res.status(200).json(mockStatus);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}