// Script to test the AI recipe generation functionality
import fetch from 'node-fetch';
import 'dotenv/config';

async function testAiRecipes() {
  console.log('Testing AI Recipe Generation...');
  
  // Sample ingredients from a user's inventory
  const ingredients = [
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
  
  const preferences = "I prefer spicy food, and I'm avoiding dairy";
  
  try {
    // Create a mock JWT token for testing
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjU4OWFiY2RlY2ZjZjIyMTk0ZjJkNiIsImlhdCI6MTc0NDE0Njg0OCwiZXhwIjoxNzQ2NzM4ODQ4fQ.M9xjUwXKTdqBDgzzvehpwzhlY-VnZMa1puWm5D_nzHc";
    
    console.log('Making API request...');
    
    // Test the /api/ai-recipes endpoint
    const response = await fetch('http://localhost:5000/api/ai-recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ingredients,
        preferences
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    // Print the API response
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // If we got recipe data, display the first recipe
    if (data.parsedRecipes && data.parsedRecipes.length > 0) {
      console.log('\nExample Recipe:');
      const recipe = data.parsedRecipes[0];
      console.log(`Name: ${recipe.name}`);
      console.log(`Prep Time: ${recipe.prepTime} min`);
      console.log(`Cook Time: ${recipe.cookTime} min`);
      console.log(`Servings: ${recipe.servings}`);
      
      console.log('\nIngredients:');
      recipe.ingredients.forEach(ing => console.log(`- ${ing}`));
      
      console.log('\nInstructions:');
      console.log(recipe.instructions);
    }
    
  } catch (error) {
    console.error('Error testing AI recipes:', error);
  }
}

testAiRecipes();