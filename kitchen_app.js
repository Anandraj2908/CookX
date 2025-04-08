// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Connect to MongoDB database with retry logic
async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MongoDB URI is not set in environment variables');
  }

  // Connection options
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s default
    family: 4 // Use IPv4, skip trying IPv6
  };

  // Exponential backoff retry logic
  const maxRetries = 5;
  let retryCount = 0;
  let connected = false;

  while (!connected && retryCount < maxRetries) {
    try {
      console.log(`Connecting to MongoDB... (attempt ${retryCount + 1}/${maxRetries})`);
      await mongoose.connect(MONGODB_URI, options);
      connected = true;
      console.log('Connected to MongoDB successfully!');
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error('Failed to connect to MongoDB after maximum retries:', error);
        throw error;
      }
      console.error(`Failed to connect to MongoDB (attempt ${retryCount}/${maxRetries}):`, error);
      
      // Calculate delay with exponential backoff and some jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
      console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Set up connection event handlers
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected!');
  });
}

// Simple route to test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const status = mongoose.connection.readyState;
    const statusMessage = 
      status === 0 ? 'Disconnected' :
      status === 1 ? 'Connected' :
      status === 2 ? 'Connecting' :
      status === 3 ? 'Disconnecting' : 'Unknown';
    
    res.json({ 
      status: 'success', 
      message: `MongoDB connection status: ${statusMessage}`,
      dbStatus: status,
      dbName: mongoose.connection.name || 'not connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error checking database connection',
      error: error.message 
    });
  }
});

// Simple status API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Kitchen Companion API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // If database connection is successful, start the server
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api/status`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the server running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running despite the error
});

// Start the server
startServer();
