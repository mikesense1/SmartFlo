import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const user = await storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user data (excluding password hash)
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        companyName: user.companyName,
        createdAt: user.createdAt
      };

      res.status(200).json(userResponse);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const updates = req.body;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { passwordHash, ...safeUpdates } = updates;
      
      const updatedUser = await storage.updateUser(id, safeUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return updated user data (excluding password hash)
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        userType: updatedUser.userType,
        companyName: updatedUser.companyName,
        createdAt: updatedUser.createdAt
      };

      res.status(200).json(userResponse);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}