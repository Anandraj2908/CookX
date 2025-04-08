import { Router, Request, Response } from 'express';
import User from '../models/user.model';
import { auth } from '../middleware/auth.middleware';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['username', 'email', 'password']
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          'Email already in use' : 'Username already taken' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // Will be hashed by pre-save hook
    });

    // Save user to database
    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '30d' }
    );

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    );

    // Return user info (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: (error as any).errors
      });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '30d' }
    );

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    );

    // Return user info (without password)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post("/logout", (req: Request, res: Response) => {
  try {
    // Clear cookie
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      })
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get("/me", auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

/**
 * GET /api/auth/db-status
 * Check database connection status
 */
router.get("/db-status", async (_req: Request, res: Response) => {
  try {
    const status = mongoose.connection.readyState;
    const statusMessage = 
      status === 0 ? 'Disconnected' :
      status === 1 ? 'Connected' :
      status === 2 ? 'Connecting' :
      status === 3 ? 'Disconnecting' : 'Unknown';
    
    res.json({ 
      status, 
      message: statusMessage,
      database: mongoose.connection.name
    });
  } catch (error) {
    console.error('DB status check error:', error);
    res.status(500).json({ message: 'Server error checking database status' });
  }
});

export default router;