import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const auth = async (req, res, next) => {
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
      token = req.query.token;
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
    );
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: 'User not found or token is invalid'
      });
    }
    
    // Set user and token on request object
    req.user = { id: user._id };
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      message: 'Server error during authentication'
    });
  }
};

export default auth;