// Simple script to start the kitchen application
// Run with: node start-kitchen-app.mjs

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('Starting kitchen application server...');
  
  // Kill any existing process
  try {
    const pidFilePath = path.join(process.cwd(), 'app.pid');
    if (fs.existsSync(pidFilePath)) {
      const pid = fs.readFileSync(pidFilePath, 'utf8');
      console.log(`Found existing process with PID: ${pid}, attempting to kill it...`);
      try {
        process.kill(parseInt(pid), 'SIGTERM');
        console.log('Successfully terminated existing process');
      } catch (err) {
        console.log('Failed to kill process or process already terminated');
      }
      fs.unlinkSync(pidFilePath);
    }
  } catch (error) {
    console.error('Error handling existing process:', error);
  }

  // Start the server
  const server = spawn('node', ['kitchen_app.mjs'], {
    stdio: 'inherit',
    detached: true,
  });

  // Save PID to file
  fs.writeFileSync(path.join(process.cwd(), 'app.pid'), server.pid.toString());
  
  console.log(`Server started with PID: ${server.pid}`);
  
  // Handle process events
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  // Don't wait for child process
  server.unref();
}

// Run the start function
startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});