// Vercel configuration for SmartFlo project
// Updated for project name change from "payflow" to "smartflo"

export const vercelConfig = {
  // Project identification
  projectName: process.env.VERCEL_PROJECT_NAME || 'smartflo',
  projectUrl: process.env.VERCEL_URL || 'smartflo.vercel.app',
  
  // OpenID Connect Federation settings
  oidc: {
    issuer: process.env.VERCEL_TOKEN_ISSUER || 'https://token.vercel.app',
    audience: process.env.VERCEL_TOKEN_AUDIENCE || 'smartflo',
    
    // Updated token claims for project name change
    expectedClaims: {
      iss: 'https://token.vercel.app',
      aud: 'smartflo', // Changed from "payflow"
      sub: 'user',
      'vercel.com/project': 'smartflo', // Updated project identifier
    }
  },
  
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // API configuration
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || 'smartflo.vercel.app'}` 
      : 'http://localhost:5000',
    timeout: 30000,
  },
  
  // Authentication settings
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'smartflo-session-secret-key',
    sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    cookieName: 'smartflo-session',
    cookieDomain: process.env.NODE_ENV === 'production' 
      ? '.smartflo.vercel.app' 
      : 'localhost',
  }
};

export default vercelConfig;