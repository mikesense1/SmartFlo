import { createServer } from 'http';
import { pool } from '../dist/db.js';
import { registerRoutes } from '../dist/routes.js';

// Initialize express app
import express from 'express';
import session from 'express-session';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Vercel
app.use(session({
  secret: process.env.SESSION_SECRET || 'vercel-production-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS required for production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none' // Required for cross-origin in Vercel
  },
}));

// CORS headers for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'SmartFlo API is running on Vercel',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Database health check
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Register all routes
const server = await registerRoutes(app);

// Export for Vercel
export default app;