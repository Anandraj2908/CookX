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
    const response = await fetch(`/api/generate-recipes`, {
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
      let errorMessage = "Failed to generate recipes";
      try {
        const errorData = await response.json();
        console.error("AI recipe generation error:", errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("Server returned:", responseData);
    
    // The server response contains parsedRecipes and savedRecipes
    const recipes = responseData.parsedRecipes || [];
    console.log("Server returned", recipes.length, "parsed recipes");
    
    return recipes;
    
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}

// The response parsing is now handled on the server side