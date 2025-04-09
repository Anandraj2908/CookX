// Combined script to start the server and test it
import { spawn } from 'child_process';
import fs from 'fs';
import fetch from 'node-fetch';

// Test ingredients
const testIngredients = [
  {
    name: "Chicken Breast",
    quantity: 2,
    unit: "pcs",
    location: "Refrigerator"
  },
  {
    name: "Rice",
    quantity: 500,
    unit: "g",
    location: "Pantry"
  },
  {
    name: "Onion",
    quantity: 2,
    unit: "pcs",
    location: "Counter"
  },
  {
    name: "Bell Pepper",
    quantity: 1,
    unit: "pc",
    location: "Refrigerator"
  },
  {
    name: "Garlic",
    quantity: 3,
    unit: "cloves",
    location: "Counter"
  }
];

// Setup environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kitchen_app";

// Start the server
console.log('Starting Kitchen Companion app...');
const server = spawn('node', ['kitchen_app.js'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env
});

// Track when the server is ready
let serverReady = false;

// Pipe output to console
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Server]: ${output.trim()}`);
  
  // Check if the server has started
  if (output.includes('Server running on port') && !serverReady) {
    serverReady = true;
    console.log('\n--- Server is ready, starting tests... ---\n');
    // Wait a bit more for the server to be fully initialized
    setTimeout(runTests, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

// If the server exits
server.on('close', (code) => {
  console.log(`[Server] Process exited with code ${code}`);
  // Exit after server exits
  process.exit(code);
});

// Run our tests
async function runTests() {
  try {
    console.log('1. Testing API status endpoint...');
    
    // Test the /api/status endpoint
    const statusResponse = await fetch('http://localhost:5000/api/status');
    const statusData = await statusResponse.json();
    console.log('Status API response:', statusData);
    
    if (statusData.status === 'ok') {
      console.log('✅ Status API test passed');
    } else {
      console.log('❌ Status API test failed');
      return;
    }
    
    // Basic authentication token for testing
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjU4OWFiY2RlY2ZjZjIyMTk0ZjJkNiIsImlhdCI6MTc0NDE0Njg0OCwiZXhwIjoxNzQ2NzM4ODQ4fQ.M9xjUwXKTdqBDgzzvehpwzhlY-VnZMa1puWm5D_nzHc";
    
    console.log('\n2. Testing AI Recipe Generation API...');
    console.log('Sending recipe generation request with these ingredients:');
    console.log(testIngredients);
    
    // Test the /api/ai-recipes endpoint
    const recipeResponse = await fetch('http://localhost:5000/api/ai-recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ingredients: testIngredients,
        preferences: "I prefer spicy food, and I'm avoiding dairy"
      })
    });
    
    if (!recipeResponse.ok) {
      const errorText = await recipeResponse.text();
      console.log(`❌ Recipe API test failed with status ${recipeResponse.status}: ${errorText}`);
      return;
    }
    
    const recipeData = await recipeResponse.json();
    
    console.log('\nAPI Response received. Raw response length:', recipeData.rawResponse?.length);
    console.log('Number of parsed recipes:', recipeData.parsedRecipes?.length);
    
    if (recipeData.parsedRecipes && recipeData.parsedRecipes.length > 0) {
      console.log('\n✅ Recipe API test passed!');
      console.log('\nExample Recipe:');
      const recipe = recipeData.parsedRecipes[0];
      console.log(`Name: ${recipe.name}`);
      console.log(`Cuisine: ${recipe.cuisine || 'Not specified'}`);
      console.log(`Prep Time: ${recipe.prepTime} min`);
      console.log(`Cook Time: ${recipe.cookTime} min`);
      console.log(`Servings: ${recipe.servings}`);
      
      console.log('\nIngredients:');
      recipe.ingredients.forEach(ing => console.log(`- ${ing}`));
      
      console.log('\nInstructions:');
      console.log(recipe.instructions);
    } else {
      console.log('❌ No recipes were parsed from the response');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nTests completed, shutting down server...');
    server.kill('SIGTERM');
  }
}

// Handle shutdown cleanly
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});