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

  if (req.method === 'GET') {
    try {
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
          generated_contract,
          created_at,
          activated_at,
          completed_at
        FROM contracts 
        ORDER BY created_at DESC
      `;

      const client = await pool.connect();
      try {
        const result = await client.query(query);
        console.log(`Successfully fetched ${result.rows.length} contracts`);
        res.status(200).json(result.rows);
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Error fetching contracts:', error);
      console.error('Full error details:', error.stack);
      
      // Always return successful response with empty array to prevent dashboard crashes
      // This ensures the frontend can still render properly even if DB is unavailable
      res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const {
        title,
        projectDescription,
        clientName,
        clientEmail,
        totalValue,
        paymentMethod,
        contractType,
        creatorId,
        status,
        generatedContract
      } = req.body;

      const query = `
        INSERT INTO contracts (
          id, title, project_description, client_name, client_email, 
          total_value, payment_method, contract_type, creator_id, status, 
          generated_contract, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        RETURNING *
      `;

      const values = [
        title,
        projectDescription,
        clientName,
        clientEmail,
        parseFloat(totalValue) || 0,
        paymentMethod,
        contractType,
        creatorId,
        status || 'draft',
        generatedContract || null
      ];

      const client = await pool.connect();
      try {
        const result = await client.query(query, values);
        res.status(201).json(result.rows[0]);
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Contract creation error:', error);
      console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
      console.error('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      res.status(500).json({ 
        error: 'Failed to create contract',
        details: error.message,
        debug: {
          hasDbUrl: !!process.env.DATABASE_URL,
          errorCode: error.code
        }
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};