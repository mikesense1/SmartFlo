import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertMilestoneSchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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
      const milestoneData = insertMilestoneSchema.parse(req.body);
      
      console.log('Creating milestone with data:', milestoneData);
      
      const milestone = await storage.createMilestone(milestoneData);
      res.status(200).json({ message: "Milestone created successfully", milestone });
    } catch (error) {
      console.error('Milestone creation error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid milestone data' 
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { contractId } = req.query;
      
      if (!contractId || typeof contractId !== 'string') {
        return res.status(400).json({ error: 'Contract ID is required' });
      }

      const milestones = await storage.getMilestonesByContract(contractId);
      res.status(200).json(milestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}