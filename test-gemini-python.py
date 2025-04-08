#!/usr/bin/env python3
"""
Test script for the Python Gemini client
"""

import os
import sys
import json
from server.gemini_client import GeminiClient

def test_gemini_client():
    """Test the Gemini client functionality"""
    try:
        # Check if API key is set
        if "GEMINI_API_KEY" not in os.environ:
            print("Error: GEMINI_API_KEY environment variable is not set")
            sys.exit(1)
            
        print("Testing Gemini API connection...")
        
        # Test basic connection
        test_result = GeminiClient.test_connection()
        print("Connection test successful!")
        print(f"Response: {test_result['response']}")
        
        # Test recipe recommendation
        print("\nTesting recipe recommendations...")
        ingredients = [
            {"name": "Chicken", "quantity": "2", "unit": "breasts", "location": "Fridge"},
            {"name": "Rice", "quantity": "1", "unit": "cup", "location": "Pantry"},
            {"name": "Broccoli", "quantity": "1", "unit": "head", "location": "Fridge"},
            {"name": "Garlic", "quantity": "3", "unit": "cloves", "location": "Pantry"},
            {"name": "Soy Sauce", "quantity": "1/4", "unit": "cup", "location": "Fridge"}
        ]
        
        preferences = "Healthy recipes with low sodium"
        
        response = GeminiClient.get_recipe_recommendations(ingredients, preferences)
        print("Recipe recommendations received!")
        print("\nResponse:")
        print(response)
        
    except Exception as e:
        print(f"Error testing Gemini API: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    test_gemini_client()