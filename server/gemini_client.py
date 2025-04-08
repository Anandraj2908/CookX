import os
import google.generativeai as genai
from typing import Dict, List, Any, Optional

# Configure the Gemini API with the API key
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

class GeminiClient:
    """Client for interacting with Google's Gemini API using the official Python client."""
    
    @staticmethod
    def get_recipe_recommendations(ingredients: List[Dict[str, Any]], preferences: Optional[str] = None) -> str:
        """
        Get recipe recommendations based on ingredients and preferences.
        
        Args:
            ingredients: List of ingredient objects with name, quantity, unit, and location
            preferences: String of dietary preferences or restrictions
            
        Returns:
            String containing the formatted recipe recommendations
        """
        if not API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        # Format ingredients into a list for the prompt
        ingredient_list = "\n".join([
            f"{ing['name']} ({ing.get('quantity', '')} {ing.get('unit', '')}, stored in {ing.get('location', 'Kitchen')})"
            for ing in ingredients
        ])

        # Create the prompt for Gemini
        prompt = f"""
I have the following ingredients:
{ingredient_list}

User preferences: {preferences or "No specific preferences"}

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
"""

        # Call the Gemini API using the official client
        try:
            # Use gemini-1.5-pro-latest or another appropriate model
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            
            # Return the text response
            return response.text
            
        except Exception as e:
            raise Exception(f"Error calling Gemini API: {str(e)}")
            
    @staticmethod
    def test_connection() -> Dict[str, Any]:
        """
        Test the connection to the Gemini API.
        
        Returns:
            Dictionary containing the response from the API
        """
        if not API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
            
        try:
            # Use gemini-1.5-pro-latest or another appropriate model
            model = genai.GenerativeModel('gemini-1.5-pro-latest') 
            response = model.generate_content("Hello! Please respond with a simple test recipe for cookies.")
            
            return {
                "message": "Gemini API test successful",
                "response": response.text
            }
            
        except Exception as e:
            raise Exception(f"Error calling Gemini API: {str(e)}")