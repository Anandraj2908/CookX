import connectToDatabase from './server/db/mongoose';
import mongoose from 'mongoose';
import User from './server/models/user.model';

async function testMongoDBConnection() {
  console.log("Testing MongoDB connection...");
  
  // Try to connect to MongoDB
  await connectToDatabase();
  
  // Check connection state
  const connectionState = mongoose.connection.readyState;
  console.log(`MongoDB connection state: ${connectionState}`);
  
  // Report the connection details
  switch (connectionState) {
    case 0:
      console.log("MongoDB is disconnected");
      break;
    case 1:
      console.log("MongoDB is connected successfully!");
      break;
    case 2:
      console.log("MongoDB is in the process of connecting...");
      break;
    case 3:
      console.log("MongoDB is in the process of disconnecting...");
      break;
    default:
      console.log("MongoDB connection is in an unknown state");
  }
  
  // Check if we can access the User model
  if (connectionState === 1) {
    try {
      console.log("\nTesting User model...");
      const userCount = await User.countDocuments();
      console.log(`Found ${userCount} users in the database`);
      
      // Try to find if any users exist
      const users = await User.find().limit(3);
      if (users.length > 0) {
        console.log("Existing users (showing up to 3):");
        users.forEach((user, index) => {
          console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}`);
        });
      } else {
        console.log("No users found in the database");
      }
      
      console.log("User model test completed successfully");
    } catch (error) {
      console.error("Error testing User model:", error);
    }
  }
  
  console.log("\nMongoDB connection test completed.");
}

testMongoDBConnection()
  .then(() => {
    console.log("Test script executed successfully");
    // Keep the process running for a moment to finish any pending operations
    setTimeout(() => {
      console.log("Closing connection...");
      mongoose.connection.close().then(() => {
        console.log("Connection closed");
        process.exit(0);
      });
    }, 2000);
  })
  .catch(error => {
    console.error("Test script failed:", error);
    process.exit(1);
  });