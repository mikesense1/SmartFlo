import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import bcrypt from 'bcrypt';
import { insertUserSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Email, password, and full name are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user data
      const userData = insertUserSchema.parse({
        email,
        passwordHash,
        fullName,
        userType: null, // Will be set during setup
        companyName: null
      });

      // Create user
      const user = await storage.createUser(userData);

      // Return user data (excluding password hash)
      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        companyName: user.companyName,
        createdAt: user.createdAt
      };

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Signup failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}