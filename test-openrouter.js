// Simple test script to verify OpenRouter API
import { OpenAI } from 'openai';

// Function to test OpenRouter API
async function testOpenRouter() {
  try {
    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error("Error: OPENROUTER_API_KEY environment variable is not set");
      return;
    }
    
    console.log("Initializing OpenAI client with OpenRouter...");
    
    // Initialize OpenAI client with OpenRouter base URL
    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultQuery: { 
        "HTTP-Referer": "https://kitchen-buddy.replit.app" 
      }
    });
    
    console.log("Making test request to OpenRouter API...");
    
    // Make a simple API call with a model that should be available
    const completion = await client.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // Use a reliable model
      messages: [
        {
          role: "user",
          content: "Hello! Please provide a simple recipe for banana bread."
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log("API Response:");
    console.log("Status: Success");
    
    // Print the entire response for debugging
    console.log("Full response object:", JSON.stringify(completion, null, 2));
    
    // Safely access properties
    if (completion && completion.choices && completion.choices.length > 0) {
      console.log("Model used:", completion.model || "unknown");
      console.log("Response:", completion.choices[0]?.message?.content || "No content received");
    } else {
      console.log("Response format unexpected. See full response above for details.");
    }
    
  } catch (error) {
    console.error("Error testing OpenRouter API:", error);
  }
}

// Run the test
testOpenRouter();