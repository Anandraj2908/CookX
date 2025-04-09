// Script to list available Gemini models
import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  process.exit(1);
}

async function listModels() {
  try {
    console.log('Listing Gemini models...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    
    console.log('Available models:');
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        console.log(`  Supported generation methods: ${model.supportedGenerationMethods?.join(', ') || 'none'}`);
        console.log('');
      });
    } else {
      console.log('No models found.');
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();