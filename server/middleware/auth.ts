import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    userType: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Fetch user from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        userType: users.userType,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

export const requireUserType = (requiredType: 'freelancer' | 'client') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.user.userType !== requiredType) {
      return res.status(403).json({ error: `Access denied. ${requiredType} account required.` });
    }
    
    next();
  };
};