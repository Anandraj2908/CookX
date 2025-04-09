import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import fetch from 'node-fetch';

// Import MongoDB models and route handlers
import InventoryItem from './models/inventory.model';
import Recipe from './models/recipe.model';
import User from './models/user.model';
import GroceryItem from './models/grocery.model';

// Import route handlers
import inventoryRoutes from './routes/inventory.routes';
import recipeRoutes from './routes/recipe.routes';
import groceryRoutes from './routes/grocery.routes';
import authRoutes from './auth/auth.routes';

// Import middleware
import { auth } from './middleware/auth.middleware';

// Interface for recipe recommendation
interface RecipeRecommendation {
  name: string;
  ingredients: string[];
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl?: string;
  cuisine?: string;
  dietaryInfo?: string[];
}

// Define a type for the Gemini API response
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register MongoDB routes
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/grocery-items', groceryRoutes);
  app.use('/api/auth', authRoutes);

  // Recipe Suggestion route
  app.get("/api/recipe-suggestions", auth, async (req: Request, res: Response) => {
    try {
      // Get all inventory items and recipes for the current user
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const inventoryItems = await InventoryItem.find({ userId });
      const recipes = await Recipe.find({ userId });
      
      const suggestions = [];
      
      for (const recipe of recipes) {
        // For MongoDB, recipe.ingredients is already part of the recipe document
        const recipeIngredients = recipe.ingredients;
        const availableIngredients = recipeIngredients.filter(recipeIngredient => {
          // Check if we have this ingredient in inventory
          return inventoryItems.some(item => 
            item.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
            recipeIngredient.name.toLowerCase().includes(item.name.toLowerCase())
          );
        });
        
        const totalIngredients = recipeIngredients.length;
        const availableCount = availableIngredients.length;
        
        // Calculate date threshold for expiring items (3 days)
        const today = new Date();
        const threshold = new Date(today);
        threshold.setDate(today.getDate() + 3);
        
        // Get expiring items
        const expiringItems = await InventoryItem.find({
          userId,
          expiryDate: { 
            $ne: null,
            $lte: threshold,
            $gte: today
          }
        });
        
        // Check if recipe uses expiring items
        const usesExpiringItems = expiringItems.some(item => 
          recipeIngredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(ingredient.name.toLowerCase())
          )
        );
        
        suggestions.push({
          recipe,
          availableCount,
          totalIngredients,
          percentage: totalIngredients > 0 ? Math.round((availableCount / totalIngredients) * 100) : 0,
          usesExpiringItems
        });
      }
      
      // Sort by percentage of available ingredients (highest first)
      suggestions.sort((a, b) => {
        // First prioritize recipes that use expiring items
        if (a.usesExpiringItems && !b.usesExpiringItems) return -1;
        if (!a.usesExpiringItems && b.usesExpiringItems) return 1;
        
        // Then sort by percentage of available ingredients
        return b.percentage - a.percentage;
      });
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error generating recipe suggestions:', error);
      res.status(500).json({ message: "Failed to generate recipe suggestions" });
    }
  });

  // Gemini AI Recipe Generation endpoints (two routes for compatibility)
  app.post("/api/ai-recipes", auth, async (req: Request, res: Response) => {
    // Forward to the generate-recipes endpoint 
    req.url = "/api/generate-recipes";
    app._router.handle(req, res);
  });
  
  app.post("/api/generate-recipes", auth, async (req: Request, res: Response) => {
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
        return res.status(500).json({ message: "Gemini API key is not configured" });
      }
      
      // Prepare the prompt
      const ingredientList = ingredients
        .map((i: any) => `${i.name} (${i.quantity} ${i.unit}, from ${i.location})`)
        .join("\n- ");
      
      const prompt = `Generate 3 recipes that I can make with these ingredients in my kitchen:
      
Ingredients:
- ${ingredientList}

${preferences ? `My preferences: ${preferences}` : ""}

Use only these ingredients and common pantry staples. Format each recipe like this:

RECIPE NAME: [name]
CUISINE: [cuisine type]
DIETARY INFO: [vegetarian, vegan, gluten-free, etc.]
PREP TIME: [minutes]
COOK TIME: [minutes]
SERVINGS: [number]

INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
...

INSTRUCTIONS:
[step by step instructions]

Please make sure to:
1. Include preparation and cooking times
2. Include exact measurements
3. Write clear, step-by-step instructions
4. Suggest recipes that make good use of the ingredients I have
5. Only consider common pantry ingredients like salt, pepper, flour, common spices as being always available
`;
      
      // Make API call to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      });
      
      if (!response.ok) {
        console.error("Gemini API error:", await response.text());
        return res.status(response.status).json({ message: "Failed to connect to Gemini API" });
      }
      
      const data = await response.json() as GeminiResponse;
      
      if (data.promptFeedback?.blockReason) {
        return res.status(400).json({ 
          message: "Prompt was blocked by the Gemini API",
          reason: data.promptFeedback.blockReason 
        });
      }
      
      if (!data.candidates || data.candidates.length === 0) {
        return res.status(500).json({ message: "No response generated from Gemini API" });
      }
      
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Parse the recipes from the response
      const recipes = parseRecipesFromResponse(responseText);
      
      // Save recipes to database if they seem valid
      const savedRecipes = [];
      for (const recipe of recipes) {
        if (recipe.name && recipe.instructions && recipe.ingredients.length > 0) {
          // Parse ingredients to match Recipe model schema
          const parsedIngredients = recipe.ingredients.map((ingredient: string) => {
            // Parse ingredient string
            const match = ingredient.match(/^(.+?)(?:\s+\((\d+\.?\d*)\s+(.+)\))?$/);
            if (match) {
              const [_, name, quantity, unit] = match;
              return {
                name: name.trim(),
                quantity: parseFloat(quantity || "1"),
                unit: unit?.trim() || "piece",
                isOptional: false
              };
            }
            return {
              name: ingredient.trim(),
              quantity: 1,
              unit: "piece",
              isOptional: false
            };
          });
          
          // Create new recipe in MongoDB
          const newRecipe = new Recipe({
            name: recipe.name,
            description: `AI-generated recipe using your kitchen ingredients.${recipe.cuisine ? ` ${recipe.cuisine} cuisine.` : ''}`,
            instructions: recipe.instructions,
            prepTime: recipe.prepTime || 15,
            cookTime: recipe.cookTime || 30,
            servings: recipe.servings || 4,
            ingredients: parsedIngredients,
            imageUrl: recipe.imageUrl || null,
            difficulty: 'Medium',
            cuisine: recipe.cuisine || 'Other',
            mealType: 'Dinner',
            dietaryInfo: recipe.dietaryInfo || [],
            userId: userId
          });
          
          // Save to database
          const savedRecipe = await newRecipe.save();
          savedRecipes.push(savedRecipe);
        }
      }
      
      res.json({
        rawResponse: responseText,
        parsedRecipes: recipes,
        savedRecipes
      });
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ message: "Failed to generate recipes" });
    }
  });

  function parseRecipesFromResponse(responseText: string): RecipeRecommendation[] {
    const recipes: RecipeRecommendation[] = [];
    
    // Split the response into separate recipes
    const recipeBlocks = responseText.split(/RECIPE NAME:/i).slice(1);
    
    for (const block of recipeBlocks) {
      try {
        const nameMatch = block.trim().match(/^(.*?)(?=\n)/);
        const cuisineMatch = block.match(/CUISINE:\s*(.*?)(?=\n)/i);
        const dietaryMatch = block.match(/DIETARY INFO:\s*(.*?)(?=\n)/i);
        const prepTimeMatch = block.match(/PREP TIME:\s*(\d+)/i);
        const cookTimeMatch = block.match(/COOK TIME:\s*(\d+)/i);
        const servingsMatch = block.match(/SERVINGS:\s*(\d+)/i);
        
        // Use safer regex without 's' flag for cross-browser compatibility
        const ingredientsSection = block.match(/INGREDIENTS:([^]*?)INSTRUCTIONS:/i);
        const instructionsSection = block.match(/INSTRUCTIONS:([^]*?)(?=\n\n|$)/i);
        
        const ingredients = ingredientsSection ? 
          ingredientsSection[1].trim().split(/\n\s*-\s*/).filter(i => i.trim()) : [];
        
        const instructions = instructionsSection ? 
          instructionsSection[1].trim() : "";
        
        if (nameMatch) {
          recipes.push({
            name: nameMatch[1].trim(),
            cuisine: cuisineMatch ? cuisineMatch[1].trim() : undefined,
            dietaryInfo: dietaryMatch ? 
              dietaryMatch[1].split(',').map(item => item.trim()) : undefined,
            prepTime: prepTimeMatch ? parseInt(prepTimeMatch[1]) : 0,
            cookTime: cookTimeMatch ? parseInt(cookTimeMatch[1]) : 0,
            servings: servingsMatch ? parseInt(servingsMatch[1]) : 4,
            ingredients: ingredients,
            instructions: instructions,
          });
        }
      } catch (e) {
        console.error("Error parsing recipe:", e);
        // Continue to the next recipe if parsing fails
      }
    }
    
    return recipes;
  }

  const httpServer = createServer(app);
  return httpServer;
}