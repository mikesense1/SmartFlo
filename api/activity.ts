import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertContractActivitySchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const activityData = insertContractActivitySchema.parse(req.body);
      
      const activity = await storage.createContractActivity(activityData);
      res.status(200).json(activity);
    } catch (error) {
      console.error('Activity creation error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid activity data' 
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { contractId } = req.query;
      
      if (!contractId || typeof contractId !== 'string') {
        return res.status(400).json({ error: 'Contract ID is required' });
      }

      const activities = await storage.getContractActivity(contractId);
      res.status(200).json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}