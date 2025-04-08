import {
  users, type User, type InsertUser,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  recipes, type Recipe, type InsertRecipe,
  recipeIngredients, type RecipeIngredient, type InsertRecipeIngredient,
  mealPlans, type MealPlan, type InsertMealPlan,
  groceryItems, type GroceryItem, type InsertGroceryItem
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Inventory methods
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: number): Promise<InventoryItem | undefined>;
  getExpiringItems(daysUntilExpiry: number): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Recipe methods
  getRecipes(): Promise<Recipe[]>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  
  // Recipe Ingredient methods
  getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  deleteRecipeIngredient(id: number): Promise<boolean>;
  
  // Meal Plan methods
  getMealPlans(): Promise<MealPlan[]>;
  getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<boolean>;
  
  // Grocery Item methods
  getGroceryItems(): Promise<GroceryItem[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: number, item: Partial<InsertGroceryItem>): Promise<GroceryItem | undefined>;
  deleteGroceryItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventory: Map<number, InventoryItem>;
  private recipes: Map<number, Recipe>;
  private recipeIngredients: Map<number, RecipeIngredient>;
  private mealPlans: Map<number, MealPlan>;
  private groceryItems: Map<number, GroceryItem>;
  
  private userId: number;
  private inventoryId: number;
  private recipeId: number;
  private recipeIngredientId: number;
  private mealPlanId: number;
  private groceryItemId: number;

  constructor() {
    this.users = new Map();
    this.inventory = new Map();
    this.recipes = new Map();
    this.recipeIngredients = new Map();
    this.mealPlans = new Map();
    this.groceryItems = new Map();
    
    this.userId = 1;
    this.inventoryId = 1;
    this.recipeId = 1;
    this.recipeIngredientId = 1;
    this.mealPlanId = 1;
    this.groceryItemId = 1;
    
    // Add some initial data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    return this.inventory.get(id);
  }

  async getExpiringItems(daysUntilExpiry: number): Promise<InventoryItem[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysUntilExpiry);
    
    return Array.from(this.inventory.values()).filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= futureDate && expiryDate >= today;
    });
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.inventoryId++;
    const newItem: InventoryItem = { ...item, id };
    this.inventory.set(id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventory.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventory.delete(id);
  }

  // Recipe methods
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipeById(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.recipeId++;
    const newRecipe: Recipe = { ...recipe, id };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existingRecipe = this.recipes.get(id);
    if (!existingRecipe) return undefined;
    
    const updatedRecipe = { ...existingRecipe, ...recipe };
    this.recipes.set(id, updatedRecipe);
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    // First delete all associated recipe ingredients
    const ingredients = await this.getRecipeIngredients(id);
    for (const ingredient of ingredients) {
      await this.deleteRecipeIngredient(ingredient.id);
    }
    
    return this.recipes.delete(id);
  }

  // Recipe Ingredient methods
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return Array.from(this.recipeIngredients.values()).filter(
      ingredient => ingredient.recipeId === recipeId
    );
  }

  async createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const id = this.recipeIngredientId++;
    const newIngredient: RecipeIngredient = { ...ingredient, id };
    this.recipeIngredients.set(id, newIngredient);
    return newIngredient;
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    return this.recipeIngredients.delete(id);
  }

  // Meal Plan methods
  async getMealPlans(): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values());
  }

  async getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values()).filter(mealPlan => {
      const planDate = new Date(mealPlan.date);
      return planDate >= startDate && planDate <= endDate;
    });
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const id = this.mealPlanId++;
    const newMealPlan: MealPlan = { ...mealPlan, id };
    this.mealPlans.set(id, newMealPlan);
    return newMealPlan;
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const existingMealPlan = this.mealPlans.get(id);
    if (!existingMealPlan) return undefined;
    
    const updatedMealPlan = { ...existingMealPlan, ...mealPlan };
    this.mealPlans.set(id, updatedMealPlan);
    return updatedMealPlan;
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    return this.mealPlans.delete(id);
  }

  // Grocery Item methods
  async getGroceryItems(): Promise<GroceryItem[]> {
    return Array.from(this.groceryItems.values());
  }

  async createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem> {
    const id = this.groceryItemId++;
    const newItem: GroceryItem = { ...item, id };
    this.groceryItems.set(id, newItem);
    return newItem;
  }

  async updateGroceryItem(id: number, item: Partial<InsertGroceryItem>): Promise<GroceryItem | undefined> {
    const existingItem = this.groceryItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.groceryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteGroceryItem(id: number): Promise<boolean> {
    return this.groceryItems.delete(id);
  }

  // Helper method to initialize sample data
  private seedData() {
    // Seed some sample inventory items
    const inventoryItems: InsertInventoryItem[] = [
      {
        name: "Organic Chicken Breast", 
        category: "Meat", 
        quantity: 2500, 
        unit: "g", 
        location: "Freezer",
        expiryDate: this.getDateInDays(2),
        notes: "Free-range organic chicken"
      },
      {
        name: "Milk", 
        category: "Dairy", 
        quantity: 1500, 
        unit: "ml", 
        location: "Fridge",
        expiryDate: this.getDateInDays(5),
        notes: "Full-fat milk"
      },
      {
        name: "Fresh Spinach", 
        category: "Vegetables", 
        quantity: 250, 
        unit: "g", 
        location: "Fridge",
        expiryDate: this.getDateInDays(1),
        notes: "Washed and ready to cook"
      },
      {
        name: "Eggs", 
        category: "Dairy", 
        quantity: 12, 
        unit: "pcs", 
        location: "Fridge",
        expiryDate: this.getDateInDays(14),
        notes: "Free-range eggs"
      },
      {
        name: "Pasta", 
        category: "Grains", 
        quantity: 500, 
        unit: "g", 
        location: "Pantry",
        notes: "Penne pasta"
      }
    ];

    inventoryItems.forEach(item => {
      this.createInventoryItem(item);
    });

    // Seed some sample recipes
    const recipes: InsertRecipe[] = [
      {
        name: "Grilled Chicken Salad",
        instructions: "1. Season chicken breast with salt and pepper. 2. Grill until cooked through. 3. Slice chicken and mix with fresh vegetables.",
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        imageUrl: ""
      },
      {
        name: "Spinach and Feta Omelet",
        instructions: "1. Beat eggs in a bowl. 2. Sauté spinach in a pan. 3. Pour eggs over spinach. 4. Add feta cheese and fold omelet.",
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        imageUrl: ""
      },
      {
        name: "Pasta with Spinach and Chicken",
        instructions: "1. Cook pasta according to package instructions. 2. Sauté chicken and spinach. 3. Mix with cooked pasta and serve.",
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        imageUrl: ""
      }
    ];

    recipes.forEach(recipe => {
      this.createRecipe(recipe);
    });

    // Seed recipe ingredients
    const recipeIngredients: InsertRecipeIngredient[] = [
      { recipeId: 1, name: "Chicken Breast", quantity: 200, unit: "g" },
      { recipeId: 1, name: "Mixed Greens", quantity: 100, unit: "g" },
      { recipeId: 1, name: "Cherry Tomatoes", quantity: 50, unit: "g" },
      { recipeId: 1, name: "Cucumber", quantity: 1, unit: "pcs" },
      { recipeId: 1, name: "Olive Oil", quantity: 15, unit: "ml" },
      
      { recipeId: 2, name: "Eggs", quantity: 2, unit: "pcs" },
      { recipeId: 2, name: "Spinach", quantity: 50, unit: "g" },
      { recipeId: 2, name: "Feta Cheese", quantity: 30, unit: "g" },
      { recipeId: 2, name: "Milk", quantity: 30, unit: "ml" },
      
      { recipeId: 3, name: "Pasta", quantity: 200, unit: "g" },
      { recipeId: 3, name: "Chicken Breast", quantity: 150, unit: "g" },
      { recipeId: 3, name: "Spinach", quantity: 100, unit: "g" },
      { recipeId: 3, name: "Olive Oil", quantity: 15, unit: "ml" },
      { recipeId: 3, name: "Garlic", quantity: 2, unit: "cloves" },
      { recipeId: 3, name: "Parmesan Cheese", quantity: 20, unit: "g" },
      { recipeId: 3, name: "Salt", quantity: 1, unit: "pinch" },
      { recipeId: 3, name: "Black Pepper", quantity: 1, unit: "pinch" }
    ];

    recipeIngredients.forEach(ingredient => {
      this.createRecipeIngredient(ingredient);
    });

    // Seed some meal plans
    const today = new Date();
    const mealPlans: InsertMealPlan[] = [
      {
        date: new Date(today.setDate(today.getDate() + 1)),
        mealType: "Dinner",
        recipeId: 1,
        notes: "Light dinner"
      },
      {
        date: new Date(today.setDate(today.getDate() + 1)),
        mealType: "Breakfast",
        recipeId: 2,
        notes: "Quick breakfast"
      },
      {
        date: new Date(today.setDate(today.getDate() + 1)),
        mealType: "Dinner",
        recipeId: 3,
        notes: "Family dinner"
      }
    ];

    mealPlans.forEach(mealPlan => {
      this.createMealPlan(mealPlan);
    });

    // Seed some grocery items
    const groceryItems: InsertGroceryItem[] = [
      { name: "Apples", quantity: 5, unit: "pcs", purchased: false },
      { name: "Yogurt", quantity: 500, unit: "g", purchased: false },
      { name: "Brown Rice", quantity: 1, unit: "kg", purchased: false },
      { name: "Chicken Stock", quantity: 500, unit: "ml", purchased: false }
    ];

    groceryItems.forEach(item => {
      this.createGroceryItem(item);
    });
  }

  private getDateInDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}

export const storage = new MemStorage();
