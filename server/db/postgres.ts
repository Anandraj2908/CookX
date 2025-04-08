import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { eq, and, gte, lt } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { 
  User, InsertUser, 
  InventoryItem, InsertInventoryItem, 
  Recipe, InsertRecipe, 
  RecipeIngredient, InsertRecipeIngredient,
  MealPlan, InsertMealPlan,
  GroceryItem, InsertGroceryItem,
} from '@shared/schema';
import { IStorage } from '../storage';
import { addDays } from 'date-fns';

// Get the connection string from environment variables
const connectionString = process.env.DATABASE_URL!;

// Create a Postgres client
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });

// Create a class that implements the IStorage interface using Drizzle ORM
export class PostgresStorage implements IStorage {
  constructor() {
    console.log('PostgreSQL storage initialized');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const users = await db.insert(schema.users).values(user).returning();
    return users[0];
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(schema.inventoryItems).orderBy(schema.inventoryItems.category);
  }

  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    const items = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id));
    return items[0];
  }

  async getExpiringItems(daysUntilExpiry: number): Promise<InventoryItem[]> {
    const today = new Date();
    const expiryDate = addDays(today, daysUntilExpiry);

    return db.select()
      .from(schema.inventoryItems)
      .where(
        and(
          gte(schema.inventoryItems.expiryDate, today),
          lt(schema.inventoryItems.expiryDate, expiryDate)
        )
      );
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const items = await db.insert(schema.inventoryItems).values(item).returning();
    return items[0];
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const items = await db
      .update(schema.inventoryItems)
      .set(item)
      .where(eq(schema.inventoryItems.id, id))
      .returning();
    return items[0];
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const items = await db
      .delete(schema.inventoryItems)
      .where(eq(schema.inventoryItems.id, id))
      .returning();
    return items.length > 0;
  }

  // Recipe methods
  async getRecipes(): Promise<Recipe[]> {
    return db.select().from(schema.recipes);
  }

  async getRecipeById(id: number): Promise<Recipe | undefined> {
    const recipes = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id));
    return recipes[0];
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const recipes = await db.insert(schema.recipes).values(recipe).returning();
    return recipes[0];
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const recipes = await db
      .update(schema.recipes)
      .set(recipe)
      .where(eq(schema.recipes.id, id))
      .returning();
    return recipes[0];
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const recipes = await db
      .delete(schema.recipes)
      .where(eq(schema.recipes.id, id))
      .returning();
    return recipes.length > 0;
  }

  // Recipe Ingredient methods
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return db
      .select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, recipeId));
  }

  async createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const ingredients = await db.insert(schema.recipeIngredients).values(ingredient).returning();
    return ingredients[0];
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    const ingredients = await db
      .delete(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.id, id))
      .returning();
    return ingredients.length > 0;
  }

  // Meal Plan methods
  async getMealPlans(): Promise<MealPlan[]> {
    return db.select().from(schema.mealPlans);
  }

  async getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    return db
      .select()
      .from(schema.mealPlans)
      .where(
        and(
          gte(schema.mealPlans.date, startDate),
          lt(schema.mealPlans.date, endDate)
        )
      );
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const mealPlans = await db.insert(schema.mealPlans).values(mealPlan).returning();
    return mealPlans[0];
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const mealPlans = await db
      .update(schema.mealPlans)
      .set(mealPlan)
      .where(eq(schema.mealPlans.id, id))
      .returning();
    return mealPlans[0];
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    const mealPlans = await db
      .delete(schema.mealPlans)
      .where(eq(schema.mealPlans.id, id))
      .returning();
    return mealPlans.length > 0;
  }

  // Grocery Item methods
  async getGroceryItems(): Promise<GroceryItem[]> {
    return db.select().from(schema.groceryItems);
  }

  async createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem> {
    const items = await db.insert(schema.groceryItems).values(item).returning();
    return items[0];
  }

  async updateGroceryItem(id: number, item: Partial<InsertGroceryItem>): Promise<GroceryItem | undefined> {
    const items = await db
      .update(schema.groceryItems)
      .set(item)
      .where(eq(schema.groceryItems.id, id))
      .returning();
    return items[0];
  }

  async deleteGroceryItem(id: number): Promise<boolean> {
    const items = await db
      .delete(schema.groceryItems)
      .where(eq(schema.groceryItems.id, id))
      .returning();
    return items.length > 0;
  }

  // Initialize database
  async init(): Promise<void> {
    try {
      console.log("Initializing PostgreSQL database...");
      
      // Push schema changes to the database
      await migrate(db, { migrationsFolder: './drizzle' });
      
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
}

// Create and export an instance of PostgresStorage
export const postgresStorage = new PostgresStorage();