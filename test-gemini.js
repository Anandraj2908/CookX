// Simple test script to verify Gemini API
import fetch from 'node-fetch';

// Function to list available Gemini models
async function listModels() {
  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("Error: GEMINI_API_KEY environment variable is not set");
      return;
    }
    
    console.log("Listing available Gemini models...");
    
    // Get list of models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Available models:", JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

// Function to test Gemini API
async function testGemini() {
  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("Error: GEMINI_API_KEY environment variable is not set");
      return;
    }
    
    console.log("Making test request to Gemini API...");
    
    // Call Gemini API with a model from the available list
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello! Please provide a simple recipe for banana bread."
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log("API Response:");
    console.log("Status: Success");
    
    // Print the entire response for debugging
    console.log("Full response object:", JSON.stringify(data, null, 2));
    
    // Extract and display the response content
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No content received";
    console.log("\nResponse content:");
    console.log(responseText);
    
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

// List models first, then run the test
(async () => {
  await listModels();
  // Now test with the identified model
  await testGemini();
})();