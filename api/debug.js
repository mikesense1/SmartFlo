// Vercel serverless function to test OpenAI API key
export default function handler(req, res) {
  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyLength = process.env.OPENAI_API_KEY?.length || 0;
    const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || "none";
    
    res.status(200).json({
      hasApiKey,
      keyLength,
      keyPrefix,
      environment: process.env.NODE_ENV || "unknown",
      vercelEnv: process.env.VERCEL_ENV || "unknown",
      timestamp: new Date().toISOString(),
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
      message: hasApiKey ? "OpenAI API key is available" : "OpenAI API key is missing"
    });
  } catch (error) {
    res.status(500).json({
      error: "Debug endpoint failed",
      message: error.message
    });
  }
}