import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

// Define the secret key for JWT verification (same as in user model)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-123456789";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

/**
 * Authentication middleware for Express
 * Verifies the JWT token from cookies or Authorization header
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token = 
      req.cookies?.token || 
      req.header("Authorization")?.replace("Bearer ", "");

    // If no token found, return unauthorized error
    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Find the user by id
    const user = await User.findById(decoded.id);
    
    // If user not found, return unauthorized error
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

export default auth;