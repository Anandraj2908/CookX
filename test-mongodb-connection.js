// Test MongoDB Connection Script
import mongoose from 'mongoose';

async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB connection...');

    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('ERROR: MONGODB_URI environment variable is not set.');
      console.log('Please set the MONGODB_URI environment variable and try again.');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    
    // Check connection
    console.log('MongoDB connection established!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Connected to database:', mongoose.connection.name);
    
    // List collections
    console.log('\nListing collections:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('  - No collections found (empty database)');
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // Create a test model
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    // Check if model already exists to avoid overwriting
    const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    // Test writing to the database
    console.log('\nTesting write operation...');
    const testDoc = new Test({ name: 'Test Document' });
    await testDoc.save();
    console.log('Successfully wrote test document to database');
    
    // Test reading from the database
    console.log('\nTesting read operation...');
    const docs = await Test.find({});
    console.log(`Found ${docs.length} test documents`);
    
    // Clean up test documents
    console.log('\nCleaning up test documents...');
    await Test.deleteMany({});
    console.log('Test documents deleted');
    
    console.log('\nAll tests completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
    
    return true;
  } catch (err) {
    console.error('MongoDB connection test failed:', err);
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Connection closed after error');
      }
    } catch (closeErr) {
      console.error('Error closing connection:', closeErr);
    }
    return false;
  }
}

// Run the test
testMongoDBConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });

export { testMongoDBConnection };