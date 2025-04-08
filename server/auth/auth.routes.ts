import { Router, Request, Response } from "express";
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

    // Check if user with same email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
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

    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return user data (excluding password)
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    });
  } catch (error) {
    log(`Signup error: ${error}`, "auth");
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    // Generate auth token
    const token = user.generateAuthToken();

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return user data
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    });
  } catch (error) {
    log(`Login error: ${error}`, "auth");
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

export default router;