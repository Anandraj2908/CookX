import express from 'express';
import { auth } from './middleware/auth.middleware.js';
import { GeminiClient } from './gemini_client.js';
import InventoryItem from './models/inventory.model.js';

export async function registerRoutes(app) {
  // Recipe Suggestions API
  app.get("/api/recipe-suggestions", auth, async (req, res) => {
    try {
      // Get user's inventory items
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const items = await InventoryItem.find({ userId }).sort({ name: 1 });
      
      // Structure simple recommendations based on inventory
      const suggestions = [];
      
      // Group by category
      const categories = {};
      items.forEach(item => {
        if (!categories[item.category]) {
          categories[item.category] = [];
        }
        categories[item.category].push(item);
      });
      
      // Generate simple suggestions based on categories
      if (categories['Vegetables'] && categories['Vegetables'].length >= 2) {
        suggestions.push({
          title: "Vegetable Stir Fry",
          description: "Quick and healthy stir fry with your fresh vegetables",
          ingredients: categories['Vegetables'].map(v => v.name).slice(0, 5),
          matchLevel: "Perfect Match"
        });
      }
      
      if (categories['Grains'] && categories['Vegetables']) {
        suggestions.push({
          title: "Grain Bowl",
          description: "Nutritious bowl with grains and vegetables",
          ingredients: [
            ...(categories['Grains'] || []).map(g => g.name).slice(0, 2),
            ...(categories['Vegetables'] || []).map(v => v.name).slice(0, 3)
          ],
          matchLevel: "Almost There"
        });
      }
      
      if (categories['Fruits'] && categories['Fruits'].length >= 2) {
        suggestions.push({
          title: "Fruit Salad",
          description: "Refreshing fruit salad with your available fruits",
          ingredients: categories['Fruits'].map(f => f.name).slice(0, 5),
          matchLevel: "Perfect Match"
        });
      }
      
      // Add a random suggestion
      suggestions.push({
        title: "Pantry Pasta",
        description: "Simple pasta dish with items from your pantry",
        ingredients: [
          "Pasta",
          ...(categories['Vegetables'] || []).map(v => v.name).slice(0, 2),
          "Olive Oil",
          "Garlic"
        ],
        matchLevel: "Random Surprise"
      });
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating recipe suggestions:", error);
      res.status(500).json({ message: "Error generating recipe suggestions" });
    }
  });

  // Gemini AI Recipe Generation endpoint
  app.post("/api/generate-recipes", auth, async (req, res) => {
    try {
      const { ingredients, preferences } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: "Ingredients list is required" });
      }
      
      // Ensure user is authenticated
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API key is missing in environment variables");
        return res.status(500).json({ message: "Gemini API key is not configured" });
      }
      
      console.log("Creating Gemini client with API key...");
      console.log("API key exists and length:", apiKey.length, "characters");
      
      try {
        // Create Gemini client
        const geminiClient = new GeminiClient(apiKey);
        
        // First test the connection to make sure it works
        console.log("Testing Gemini connection...");
        const testResult = await geminiClient.testConnection();
        console.log("Gemini connection test successful!");
        
        console.log("Getting recipe recommendations...");
        console.log("Ingredients:", JSON.stringify(ingredients.map(i => i.name)));
        console.log("Preferences:", preferences);
        
        // Get recipe recommendations
        const responseText = await geminiClient.getRecipeRecommendations(ingredients, preferences);
        
        console.log("Parsing response text...");
        
        // Parse recipe recommendations
        const recipes = geminiClient.parseRecipesFromResponse(responseText);
        
        console.log(`Generated ${recipes.length} recipes`);
        
        res.json(recipes);
      } catch (error) {
        console.error("Error connecting to Gemini API:", error.message);
        console.error("Error details:", error);
        return res.status(500).json({ message: "Failed to connect to Gemini API", error: error.message });
      }
    } catch (error) {
      console.error("Error generating recipes with Gemini:", error);
      res.status(500).json({ 
        message: "Error generating recipes", 
        error: error.message
      });
    }
  });

  return app;
}