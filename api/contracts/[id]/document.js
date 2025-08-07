const { Pool } = require('pg');

// Database connection configuration for Vercel
let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
      rejectUnauthorized: false
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
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
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    const query = `
      SELECT id, title, client_name, generated_contract 
      FROM contracts 
      WHERE id = $1
    `;
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      
      const contract = result.rows[0];
      
      if (!contract.generated_contract) {
        return res.status(404).json({ 
          error: 'Contract document not available',
          message: 'This contract does not have a generated document. It may have been created before AI generation was available.'
        });
      }
      
      res.json({ 
        document: contract.generated_contract,
        contractId: contract.id,
        title: contract.title,
        clientName: contract.client_name
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to get contract document:', error);
    res.status(500).json({ error: 'Failed to get contract document' });
  }
}