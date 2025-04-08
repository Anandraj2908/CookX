// Simple server runner for Replit workflows
import { spawn } from 'child_process';

// Start kitchen app server
const server = spawn('node', ['kitchen_app.mjs'], {
  stdio: 'inherit'
});

console.log(`Kitchen app server started with PID: ${server.pid}`);

// Handle process events
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Keep process running
process.on('SIGINT', () => {
  console.log('Received SIGINT - shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM - shutting down server...');
  server.kill('SIGTERM');
});