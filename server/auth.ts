import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Validation schemas
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["freelancer", "client"], {
    required_error: "Please select your role",
  }),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: "An account with this email already exists" 
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash,
        userType: validatedData.userType,
        subscriptionTier: "free",
        totalContractsValue: "0",
        isEmailVerified: false,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        userType: users.userType,
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt,
      });
    
    // Set session properly
    (req as any).session.userId = newUser.id;
    (req as any).session.email = newUser.email;
    
    res.status(201).json({
      message: "Account created successfully",
      user: newUser,
      userType: newUser.userType,
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message 
      });
    }
    
    res.status(500).json({ 
      error: "Account creation failed. Please try again." 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (!user) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: "Invalid email or password" 
      });
    }
    
    // Set session properly
    (req as any).session.userId = user.id;
    (req as any).session.email = user.email;
    
    // Return user data (excluding sensitive info)
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      subscriptionTier: user.subscriptionTier,
    };
    
    res.json({
      message: "Login successful",
      user: userResponse,
      userType: user.userType,
    });
    
  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message 
      });
    }
    
    res.status(500).json({ 
      error: "Login failed. Please try again." 
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        userType: users.userType,
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
};

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: any) => {
  const userId = (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  next();
};