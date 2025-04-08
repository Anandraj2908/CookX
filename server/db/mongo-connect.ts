import mongoose from 'mongoose';

/**
 * Connects to MongoDB with retry logic
 */
export async function connectToDatabase(): Promise<void> {
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

  // Handle application termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
}

export default connectToDatabase;