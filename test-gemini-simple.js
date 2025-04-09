// Simple Gemini API test
import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  process.exit(1);
}

async function testGemini() {
  try {
    console.log('Testing Gemini API with a simple prompt...');
    
    const prompt = "What are 3 simple recipes I can make with chicken, rice, and vegetables?";
    
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
          maxOutputTokens: 1024,
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.promptFeedback?.blockReason) {
      console.error('Prompt was blocked:', data.promptFeedback.blockReason);
      return;
    }
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No response generated from Gemini API');
      return;
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    console.log('\nGemini API Response:');
    console.log(responseText);
    
    console.log('\nAPI test successful!');
  } catch (error) {
    console.error('Error testing Gemini API:', error);
  }
}

testGemini();