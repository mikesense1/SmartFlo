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
    console.log('=== Template Recommendations Request ===');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { projectType, scopeOfWork, projectDescription } = req.body;

    if (!projectType || !scopeOfWork || !projectDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['projectType', 'scopeOfWork', 'projectDescription']
      });
    }

    const prompt = `Based on the following project details, recommend 3 specialized contract templates with risk mitigation strategies:

Project Type: ${projectType}
Scope of Work: ${scopeOfWork}
Project Description: ${projectDescription}

For each template, provide:
1. Template name (specific to the work type)
2. Brief description
3. Key clauses that should be included
4. Risk mitigation strategies
5. Recommendation score (0-100 based on project fit)

Respond with JSON in this exact format:
{
  "templates": [
    {
      "id": "template-1",
      "name": "Template Name",
      "description": "Brief description of when to use this template",
      "projectTypes": ["Web Development", "Software Development"],
      "template": "Template overview text",
      "clauses": ["Clause 1", "Clause 2", "Clause 3"],
      "riskMitigation": ["Risk strategy 1", "Risk strategy 2"],
      "recommendationScore": 95
    }
  ]
}`;

    console.log('Calling OpenAI for template recommendations...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert legal contract advisor specializing in freelance and service agreements. Provide practical, legally sound template recommendations based on project requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.3
    });

    console.log('OpenAI response received');
    const generatedRecommendations = JSON.parse(response.choices[0].message.content);
    
    // Validate the response structure
    if (!generatedRecommendations.templates || !Array.isArray(generatedRecommendations.templates)) {
      throw new Error('Invalid response format from OpenAI');
    }

    console.log(`Generated ${generatedRecommendations.templates.length} template recommendations`);
    
    res.json({ templates: generatedRecommendations.templates });
  } catch (error) {
    console.error('=== Template Recommendation Error ===');
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
      error: 'Failed to generate template recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        errorType: error.constructor.name
      }
    });
  }
};