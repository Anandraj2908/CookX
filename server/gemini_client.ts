import { GoogleGenerativeAI } from "@google/generative-ai";

// RecipeRecommendation interface
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

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Test the connection to the Gemini API
   * @returns A response with test recipe
   */
  async testConnection(): Promise<{ message: string, response: string }> {
    try {
      // Get the generative model
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      
      // Generate content
      const result = await model.generateContent("Hello! Please respond with a simple test recipe for cookies.");
      const text = result.response.text();
      
      return {
        message: "Gemini API test successful",
        response: text
      };
    } catch (error) {
      throw new Error(`Error calling Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get recipe recommendations based on ingredients and preferences
   * @param ingredients List of ingredients with details
   * @param preferences User dietary preferences or restrictions
   * @returns Text response from Gemini API
   */
  async getRecipeRecommendations(
    ingredients: Array<{ name: string, quantity: string, unit: string, location: string }>, 
    preferences?: string
  ): Promise<string> {
    try {
      // Format ingredients into a list for the prompt
      const ingredientList = ingredients.map(ing => 
        `${ing.name} (${ing.quantity} ${ing.unit}, stored in ${ing.location})`
      ).join("\n");
      
      // Create the prompt for Gemini
      const prompt = `
I have the following ingredients:
${ingredientList}

User preferences: ${preferences || "No specific preferences"}

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
      
      // Get the generative model with configuration
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      });
      
      // Generate content with the prompt
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      return text;
    } catch (error) {
      throw new Error(`Error calling Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Parse recipe recommendations from Gemini API response text
   * @param responseText Raw text from Gemini API
   * @returns Array of parsed recipe recommendations
   */
  parseRecipesFromResponse(responseText: string): RecipeRecommendation[] {
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
}

// Create and export a default instance that can be imported elsewhere
export const createGeminiClient = (apiKey: string) => new GeminiClient(apiKey);