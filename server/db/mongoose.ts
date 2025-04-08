import mongoose from "mongoose";
import { log } from "../vite";

// MongoDB connection URI
// Using MongoDB Atlas cloud service, or fallback to local if not specified
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test-user:test-password@cluster0.mongodb.net/kitchen_companion?retryWrites=true&w=majority";

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    log("Connected to MongoDB successfully", "mongodb");
  } catch (error) {
    log(`MongoDB connection error: ${error}`, "mongodb");
    // Retry connection after 5 seconds
    setTimeout(connectToDatabase, 5000);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  log("MongoDB connection established", "mongodb");
});

mongoose.connection.on("error", (err) => {
  log(`MongoDB connection error: ${err}`, "mongodb");
});

mongoose.connection.on("disconnected", () => {
  log("MongoDB connection disconnected", "mongodb");
});

// Handle application termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  log("MongoDB connection closed due to app termination", "mongodb");
  process.exit(0);
});

export default connectToDatabase;