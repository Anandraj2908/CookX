// This is a simple script to start the kitchen companion app
// We use the ESM import syntax since package.json has "type": "module"
import { execSync } from 'child_process';

try {
  console.log('Starting the Kitchen Companion App...');
  
  // Use tsx to run the server - same as npm run dev
  execSync('npx tsx server/index.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting the app:', error);
  process.exit(1);
}