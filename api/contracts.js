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

  if (req.method === 'POST') {
    try {
      const {
        title,
        projectDescription,
        clientName,
        clientEmail,
        totalValue,
        paymentMethod,
        contractType,
        startDate,
        endDate,
        creatorId,
        status
      } = req.body;

      const query = `
        INSERT INTO contracts (
          id, title, project_description, client_name, client_email, 
          total_value, payment_method, contract_type, start_date, 
          end_date, creator_id, status, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
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
        startDate,
        endDate,
        creatorId,
        status || 'draft'
      ];

      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
      
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