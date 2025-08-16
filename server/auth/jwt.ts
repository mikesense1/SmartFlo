import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartflo-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
  projectName: 'smartflo'; // Updated from 'payflow'
}

export const signToken = (payload: Omit<JWTPayload, 'projectName'>): string => {
  return jwt.sign(
    { ...payload, projectName: 'smartflo' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Ensure the token is for the correct project (handle project name change)
    if (decoded.projectName !== 'smartflo') {
      console.warn('Token project name mismatch:', decoded.projectName);
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const extractTokenFromRequest = (req: any): string | null => {
  // Check Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const token = req.cookies?.['smartflo-auth'];
  if (token) {
    return token;
  }
  
  return null;
};