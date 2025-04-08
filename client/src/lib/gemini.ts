import { InventoryItem } from "@shared/schema";
import { apiRequest } from "./queryClient";

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

export async function getRecipeRecommendations(
  ingredients: InventoryItem[], 
  preferences: string
): Promise<RecipeRecommendation[]> {
  try {
    console.log("Calling server AI recipe endpoint with", ingredients.length, "ingredients");
    
    // Use the apiRequest helper to properly handle tokens and errors
    const recipes = await apiRequest<RecipeRecommendation[]>({
      url: "/api/generate-recipes",
      method: "POST",
      data: {
        ingredients,
        preferences
      }
    });
    
    console.log("Server returned", recipes.length, "recipes");
    return recipes;
    
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}