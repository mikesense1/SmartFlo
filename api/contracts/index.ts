import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { insertContractSchema } from '../../shared/schema';
import { vercelBlockchainService } from '../../server/vercel-blockchain-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const contractData = insertContractSchema.parse(req.body);
      
      console.log('Creating contract with data:', {
        title: contractData.title,
        creatorId: contractData.creatorId,
        clientEmail: contractData.clientEmail,
        totalValue: contractData.totalValue
      });

      // Validate required fields
      if (!contractData.creatorId) {
        return res.status(400).json({ message: 'Creator ID is required' });
      }

      // Create contract in database
      const contract = await storage.createContract(contractData);
      console.log('Contract created:', contract);

      // Deploy smart contract asynchronously
      console.log('Starting blockchain deployment for contract', contract.id);
      
      try {
        const blockchainDeployment = await vercelBlockchainService.deployContract(
          contract.id, 
          contractData.paymentMethod
        );
        
        console.log('Blockchain deployment completed for contract', contract.id);
        console.log('Smart contract deployed successfully for contract', contract.id);
        
        // Update contract with blockchain info (optional - could be done later)
        await storage.updateContract(contract.id, {
          solanaProgramAddress: blockchainDeployment.contractAddress,
          escrowAddress: blockchainDeployment.escrowAddress,
          blockchainNetwork: blockchainDeployment.network,
          deploymentTx: blockchainDeployment.deploymentTx,
          blockchainStatus: "deployed"
        });
        
      } catch (blockchainError) {
        console.warn('Blockchain deployment failed but contract created:', blockchainError);
        // Contract creation should succeed even if blockchain deployment fails
      }

      res.status(200).json(contract);
    } catch (error) {
      console.error('Contract creation error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid contract data' 
      });
    }
  } else if (req.method === 'GET') {
    try {
      // Get user from session/auth (simplified for serverless)
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      console.log('Fetching contracts for user:', userId);
      const contracts = await storage.getContractsByCreator(userId);
      console.log(`Successfully retrieved ${contracts.length} contracts for user`);
      
      res.status(200).json(contracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}