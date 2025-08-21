import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

// Configure Neon for serverless environments
neonConfig.webSocketConstructor = ws;

// Enhanced error handling for missing DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('Environment variables:', Object.keys(process.env));
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...', {
  url: process.env.DATABASE_URL ? 'Set' : 'Missing',
  env: process.env.NODE_ENV
});

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 second timeout for Vercel
});

export const db = drizzle({ client: pool, schema });

// Test connection on initialization
pool.connect()
  .then(client => {
    console.log('Database connection successful');
    client.release();
  })
  .catch(error => {
    console.error('Database connection failed:', error);
  });