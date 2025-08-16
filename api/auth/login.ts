import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import bcrypt from 'bcrypt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set environment for project name change from "payflow" to "smartflo"
  process.env.VERCEL_PROJECT_NAME = 'smartflo';
  process.env.VERCEL_URL = process.env.VERCEL_URL || 'smartflo.vercel.app';
  
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Create JWT token for authentication
      const payload = {
        userId: user.id,
        email: user.email,
        userType: user.userType
      };
      
      // For serverless deployment, we'll use a simple token approach
      const token = Buffer.from(JSON.stringify({
        ...payload,
        projectName: 'smartflo',
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })).toString('base64');

      // Set authentication cookie
      res.setHeader('Set-Cookie', `smartflo-auth=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`);

      const userResponse = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        companyName: user.companyName,
        createdAt: user.createdAt
      };

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}