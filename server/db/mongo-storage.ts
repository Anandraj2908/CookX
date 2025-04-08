import mongoose from 'mongoose';
import { format, addDays } from 'date-fns';
import { log } from '../vite';
import connectToDatabase from './mongoose';

import User from '../models/user.model';
import InventoryItem, { IInventoryItem } from '../models/inventory.model';
import Recipe, { RecipeIngredient, IRecipe, IRecipeIngredient } from '../models/recipe.model';
import MealPlan, { IMealPlan } from '../models/meal-plan.model';
import GroceryItem, { IGroceryItem } from '../models/grocery.model';

import { IStorage } from '../storage';
// Import types from shared schema
// But we'll adapt them to work with our MongoDB models
import {
  User as UserType,
  InsertUser,
  InventoryItem as InventoryItemType,
  InsertInventoryItem,
  Recipe as RecipeType,
  InsertRecipe,
  RecipeIngredient as RecipeIngredientType,
  InsertRecipeIngredient,
  MealPlan as MealPlanType,
  InsertMealPlan,
  GroceryItem as GroceryItemType,
  InsertGroceryItem
} from '@shared/schema';

// Define interface mappings to handle schema differences
interface MongoUserType extends UserType {
  email: string;
}

interface MongoInventoryItemType extends InventoryItemType {
  purchaseDate: Date;
  userId: mongoose.Types.ObjectId;
}

interface MongoRecipeType extends RecipeType {
  description: string;
  difficulty: string;
  cuisine: string;
  mealType: string;
  dietaryInfo: string[];
  userId: mongoose.Types.ObjectId;
}

interface MongoRecipeIngredientType extends RecipeIngredientType {
  isOptional: boolean;
  notes?: string;
}

interface MongoMealPlanType extends MealPlanType {
  servings: number;
  userId: mongoose.Types.ObjectId;
}

interface MongoGroceryItemType extends GroceryItemType {
  category: string;
  isPurchased: boolean;
  isAddedToInventory: boolean;
  notes?: string;
  userId: mongoose.Types.ObjectId;
}

// Helper function to convert MongoDB _id to a number ID for the interface
const convertMongoIdToNumber = (id: mongoose.Types.ObjectId): number => {
  // Use a hash function to convert ObjectId to a consistent number
  // This is simplistic and only for compatibility with the interface
  const idStr = id.toString();
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Helper function to convert MongoDB document to the interface format
const convertToUserType = (doc: any): UserType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    username: doc.username,
    password: doc.password,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const convertToInventoryItemType = (doc: IInventoryItem): InventoryItemType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    name: doc.name,
    quantity: doc.quantity,
    unit: doc.unit,
    category: doc.category,
    location: doc.location,
    purchaseDate: doc.purchaseDate,
    expiryDate: doc.expiryDate,
    notes: doc.notes || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const convertToRecipeType = (doc: IRecipe): RecipeType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    name: doc.name,
    description: doc.description,
    instructions: doc.instructions,
    prepTime: doc.prepTime,
    cookTime: doc.cookTime,
    servings: doc.servings,
    difficulty: doc.difficulty,
    cuisine: doc.cuisine,
    mealType: doc.mealType,
    imageUrl: doc.imageUrl || null,
    dietaryInfo: doc.dietaryInfo.join(','),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const convertToRecipeIngredientType = (doc: IRecipeIngredient): RecipeIngredientType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    recipeId: convertMongoIdToNumber(doc.recipeId),
    name: doc.name,
    quantity: doc.quantity,
    unit: doc.unit,
    isOptional: doc.isOptional,
    notes: doc.notes || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const convertToMealPlanType = (doc: IMealPlan): MealPlanType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    date: doc.date,
    mealType: doc.mealType,
    recipeId: convertMongoIdToNumber(doc.recipeId),
    notes: doc.notes || null,
    servings: doc.servings,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const convertToGroceryItemType = (doc: IGroceryItem): GroceryItemType => {
  return {
    id: convertMongoIdToNumber(doc._id),
    name: doc.name,
    quantity: doc.quantity,
    unit: doc.unit,
    category: doc.category,
    isPurchased: doc.isPurchased,
    isAddedToInventory: doc.isAddedToInventory,
    notes: doc.notes || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  constructor() {
    console.log('MongoDB storage initialized');
    this.init();
  }

  async init(): Promise<void> {
    await connectToDatabase();
  }

  // User methods
  async getUser(id: number): Promise<UserType | undefined> {
    try {
      // Since we can't query by our converted ID, we'll get all users and find by ID
      // This is inefficient but needed for compatibility
      const users = await User.find({}).exec();
      const user = users.find(u => convertMongoIdToNumber(u._id) === id);
      return user ? convertToUserType(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username }).exec();
      return user ? convertToUserType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<UserType> {
    try {
      const newUser = new User({
        username: user.username,
        email: user.email,
        password: user.password
      });
      const savedUser = await newUser.save();
      return convertToUserType(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Inventory methods
  async getInventoryItems(): Promise<InventoryItemType[]> {
    try {
      const items = await InventoryItem.find({}).exec();
      return items.map(item => convertToInventoryItemType(item));
    } catch (error) {
      console.error('Error getting inventory items:', error);
      return [];
    }
  }

  async getInventoryItemById(id: number): Promise<InventoryItemType | undefined> {
    try {
      // Since we can't query by our converted ID, we'll get all items and find by ID
      const items = await InventoryItem.find({}).exec();
      const item = items.find(i => convertMongoIdToNumber(i._id) === id);
      return item ? convertToInventoryItemType(item) : undefined;
    } catch (error) {
      console.error('Error getting inventory item by ID:', error);
      return undefined;
    }
  }

  async getExpiringItems(daysUntilExpiry: number): Promise<InventoryItemType[]> {
    try {
      const today = new Date();
      const futureDate = addDays(today, daysUntilExpiry);
      
      const items = await InventoryItem.find({
        expiryDate: { $gte: today, $lte: futureDate }
      }).exec();
      
      return items.map(item => convertToInventoryItemType(item));
    } catch (error) {
      console.error('Error getting expiring items:', error);
      return [];
    }
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItemType> {
    try {
      // Get a user to associate with this item (first user for simplicity)
      const user = await User.findOne({}).exec();
      if (!user) throw new Error('No users found to associate with inventory item');
      
      const newItem = new InventoryItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        location: item.location,
        purchaseDate: item.purchaseDate,
        expiryDate: item.expiryDate,
        notes: item.notes,
        userId: user._id
      });
      
      const savedItem = await newItem.save();
      return convertToInventoryItemType(savedItem);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItemType | undefined> {
    try {
      // Find the item by converted ID
      const items = await InventoryItem.find({}).exec();
      const existingItem = items.find(i => convertMongoIdToNumber(i._id) === id);
      
      if (!existingItem) return undefined;
      
      // Update the fields
      Object.assign(existingItem, item);
      const updatedItem = await existingItem.save();
      
      return convertToInventoryItemType(updatedItem);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      // Find the item by converted ID
      const items = await InventoryItem.find({}).exec();
      const existingItem = items.find(i => convertMongoIdToNumber(i._id) === id);
      
      if (!existingItem) return false;
      
      await InventoryItem.deleteOne({ _id: existingItem._id });
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  // Recipe methods
  async getRecipes(): Promise<RecipeType[]> {
    try {
      const recipes = await Recipe.find({}).exec();
      return recipes.map(recipe => convertToRecipeType(recipe));
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  async getRecipeById(id: number): Promise<RecipeType | undefined> {
    try {
      // Since we can't query by our converted ID, we'll get all recipes and find by ID
      const recipes = await Recipe.find({}).exec();
      const recipe = recipes.find(r => convertMongoIdToNumber(r._id) === id);
      return recipe ? convertToRecipeType(recipe) : undefined;
    } catch (error) {
      console.error('Error getting recipe by ID:', error);
      return undefined;
    }
  }

  async createRecipe(recipe: InsertRecipe): Promise<RecipeType> {
    try {
      // Get a user to associate with this recipe (first user for simplicity)
      const user = await User.findOne({}).exec();
      if (!user) throw new Error('No users found to associate with recipe');
      
      const newRecipe = new Recipe({
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        mealType: recipe.mealType,
        imageUrl: recipe.imageUrl,
        dietaryInfo: recipe.dietaryInfo ? recipe.dietaryInfo.split(',').map(s => s.trim()) : [],
        userId: user._id
      });
      
      const savedRecipe = await newRecipe.save();
      return convertToRecipeType(savedRecipe);
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<RecipeType | undefined> {
    try {
      // Find the recipe by converted ID
      const recipes = await Recipe.find({}).exec();
      const existingRecipe = recipes.find(r => convertMongoIdToNumber(r._id) === id);
      
      if (!existingRecipe) return undefined;
      
      // Handle special case for dietaryInfo
      if (recipe.dietaryInfo) {
        existingRecipe.dietaryInfo = recipe.dietaryInfo.split(',').map(s => s.trim());
      }
      
      // Update other fields
      Object.keys(recipe).forEach(key => {
        if (key !== 'dietaryInfo' && recipe[key as keyof typeof recipe] !== undefined) {
          (existingRecipe as any)[key] = recipe[key as keyof typeof recipe];
        }
      });
      
      const updatedRecipe = await existingRecipe.save();
      return convertToRecipeType(updatedRecipe);
    } catch (error) {
      console.error('Error updating recipe:', error);
      return undefined;
    }
  }

  async deleteRecipe(id: number): Promise<boolean> {
    try {
      // Find the recipe by converted ID
      const recipes = await Recipe.find({}).exec();
      const existingRecipe = recipes.find(r => convertMongoIdToNumber(r._id) === id);
      
      if (!existingRecipe) return false;
      
      // Delete the recipe and its ingredients
      await RecipeIngredient.deleteMany({ recipeId: existingRecipe._id });
      await Recipe.deleteOne({ _id: existingRecipe._id });
      
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  // Recipe Ingredient methods
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredientType[]> {
    try {
      // Find the recipe by converted ID
      const recipes = await Recipe.find({}).exec();
      const recipe = recipes.find(r => convertMongoIdToNumber(r._id) === recipeId);
      
      if (!recipe) return [];
      
      const ingredients = await RecipeIngredient.find({ recipeId: recipe._id }).exec();
      return ingredients.map(ingredient => convertToRecipeIngredientType(ingredient));
    } catch (error) {
      console.error('Error getting recipe ingredients:', error);
      return [];
    }
  }

  async createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredientType> {
    try {
      // Find the recipe by converted ID
      const recipes = await Recipe.find({}).exec();
      const recipe = recipes.find(r => convertMongoIdToNumber(r._id) === ingredient.recipeId);
      
      if (!recipe) throw new Error('Recipe not found');
      
      const newIngredient = new RecipeIngredient({
        recipeId: recipe._id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        isOptional: ingredient.isOptional,
        notes: ingredient.notes
      });
      
      const savedIngredient = await newIngredient.save();
      return convertToRecipeIngredientType(savedIngredient);
    } catch (error) {
      console.error('Error creating recipe ingredient:', error);
      throw error;
    }
  }

  async deleteRecipeIngredient(id: number): Promise<boolean> {
    try {
      // Find the ingredient by converted ID
      const ingredients = await RecipeIngredient.find({}).exec();
      const existingIngredient = ingredients.find(i => convertMongoIdToNumber(i._id) === id);
      
      if (!existingIngredient) return false;
      
      await RecipeIngredient.deleteOne({ _id: existingIngredient._id });
      return true;
    } catch (error) {
      console.error('Error deleting recipe ingredient:', error);
      return false;
    }
  }

  // Meal Plan methods
  async getMealPlans(): Promise<MealPlanType[]> {
    try {
      const mealPlans = await MealPlan.find({}).exec();
      return mealPlans.map(mealPlan => convertToMealPlanType(mealPlan));
    } catch (error) {
      console.error('Error getting meal plans:', error);
      return [];
    }
  }

  async getMealPlansByDateRange(startDate: Date, endDate: Date): Promise<MealPlanType[]> {
    try {
      const mealPlans = await MealPlan.find({
        date: { $gte: startDate, $lte: endDate }
      }).exec();
      
      return mealPlans.map(mealPlan => convertToMealPlanType(mealPlan));
    } catch (error) {
      console.error('Error getting meal plans by date range:', error);
      return [];
    }
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlanType> {
    try {
      // Get a user to associate with this meal plan (first user for simplicity)
      const user = await User.findOne({}).exec();
      if (!user) throw new Error('No users found to associate with meal plan');
      
      // Find the recipe by converted ID
      const recipes = await Recipe.find({}).exec();
      const recipe = recipes.find(r => convertMongoIdToNumber(r._id) === mealPlan.recipeId);
      
      if (!recipe) throw new Error('Recipe not found');
      
      const newMealPlan = new MealPlan({
        date: mealPlan.date,
        mealType: mealPlan.mealType,
        recipeId: recipe._id,
        notes: mealPlan.notes,
        servings: mealPlan.servings,
        userId: user._id
      });
      
      const savedMealPlan = await newMealPlan.save();
      return convertToMealPlanType(savedMealPlan);
    } catch (error) {
      console.error('Error creating meal plan:', error);
      throw error;
    }
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlanType | undefined> {
    try {
      // Find the meal plan by converted ID
      const mealPlans = await MealPlan.find({}).exec();
      const existingMealPlan = mealPlans.find(mp => convertMongoIdToNumber(mp._id) === id);
      
      if (!existingMealPlan) return undefined;
      
      // Handle special case for recipeId
      if (mealPlan.recipeId !== undefined) {
        const recipes = await Recipe.find({}).exec();
        const recipe = recipes.find(r => convertMongoIdToNumber(r._id) === mealPlan.recipeId);
        
        if (recipe) {
          existingMealPlan.recipeId = recipe._id;
        }
      }
      
      // Update other fields
      Object.keys(mealPlan).forEach(key => {
        if (key !== 'recipeId' && mealPlan[key as keyof typeof mealPlan] !== undefined) {
          (existingMealPlan as any)[key] = mealPlan[key as keyof typeof mealPlan];
        }
      });
      
      const updatedMealPlan = await existingMealPlan.save();
      return convertToMealPlanType(updatedMealPlan);
    } catch (error) {
      console.error('Error updating meal plan:', error);
      return undefined;
    }
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    try {
      // Find the meal plan by converted ID
      const mealPlans = await MealPlan.find({}).exec();
      const existingMealPlan = mealPlans.find(mp => convertMongoIdToNumber(mp._id) === id);
      
      if (!existingMealPlan) return false;
      
      await MealPlan.deleteOne({ _id: existingMealPlan._id });
      return true;
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      return false;
    }
  }

  // Grocery Item methods
  async getGroceryItems(): Promise<GroceryItemType[]> {
    try {
      const groceryItems = await GroceryItem.find({}).exec();
      return groceryItems.map(item => convertToGroceryItemType(item));
    } catch (error) {
      console.error('Error getting grocery items:', error);
      return [];
    }
  }

  async createGroceryItem(item: InsertGroceryItem): Promise<GroceryItemType> {
    try {
      // Get a user to associate with this grocery item (first user for simplicity)
      const user = await User.findOne({}).exec();
      if (!user) throw new Error('No users found to associate with grocery item');
      
      const newItem = new GroceryItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        isPurchased: item.isPurchased,
        isAddedToInventory: item.isAddedToInventory,
        notes: item.notes,
        userId: user._id
      });
      
      const savedItem = await newItem.save();
      return convertToGroceryItemType(savedItem);
    } catch (error) {
      console.error('Error creating grocery item:', error);
      throw error;
    }
  }

  async updateGroceryItem(id: number, item: Partial<InsertGroceryItem>): Promise<GroceryItemType | undefined> {
    try {
      // Find the grocery item by converted ID
      const groceryItems = await GroceryItem.find({}).exec();
      const existingItem = groceryItems.find(i => convertMongoIdToNumber(i._id) === id);
      
      if (!existingItem) return undefined;
      
      // Update the fields
      Object.assign(existingItem, item);
      const updatedItem = await existingItem.save();
      
      return convertToGroceryItemType(updatedItem);
    } catch (error) {
      console.error('Error updating grocery item:', error);
      return undefined;
    }
  }

  async deleteGroceryItem(id: number): Promise<boolean> {
    try {
      // Find the grocery item by converted ID
      const groceryItems = await GroceryItem.find({}).exec();
      const existingItem = groceryItems.find(i => convertMongoIdToNumber(i._id) === id);
      
      if (!existingItem) return false;
      
      await GroceryItem.deleteOne({ _id: existingItem._id });
      return true;
    } catch (error) {
      console.error('Error deleting grocery item:', error);
      return false;
    }
  }
}

// Create and export an instance of MongoStorage
export const mongoStorage = new MongoStorage();