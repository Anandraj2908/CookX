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
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Gemini API key not found");
    }

    // Format ingredients into a list
    const ingredientList = ingredients.map(ing => 
      `${ing.name} (${ing.quantity} ${ing.unit}, stored in ${ing.location})`
    ).join("\n");

    // Create the prompt for Gemini
    const prompt = `
I have the following ingredients:
${ingredientList}

User preferences: ${preferences}

Based on these ingredients and preferences, suggest 3 recipes I can make.

Format each recipe as follows:
RECIPE NAME: [name]
CUISINE: [cuisine type]
DIETARY INFO: [vegetarian, vegan, gluten-free, etc.]
PREP TIME: [minutes]
COOK TIME: [minutes]
SERVINGS: [number]
INGREDIENTS:
- [ingredient with quantity]
- [ingredient with quantity]
...
INSTRUCTIONS:
1. [step]
2. [step]
...

Only include recipes that I can make with the provided ingredients, with minimal additional ingredients. Follow the user preferences strictly.
`;

    // Call the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    // Parse the response
    const responseText = data.candidates[0].content.parts[0].text;
    return parseRecipesFromResponse(responseText);
    
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}

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