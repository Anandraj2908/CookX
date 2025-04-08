// Simple test script to verify the updated Gemini client
const { createGeminiClient } = require('./server/gemini_client');

// Function to test Gemini API
async function testGeminiClient() {
  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("Error: GEMINI_API_KEY environment variable is not set");
      return;
    }
    
    console.log("Creating Gemini client and testing connection...");
    
    // Initialize the client
    const geminiClient = createGeminiClient(apiKey);
    
    // Test connection
    const testResult = await geminiClient.testConnection();
    console.log("Test connection successful!");
    console.log("Response:", testResult.response);
    
    // Test recipe recommendations
    console.log("\nTesting recipe recommendations...");
    const ingredients = [
      { name: "Chicken", quantity: "2", unit: "breasts", location: "Fridge" },
      { name: "Rice", quantity: "1", unit: "cup", location: "Pantry" },
      { name: "Broccoli", quantity: "1", unit: "head", location: "Fridge" },
      { name: "Garlic", quantity: "3", unit: "cloves", location: "Pantry" },
      { name: "Soy Sauce", quantity: "1/4", unit: "cup", location: "Fridge" }
    ];
    
    const preferences = "Healthy recipes with low sodium";
    
    const responseText = await geminiClient.getRecipeRecommendations(ingredients, preferences);
    console.log("Recipe recommendations received!");
    console.log("\nRaw response:");
    console.log(responseText);
    
    console.log("\nParsed recipes:");
    const recipes = geminiClient.parseRecipesFromResponse(responseText);
    console.log(JSON.stringify(recipes, null, 2));
    
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

// Run the test
testGeminiClient();