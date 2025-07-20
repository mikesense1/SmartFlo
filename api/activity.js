const { Pool } = require('pg');

// Configure database connection for Vercel with proper connection management
let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
      rejectUnauthorized: false
    },
    max: 1, // Limit connections for serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Fallback to environment variables if DATABASE_URL is missing
  dbConfig = {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(dbConfig);

module.exports = async function handler(req, res) {
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
      const {
        contractId,
        action,
        actorEmail,
        details
      } = req.body;

      const query = `
        INSERT INTO contract_activity (
          id, contract_id, action, actor_email, details, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, NOW()
        )
        RETURNING *
      `;

      const values = [
        contractId,
        action,
        actorEmail,
        JSON.stringify(details || {})
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
      
    } catch (error) {
      console.error('Activity creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create activity log',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};