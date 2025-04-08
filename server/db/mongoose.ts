import mongoose from "mongoose";
import { log } from "../vite";

// MongoDB connection URI
// Using MongoDB Atlas cloud service, fail if not specified
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  log("ERROR: MongoDB URI is not defined. Please set the MONGODB_URI environment variable.", "mongodb");
}

// Connection options
const options = {
  autoIndex: true,
  connectTimeoutMS: 10000, // 10 seconds
  retryWrites: true,
  writeConcern: { w: 'majority' },
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions;

let isConnecting = false;
let retryCount = 0;
const MAX_RETRIES = 5;

const connectToDatabase = async (): Promise<void> => {
  if (!MONGODB_URI) {
    log("ERROR: Cannot connect to MongoDB without URI", "mongodb");
    return;
  }
  
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    log(`Connecting to MongoDB (attempt ${retryCount + 1})...`, "mongodb");
    await mongoose.connect(MONGODB_URI, options);
    log("Connected to MongoDB successfully", "mongodb");
    retryCount = 0; // Reset retry count on success
  } catch (error) {
    log(`MongoDB connection error: ${error}`, "mongodb");
    
    // Retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      log(`Retrying connection in ${delay/1000} seconds...`, "mongodb");
      isConnecting = false;
      setTimeout(connectToDatabase, delay);
    } else {
      log("Max connection retries reached. Please check your MongoDB connection string.", "mongodb");
    }
  } finally {
    isConnecting = false;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  log("MongoDB connection established", "mongodb");
});

mongoose.connection.on("error", (err) => {
  log(`MongoDB connection error: ${err}`, "mongodb");
  if (mongoose.connection.readyState !== 1) {
    connectToDatabase(); // Try to reconnect if not connected
  }
});

mongoose.connection.on("disconnected", () => {
  log("MongoDB connection disconnected", "mongodb");
  if (!isConnecting) {
    connectToDatabase(); // Try to reconnect if not already attempting
  }
});

// Handle application termination
process.on("SIGINT", async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    log("MongoDB connection closed due to app termination", "mongodb");
  }
  process.exit(0);
});

export default connectToDatabase;