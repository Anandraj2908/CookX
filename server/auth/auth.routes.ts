import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.model";
import auth from "../middleware/auth.middleware";
import { log } from "../vite";

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
      log("Signup validation error: Missing required fields", "auth");
      return res.status(400).json({
        error: "All fields are required: username, email, and password"
      });
    }
    
    if (password.length < 6) {
      log("Signup validation error: Password too short", "auth");
      return res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
    }
    
    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      log("Signup error: MongoDB not connected. Current state: " + mongoose.connection.readyState, "auth");
      return res.status(503).json({
        error: "Database service unavailable. Please try again later."
      });
    }

    // Log the attempt
    log(`Signup attempt for username: ${username}, email: ${email}`, "auth");

    // Check if user with same email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      log(`Signup failed: User already exists with email: ${email} or username: ${username}`, "auth");
      return res.status(400).json({
        error: "User already exists with this email or username",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    // Save user to database
    await user.save();
    log(`User created successfully: ${username}`, "auth");

    // Generate auth token
    const token = user.generateAuthToken();
    log(`Auth token generated for user: ${username}`, "auth");

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return user data (excluding password)
    const response = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    };
    
    log(`Signup success response sent for user: ${username}`, "auth");
    res.status(201).json(response);
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    log(`Signup error: ${errorMessage}`, "auth");
    
    // Check for MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ');
      
      return res.status(400).json({ 
        error: `Validation error: ${validationErrors}` 
      });
    }
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "User with this email or username already exists" 
      });
    }
    
    res.status(500).json({ error: "Server error during registration" });
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
      log("Login validation error: Missing required fields", "auth");
      return res.status(400).json({
        error: "Email and password are required"
      });
    }
    
    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      log("Login error: MongoDB not connected. Current state: " + mongoose.connection.readyState, "auth");
      return res.status(503).json({
        error: "Database service unavailable. Please try again later."
      });
    }
    
    log(`Login attempt for email: ${email}`, "auth");

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      log(`Login failed: No user found with email: ${email}`, "auth");
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      log(`Login failed: Invalid password for email: ${email}`, "auth");
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    // Generate auth token
    const token = user.generateAuthToken();
    log(`Auth token generated for user: ${user.username}`, "auth");

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return user data
    const response = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    };
    
    log(`Login success response sent for user: ${user.username}`, "auth");
    res.json(response);
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    log(`Login error: ${errorMessage}`, "auth");
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post("/logout", (req: Request, res: Response) => {
  // Clear the auth cookie
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get("/me", auth, async (req: Request, res: Response) => {
  try {
    // User is already attached to req by auth middleware
    const user = req.user;
    
    res.json({
      id: user?._id,
      username: user?.username,
      email: user?.email,
      createdAt: user?.createdAt,
    });
  } catch (error) {
    log(`Get profile error: ${error}`, "auth");
    res.status(500).json({ error: "Server error fetching user profile" });
  }
});

/**
 * GET /api/auth/db-status
 * Check database connection status
 */
router.get("/db-status", async (_req: Request, res: Response) => {
  try {
    const connectionState = mongoose.connection.readyState;
    let status = "";
    
    switch (connectionState) {
      case 0:
        status = "disconnected";
        break;
      case 1:
        status = "connected";
        break;
      case 2:
        status = "connecting";
        break;
      case 3:
        status = "disconnecting";
        break;
      default:
        status = "unknown";
    }
    
    res.json({
      status,
      connectionState,
      mongoVersion: mongoose.version,
      readyState: mongoose.connection.readyState
    });
  } catch (error: any) {
    log(`DB status check error: ${error.message}`, "auth");
    res.status(500).json({ error: "Error checking database status" });
  }
});

export default router;