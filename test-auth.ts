import mongoose from 'mongoose';
import connectToDatabase from './server/db/mongoose';
import User from './server/models/user.model';

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

async function testAuthentication() {
  console.log("Starting authentication test...");
  
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Check connection status
    if (mongoose.connection.readyState !== 1) {
      console.error(`MongoDB not connected. Current state: ${mongoose.connection.readyState}`);
      return;
    }
    
    console.log("Successfully connected to MongoDB");
    
    // Clear previous test user if exists
    await User.deleteOne({ email: testUser.email });
    console.log("Cleaned up previous test data");
    
    // Create a new user
    const user = new User(testUser);
    await user.save();
    console.log("Created test user:", user.username);
    
    // Check if user exists and password validation works
    const foundUser = await User.findOne({ email: testUser.email });
    if (!foundUser) {
      throw new Error("Created user not found");
    }
    
    console.log("Found user:", foundUser.username);
    
    // Test password comparison
    const validPassword = await foundUser.comparePassword(testUser.password);
    console.log("Password validation:", validPassword ? "SUCCESS" : "FAILED");
    
    // Generate and verify JWT token
    const token = foundUser.generateAuthToken();
    console.log("Generated JWT token:", token.substring(0, 20) + "...");
    
    // Clean up
    await User.deleteOne({ email: testUser.email });
    console.log("Test cleanup complete");
    
    console.log("Authentication test complete");
  } catch (error) {
    console.error("Authentication test failed:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

testAuthentication()
  .then(() => {
    console.log("Test script completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test script error:", error);
    process.exit(1);
  });