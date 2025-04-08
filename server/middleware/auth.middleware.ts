import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import mongoose from 'mongoose';

// Extend the Request interface to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | mongoose.Types.ObjectId;
      };
      token?: string;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header, cookies, or query parameter
    let token;
    
    // Check header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Check cookies
    if (!token && req.cookies) {
      token = req.cookies.token;
    }
    
    // Check query params (less secure, use only for testing)
    if (!token && req.query && req.query.token) {
      token = req.query.token as string;
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        message: 'Authentication required, no token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_for_dev'
    ) as { id: string };
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'User not found or token is invalid'
      });
    }
    
    // Set user and token on request object
    req.user = { id: user._id as mongoose.Types.ObjectId };
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if ((error as any).name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    if ((error as any).name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      message: 'Server error during authentication'
    });
  }
};

export default auth;