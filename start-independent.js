const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WikiStore Independent Deployment...\n');

// Start the server
const server = spawn('node', ['express-server.cjs'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down services...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Client running on: http://localhost:3000');
console.log('✅ Server running on: http://localhost:3001');
console.log('✅ Health check: http://localhost:3001/health\n');