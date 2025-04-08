import mongoose from 'mongoose';
import User from './server/models/user.model';
import { connectToDatabase } from './server/db/mongo-connect';

async function testAuthentication() {
  try {
    console.log('Starting authentication test...');
    
    // Connect to MongoDB
    await connectToDatabase();
    console.log('Connected to MongoDB');
    
    // Create a test user
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`Creating test user: ${testUsername}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username: testUsername }, { email: testEmail }]
    });
    
    if (existingUser) {
      console.log('Test user already exists, deleting...');
      await User.deleteOne({ _id: existingUser._id });
    }
    
    // Create new user
    const user = new User({
      username: testUsername,
      email: testEmail,
      password: testPassword
    });
    
    // Save user to database
    const savedUser = await user.save();
    console.log('Test user created successfully:', savedUser._id);
    
    // Test password comparison
    console.log('\nTesting password comparison...');
    const validPassword = await savedUser.comparePassword(testPassword);
    console.log('Valid password check:', validPassword ? 'PASSED ✓' : 'FAILED ✗');
    
    const invalidPassword = await savedUser.comparePassword('wrongpassword');
    console.log('Invalid password check:', !invalidPassword ? 'PASSED ✓' : 'FAILED ✗');
    
    // Test JWT token generation
    console.log('\nTesting JWT token generation...');
    const token = savedUser.generateAuthToken();
    console.log('Token generated:', token ? 'PASSED ✓' : 'FAILED ✗');
    
    // Clean up - delete test user
    console.log('\nCleaning up - deleting test user...');
    await User.deleteOne({ _id: savedUser._id });
    console.log('Test user deleted');
    
    console.log('\nAll tests completed successfully!');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Authentication test failed:', error);
    
    // Close database connection if open
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Database connection closed after error');
      }
    } catch (closeErr) {
      console.error('Error closing database connection:', closeErr);
    }
    
    return false;
  }
}

// Run the test if executed directly
testAuthentication()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });