import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Register all routes
registerRoutes(app);

// Export Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Express-compatible format
  const expressReq = req as any;
  const expressRes = res as any;
  
  expressReq.url = req.url?.replace('/api', '') || '/';
  expressReq.method = req.method;
  
  // Handle the request through Express
  app(expressReq, expressRes);
}