const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectData, clientData, milestones, paymentMethod, customPrompt = "" } = req.body;

    if (!projectData || !clientData || !milestones) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectData, clientData, milestones' 
      });
    }

    const systemPrompt = `You are an expert freelance contract attorney specializing in protecting freelancers from common payment delays, scope creep, and legal issues. Generate professional, legally sound freelance service agreements that prioritize freelancer protection while being fair to clients.

Key requirements:
1. Use professional legal language appropriate for freelance contracts
2. Include strong payment protection clauses
3. Define clear scope boundaries to prevent scope creep
4. Include intellectual property protections
5. Add dispute resolution mechanisms
6. Include automatic payment release terms
7. Add client response timeframes to prevent delays
8. Include contract termination protections

Always prioritize freelancer protection while maintaining professional client relationships.`;

    const userPrompt = `Generate a comprehensive freelance service agreement with the following details:

PROJECT INFORMATION:
- Type: ${projectData.projectType}
- Title: ${projectData.title}
- Description: ${projectData.description}
- Start Date: ${projectData.startDate}
- End Date: ${projectData.endDate}
- Pricing Model: ${projectData.pricingModel}
- Total Budget: $${clientData.projectBudget}

CLIENT INFORMATION:
- Name: ${clientData.clientName}
- Email: ${clientData.clientEmail}
- Company: ${clientData.clientCompany || 'Individual Client'}

MILESTONES:
${milestones.map((milestone, index) => `
Milestone ${index + 1}: ${milestone.title}
- Deliverables: ${milestone.deliverables}
- Amount: $${milestone.amount}
- Due Date: ${milestone.dueDate}
- Percentage: ${milestone.percentage}%
`).join('')}

PAYMENT METHOD: ${paymentMethod === "stripe" ? "Traditional payment processing (Stripe)" : "Cryptocurrency escrow (USDC)"}

CUSTOM REQUIREMENTS:
${customPrompt || "Standard freelance protections apply"}

Generate a complete, professional freelance service agreement that includes:
1. Clear project scope and deliverables
2. Milestone-based payment structure with automatic release terms
3. Intellectual property clauses favoring the freelancer
4. Scope change procedures with additional compensation
5. Client approval timeframes (7-day maximum)
6. Dispute resolution procedures
7. Contract termination clauses
8. Late payment penalties
9. Communication and revision policies
10. Legal jurisdiction and governing law

Format as a professional legal document with proper headings and numbered sections.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const contractText = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      contract: contractText
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please verify your credentials.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate contract', 
      details: error.message 
    });
  }
}