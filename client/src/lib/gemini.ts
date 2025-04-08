import { InventoryItem } from "@shared/schema";

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
    
    // Call the server-side endpoint instead of calling Gemini directly
    const response = await fetch(`/api/ai-recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ingredients,
        preferences
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("AI recipe generation error:", errorData);
      throw new Error(errorData.error || "Failed to generate recipes");
    }

    const recipes = await response.json();
    console.log("Server returned", recipes.length, "recipes");
    
    return recipes;
    
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}

// The response parsing is now handled on the server side