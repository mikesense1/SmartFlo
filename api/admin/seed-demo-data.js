// Vercel API endpoint to seed demo data in production
const { seedSimpleData } = require('../../dist/simple-seed');

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🌱 Seeding demo data via API endpoint...');
    
    const result = await seedSimpleData();
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    res.status(500).json({ 
      error: 'Failed to seed demo data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};