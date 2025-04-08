import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertInventoryItemSchema, 
  insertRecipeSchema, 
  insertRecipeIngredientSchema, 
  insertMealPlanSchema, 
  insertGroceryItemSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItemById(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  app.get("/api/inventory/expiring/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      if (isNaN(days)) {
        return res.status(400).json({ message: "Days must be a number" });
      }
      
      const items = await storage.getExpiringItems(days);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validation = insertInventoryItemSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid inventory item data", 
          errors: validation.error.errors 
        });
      }
      
      const newItem = await storage.createInventoryItem(validation.data);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partialSchema = insertInventoryItemSchema.partial();
      const validation = partialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid inventory item data", 
          errors: validation.error.errors 
        });
      }
      
      const updatedItem = await storage.updateInventoryItem(id, validation.data);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Recipe routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipeById(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const ingredients = await storage.getRecipeIngredients(id);
      
      res.json({
        ...recipe,
        ingredients
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const { ingredients, ...recipeData } = req.body;
      
      const recipeValidation = insertRecipeSchema.safeParse(recipeData);
      
      if (!recipeValidation.success) {
        return res.status(400).json({ 
          message: "Invalid recipe data", 
          errors: recipeValidation.error.errors 
        });
      }
      
      const newRecipe = await storage.createRecipe(recipeValidation.data);
      
      if (ingredients && Array.isArray(ingredients)) {
        const ingredientSchema = insertRecipeIngredientSchema.omit({ recipeId: true });
        
        for (const ingredient of ingredients) {
          const validation = ingredientSchema.safeParse(ingredient);
          
          if (validation.success) {
            await storage.createRecipeIngredient({
              ...validation.data,
              recipeId: newRecipe.id
            });
          }
        }
      }
      
      const savedIngredients = await storage.getRecipeIngredients(newRecipe.id);
      
      res.status(201).json({
        ...newRecipe,
        ingredients: savedIngredients
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.patch("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ingredients, ...recipeData } = req.body;
      
      const partialSchema = insertRecipeSchema.partial();
      const validation = partialSchema.safeParse(recipeData);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid recipe data", 
          errors: validation.error.errors 
        });
      }
      
      const updatedRecipe = await storage.updateRecipe(id, validation.data);
      
      if (!updatedRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(updatedRecipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecipe(id);
      
      if (!success) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Recipe Ingredients routes
  app.get("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const ingredients = await storage.getRecipeIngredients(recipeId);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  app.post("/api/recipes/:recipeId/ingredients", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      
      // Check if recipe exists
      const recipe = await storage.getRecipeById(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const validation = insertRecipeIngredientSchema.omit({ recipeId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid ingredient data", 
          errors: validation.error.errors 
        });
      }
      
      const newIngredient = await storage.createRecipeIngredient({
        ...validation.data,
        recipeId
      });
      
      res.status(201).json(newIngredient);
    } catch (error) {
      res.status(500).json({ message: "Failed to create recipe ingredient" });
    }
  });

  app.delete("/api/recipe-ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecipeIngredient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Recipe ingredient not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete recipe ingredient" });
    }
  });

  // Meal Plan routes
  app.get("/api/meal-plans", async (req, res) => {
    try {
      const mealPlans = await storage.getMealPlans();
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.get("/api/meal-plans/range", async (req, res) => {
    try {
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      
      if (!startDateParam || !endDateParam) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const mealPlans = await storage.getMealPlansByDateRange(startDate, endDate);
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans by date range" });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      const validation = insertMealPlanSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid meal plan data", 
          errors: validation.error.errors 
        });
      }
      
      const newMealPlan = await storage.createMealPlan(validation.data);
      res.status(201).json(newMealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meal plan" });
    }
  });

  app.patch("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partialSchema = insertMealPlanSchema.partial();
      const validation = partialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid meal plan data", 
          errors: validation.error.errors 
        });
      }
      
      const updatedMealPlan = await storage.updateMealPlan(id, validation.data);
      
      if (!updatedMealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(updatedMealPlan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update meal plan" });
    }
  });

  app.delete("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMealPlan(id);
      
      if (!success) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  // Grocery Item routes
  app.get("/api/grocery-items", async (req, res) => {
    try {
      const groceryItems = await storage.getGroceryItems();
      res.json(groceryItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery items" });
    }
  });

  app.post("/api/grocery-items", async (req, res) => {
    try {
      const validation = insertGroceryItemSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid grocery item data", 
          errors: validation.error.errors 
        });
      }
      
      const newItem = await storage.createGroceryItem(validation.data);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create grocery item" });
    }
  });

  app.patch("/api/grocery-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partialSchema = insertGroceryItemSchema.partial();
      const validation = partialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid grocery item data", 
          errors: validation.error.errors 
        });
      }
      
      const updatedItem = await storage.updateGroceryItem(id, validation.data);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Grocery item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update grocery item" });
    }
  });

  app.delete("/api/grocery-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGroceryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Grocery item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete grocery item" });
    }
  });

  // Recipe Suggestion route
  app.get("/api/recipe-suggestions", async (req, res) => {
    try {
      // Get all inventory items and recipes
      const inventoryItems = await storage.getInventoryItems();
      const recipes = await storage.getRecipes();
      
      const suggestions = [];
      
      for (const recipe of recipes) {
        const recipeIngredients = await storage.getRecipeIngredients(recipe.id);
        const availableIngredients = recipeIngredients.filter(recipeIngredient => {
          // Check if we have this ingredient in inventory
          return inventoryItems.some(item => 
            item.name.toLowerCase().includes(recipeIngredient.name.toLowerCase()) ||
            recipeIngredient.name.toLowerCase().includes(item.name.toLowerCase())
          );
        });
        
        const totalIngredients = recipeIngredients.length;
        const availableCount = availableIngredients.length;
        
        // Check if recipe uses expiring items
        const expiringItems = await storage.getExpiringItems(3);
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
          percentage: Math.round((availableCount / totalIngredients) * 100),
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
      res.status(500).json({ message: "Failed to generate recipe suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
