const { Pool } = require('pg');

// Configure database connection for Vercel - with fallback for immediate functionality
let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
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
    } : false
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

  if (req.method === 'GET') {
    try {
      const { id: userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const query = `
        SELECT 
          id,
          creator_id,
          title,
          client_name,
          client_email,
          project_description,
          total_value,
          payment_method,
          contract_type,
          status,
          solana_program_address,
          metadata_uri,
          created_at,
          activated_at,
          completed_at
        FROM contracts 
        WHERE creator_id = $1 
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      
      console.log(`Found ${result.rows.length} contracts for user ${userId}`);
      res.status(200).json(result.rows);
      
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch contracts',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};