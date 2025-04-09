import { spawn } from 'child_process';
import fs from 'fs';

// Function to start the server with node
async function startServer() {
  console.log('Starting Kitchen Companion application...');
  
  // Kill any existing node processes that might be running the app
  try {
    const pid = fs.readFileSync('./app.pid', 'utf8');
    console.log(`Found existing app process with PID ${pid}, attempting to kill...`);
    process.kill(pid, 'SIGTERM');
    console.log('Killed existing app process');
  } catch (err) {
    // Ignore errors if no PID file exists or process isn't running
  }
  
  // Start the server
  const server = spawn('node', ['--no-warnings', 'kitchen_app.js'], {
    stdio: 'inherit',
    detached: true
  });
  
  // Save the PID to a file for future reference
  fs.writeFileSync('./app.pid', server.pid.toString());
  
  console.log(`Server started with PID ${server.pid}`);
  
  // If the server exits unexpectedly, log it
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  // Keep the script running to maintain the child process
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down server...');
    server.kill('SIGTERM');
    process.exit(0);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
