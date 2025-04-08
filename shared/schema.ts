import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
});

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instructions: text("instructions").notNull(),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  servings: integer("servings").notNull(),
  imageUrl: text("image_url"),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
});

// Recipe Ingredients
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

// Meal Plans
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  recipeId: integer("recipe_id"),
  notes: text("notes"),
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
});

// Grocery Items
export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  purchased: boolean("purchased").default(false),
});

export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
