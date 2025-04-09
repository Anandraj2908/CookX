// Import required modules
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// MongoDB URI setup
if (!process.env.MONGODB_URI) {
  // For local development and testing
  process.env.MONGODB_URI = "mongodb://localhost:27017/kitchen_app";
  console.log("Using default local MongoDB URI:", process.env.MONGODB_URI);
}

// Make sure Gemini API key is available
if (!process.env.GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY environment variable is not set. AI recipe generation will not work.");
}

// Connect to MongoDB database with retry logic
async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MongoDB URI is not set in environment variables');
  }

  // Connection options
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s default
    family: 4 // Use IPv4, skip trying IPv6
  };

  // Exponential backoff retry logic
  const maxRetries = 5;
  let retryCount = 0;
  let connected = false;

  while (!connected && retryCount < maxRetries) {
    try {
      console.log(`Connecting to MongoDB... (attempt ${retryCount + 1}/${maxRetries})`);
      await mongoose.connect(MONGODB_URI, options);
      connected = true;
      console.log('Connected to MongoDB successfully!');
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error('Failed to connect to MongoDB after maximum retries:', error);
        throw error;
      }
      console.error(`Failed to connect to MongoDB (attempt ${retryCount}/${maxRetries}):`, error);
      
      // Calculate delay with exponential backoff and some jitter
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
      console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Set up connection event handlers
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected!');
  });
}

// Simple route to test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    const status = mongoose.connection.readyState;
    const statusMessage = 
      status === 0 ? 'Disconnected' :
      status === 1 ? 'Connected' :
      status === 2 ? 'Connecting' :
      status === 3 ? 'Disconnecting' : 'Unknown';
    
    res.json({ 
      status: 'success', 
      message: `MongoDB connection status: ${statusMessage}`,
      dbStatus: status,
      dbName: mongoose.connection.name || 'not connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error checking database connection',
      error: error.message 
    });
  }
});

// Simple status API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Kitchen Companion API is running',
    timestamp: new Date().toISOString()
  });
});

// AI Recipe Generation endpoint
app.post('/api/ai-recipes', async (req, res) => {
  try {
    const { ingredients, preferences } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: "Ingredients list is required" });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Gemini API key is not configured" });
    }
    
    // Prepare the prompt
    const ingredientList = ingredients
      .map((i) => `${i.name} (${i.quantity} ${i.unit}, from ${i.location})`)
      .join("\n- ");
    
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

Please make sure to:
1. Include preparation and cooking times
2. Include exact measurements
3. Write clear, step-by-step instructions
4. Suggest recipes that make good use of the ingredients I have
5. Only consider common pantry ingredients like salt, pepper, flour, common spices as being always available
`;
    
    console.log("Sending request to Gemini API...");
    
    // Make API call to Gemini
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return res.status(response.status).json({ message: "Failed to connect to Gemini API", error: errorText });
    }
    
    const data = await response.json();
    
    if (data.promptFeedback?.blockReason) {
      return res.status(400).json({ 
        message: "Prompt was blocked by the Gemini API",
        reason: data.promptFeedback.blockReason 
      });
    }
    
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ message: "No response generated from Gemini API" });
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse the recipes from the response
    const recipes = parseRecipesFromResponse(responseText);
    
    res.json({
      rawResponse: responseText,
      parsedRecipes: recipes
    });
  } catch (error) {
    console.error("Error generating recipes:", error);
    res.status(500).json({ message: "Failed to generate recipes", error: error.message });
  }
});

// Helper function to parse recipe response
function parseRecipesFromResponse(responseText) {
  const recipes = [];
  
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

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // If database connection is successful, start the server
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api/status`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the server running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running despite the error
});

// Start the server
startServer();
