// Test script to verify Gemini API connection
import dotenv from 'dotenv';
import { GeminiClient } from './server/gemini_client.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGeminiConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    return;
  }
  
  console.log('🔑 GEMINI_API_KEY found in environment');
  
  try {
    console.log('🔄 Creating Gemini client...');
    const geminiClient = new GeminiClient(apiKey);
    
    console.log('🧪 Testing connection...');
    const result = await geminiClient.testConnection();
    
    console.log('✅ Connection successful!');
    console.log('\nTest recipe:');
    console.log('-------------');
    console.log(result.response.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Failed to connect to Gemini API:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testGeminiConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});