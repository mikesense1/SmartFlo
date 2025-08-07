const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('=== Risk Analysis Request ===');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { projectData, clientData, milestones, paymentMethod } = req.body;

    if (!projectData || !clientData || !milestones) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['projectData', 'clientData', 'milestones']
      });
    }

    const prompt = `Analyze the following freelance contract for potential risks and provide mitigation strategies:

Project: ${projectData.title || 'Untitled Project'}
Description: ${projectData.description || 'No description provided'}
Project Type: ${projectData.projectType || 'Not specified'}
Timeline: ${projectData.startDate || 'Not specified'} to ${projectData.endDate || 'Not specified'}

Client: ${clientData.clientName || 'Not specified'}
Email: ${clientData.clientEmail || 'Not specified'}
Company: ${clientData.clientCompany || 'Not specified'}

Payment Method: ${paymentMethod || 'Not specified'}
Milestones: ${milestones.length} milestones planned

Milestone Details:
${milestones.map((m, i) => `${i+1}. ${m.title || 'Untitled'} - $${m.amount || 0} (Due: ${m.dueDate || 'Not specified'})`).join('\n')}

Provide risk analysis in this exact JSON format:
{
  "overallRisk": "low|medium|high",
  "riskScore": 85,
  "risks": [
    {
      "category": "Payment Risk",
      "level": "medium",
      "description": "Detailed risk description",
      "mitigation": ["Mitigation strategy 1", "Mitigation strategy 2"]
    }
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ],
  "contractClauses": [
    "Suggested clause to add to contract"
  ]
}`;

    console.log('Calling OpenAI for risk analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert risk analyst specializing in freelance contracts. Provide thorough, practical risk assessments with actionable mitigation strategies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3
    });

    console.log('OpenAI risk analysis response received');
    const riskAnalysis = JSON.parse(response.choices[0].message.content);
    
    // Validate the response structure
    if (!riskAnalysis.overallRisk || !riskAnalysis.risks) {
      throw new Error('Invalid response format from OpenAI');
    }

    console.log(`Risk analysis completed - Overall risk: ${riskAnalysis.overallRisk}`);
    
    res.json({ analysis: riskAnalysis });
  } catch (error) {
    console.error('=== Risk Analysis Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Check for specific OpenAI errors
    if (error.message?.includes('API key')) {
      console.error('This appears to be an API key issue');
      return res.status(401).json({ 
        error: 'OpenAI API key not configured or invalid',
        message: 'Please check your OpenAI API key configuration'
      });
    }
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded',
        message: 'Please check your OpenAI billing and usage limits'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze contract risks',
      message: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        errorType: error.constructor.name
      }
    });
  }
};