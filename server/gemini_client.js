import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Client for interacting with Google's Gemini API
 */
export class GeminiClient {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Test the connection to the Gemini API
   * @returns A response with test recipe
   */
  async testConnection() {
    try {
      console.log("Testing Gemini API connection...");
      
      // Get the generative model with proper configuration
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        }
      });
      
      // Simple prompt for testing
      const prompt = "Give me a recipe for a simple pasta dish. Format it with a title, ingredients list, and step by step instructions.";
      console.log("Sending test prompt to Gemini API:", prompt.substring(0, 30) + "...");
      
      // Generate content
      const result = await model.generateContent(prompt);
      
      if (!result || !result.response) {
        console.error("Received empty response from Gemini API");
        throw new Error("Empty response received from Gemini API");
      }
      
      const response = result.response.text();
      console.log("Successfully received response from Gemini API");
      
      return {
        message: "Gemini API connection successful",
        response
      };
    } catch (error) {
      console.error("Error in testConnection:", error);
      // Include more detailed error information
      if (error.response) {
        console.error("API response error:", error.response);
      }
      throw new Error(`Gemini API connection failed: ${error.message}`);
    }
  }

  /**
   * Get recipe recommendations based on ingredients and preferences
   * @param ingredients List of ingredients with details
   * @param preferences User dietary preferences or restrictions
   * @returns Text response from Gemini API
   */
  async getRecipeRecommendations(ingredients, preferences) {
    try {
      // Prepare the ingredients list
      const ingredientList = ingredients
        .map(i => `${i.name} (${i.quantity} ${i.unit}, from ${i.location})`)
        .join("\n- ");
      
      console.log("Creating recipe recommendations for ingredients:", 
        ingredients.map(i => i.name).join(", "));
      
      // Build the prompt
      const prompt = `Generate 3 recipes that I can make with these ingredients in my kitchen:
      
Ingredients:
- ${ingredientList}

${preferences ? `My preferences: ${preferences}` : ""}

Use only these ingredients and common pantry staples. Format each recipe like this:

RECIPE NAME: [name]
CUISINE: [cuisine type]
DIETARY INFO: [vegetarian, vegan, gluten-free, etc.]
PREP TIME: [minutes]
COOK TIME: [minutes]
SERVINGS: [number]

INGREDIENTS:
- [ingredient 1]
- [ingredient 2]
...

INSTRUCTIONS:
[step by step instructions]

Only include recipes that I can make with the provided ingredients, with minimal additional ingredients. Follow the user preferences strictly.
`;
      
      console.log("Prompt generated, length:", prompt.length);
      
      // Get the generative model with configuration
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
      
      console.log("Sending recipe generation request to Gemini API...");
      
      // Generate content with the prompt
      const result = await model.generateContent(prompt);
      
      if (!result || !result.response) {
        console.error("Empty response received from Gemini API for recipe generation");
        throw new Error("Empty response received from Gemini API");
      }
      
      const text = result.response.text();
      console.log("Successfully received recipe response from Gemini API, length:", text.length);
      
      return text;
    } catch (error) {
      console.error("Error in getRecipeRecommendations:", error);
      // Include more detailed error information
      if (error.response) {
        console.error("API response error:", error.response);
      }
      throw new Error(`Error calling Gemini API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Parse recipe recommendations from Gemini API response text
   * @param responseText Raw text from Gemini API
   * @returns Array of parsed recipe recommendations
   */
  parseRecipesFromResponse(responseText) {
    const recipes = [];
    
    if (!responseText || typeof responseText !== 'string') {
      console.error("Invalid response text received:", responseText);
      throw new Error("Invalid response text received from Gemini API");
    }
    
    console.log("Parsing recipe response, length:", responseText.length);
    
    // Split the response into separate recipes
    const recipeBlocks = responseText.split(/RECIPE NAME:/i).slice(1);
    console.log(`Found ${recipeBlocks.length} recipe blocks to parse`);
    
    if (recipeBlocks.length === 0) {
      console.warn("No recipe blocks found in response, trying alternative parsing method");
      // Try an alternative parsing method - maybe the format is different
      const recipes = this.tryAlternativeRecipeParsing(responseText);
      if (recipes.length > 0) {
        return recipes;
      }
      console.error("Failed to parse any recipes from response");
    }
    
    for (const block of recipeBlocks) {
      try {
        const nameMatch = block.trim().match(/^(.*?)(?=\n)/);
        const cuisineMatch = block.match(/CUISINE:\s*(.*?)(?=\n)/i);
        const dietaryMatch = block.match(/DIETARY INFO:\s*(.*?)(?=\n)/i);
        const prepTimeMatch = block.match(/PREP TIME:\s*(\d+)/i);
        const cookTimeMatch = block.match(/COOK TIME:\s*(\d+)/i);
        const servingsMatch = block.match(/SERVINGS:\s*(\d+)/i);
        
        // Extract ingredients list
        const ingredientsStartIdx = block.indexOf("INGREDIENTS:");
        const instructionsStartIdx = block.indexOf("INSTRUCTIONS:");
        
        let ingredients = [];
        if (ingredientsStartIdx > -1 && instructionsStartIdx > -1) {
          const ingredientsText = block.substring(ingredientsStartIdx + 12, instructionsStartIdx).trim();
          ingredients = ingredientsText.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('•'))
            .map(line => line.substring(1).trim());
        }
        
        // Extract instructions
        let instructions = "";
        if (instructionsStartIdx > -1) {
          instructions = block.substring(instructionsStartIdx + 12).trim();
        }
        
        // Create recipe object with parsed data
        const recipe = {
          name: nameMatch ? nameMatch[0].trim() : "Unnamed Recipe",
          ingredients: ingredients,
          instructions: instructions,
          prepTime: prepTimeMatch ? parseInt(prepTimeMatch[1], 10) : 0,
          cookTime: cookTimeMatch ? parseInt(cookTimeMatch[1], 10) : 0,
          servings: servingsMatch ? parseInt(servingsMatch[1], 10) : 0,
          cuisine: cuisineMatch ? cuisineMatch[1].trim() : "",
          dietaryInfo: dietaryMatch ? 
            dietaryMatch[1].split(',').map(s => s.trim()) : 
            []
        };
        
        console.log(`Successfully parsed recipe: ${recipe.name}`);
        recipes.push(recipe);
      } catch (error) {
        console.error("Error parsing recipe block:", error);
        console.error("Problem recipe block:", block.substring(0, 100) + "...");
        // Continue to the next recipe even if one fails to parse
      }
    }
    
    if (recipes.length === 0) {
      console.error("Failed to parse any valid recipes from the response");
      
      // Provide a fallback recipe if nothing parsed successfully
      recipes.push({
        name: "Recipe Generation Error",
        ingredients: ["Please try again with different ingredients"],
        instructions: "There was an error generating recipes with the provided ingredients. Please try with different ingredients or dietary preferences.",
        prepTime: 0,
        cookTime: 0,
        servings: 0,
        cuisine: "",
        dietaryInfo: []
      });
    }
    
    return recipes;
  }
  
  // Try alternative parsing when the expected format is not found
  tryAlternativeRecipeParsing(responseText) {
    console.log("Attempting alternative recipe parsing method");
    const recipes = [];
    
    try {
      // Look for recipe titles indicated by heading markers or all caps
      const possibleTitles = responseText.match(/(?:^|\n)(?:#{1,3}|[A-Z\s]{5,}:?)\s*(.+?)(?:\n|$)/gm);
      
      if (possibleTitles && possibleTitles.length > 0) {
        console.log(`Found ${possibleTitles.length} possible recipe titles`);
        
        // Use title positions to split the text into recipe blocks
        let lastIndex = 0;
        for (let i = 0; i < possibleTitles.length; i++) {
          const titlePos = responseText.indexOf(possibleTitles[i], lastIndex);
          const nextTitlePos = i < possibleTitles.length - 1 
            ? responseText.indexOf(possibleTitles[i+1], titlePos) 
            : responseText.length;
          
          const recipeText = responseText.substring(titlePos, nextTitlePos);
          const title = possibleTitles[i].replace(/^#+\s*|[\n:]/g, '').trim();
          
          // Extract ingredients and instructions based on keywords
          const ingredientsMatch = recipeText.match(/(?:ingredients|you will need)[\s\S]*?(?=instructions|directions|method|steps|preparation|$)/i);
          const instructionsMatch = recipeText.match(/(?:instructions|directions|method|steps|preparation)[\s\S]*$/i);
          
          const ingredients = ingredientsMatch 
            ? ingredientsMatch[0]
                .replace(/(?:ingredients|you will need):?/i, '')
                .split(/\n/)
                .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
                .filter(line => line.length > 0)
            : [];
          
          const instructions = instructionsMatch 
            ? instructionsMatch[0]
                .replace(/(?:instructions|directions|method|steps|preparation):?/i, '')
                .trim() 
            : "";
          
          recipes.push({
            name: title || "Unnamed Recipe",
            ingredients: ingredients,
            instructions: instructions,
            prepTime: 0, // Cannot determine from this format
            cookTime: 0, // Cannot determine from this format
            servings: 0, // Cannot determine from this format
            cuisine: "",
            dietaryInfo: []
          });
          
          lastIndex = nextTitlePos;
        }
      }
    } catch (error) {
      console.error("Error in alternative recipe parsing:", error);
    }
    
    return recipes;
  }
}

/**
 * Create a new GeminiClient instance
 * @param apiKey Gemini API key
 * @returns GeminiClient instance
 */
export const createGeminiClient = (apiKey) => new GeminiClient(apiKey);

export default GeminiClient;