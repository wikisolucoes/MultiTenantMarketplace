const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5001';

// Start NestJS in production mode
const nestProcess = spawn('node', ['dist/main'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  env: process.env
});

nestProcess.on('error', (error) => {
  console.error('Failed to start NestJS server:', error);
  process.exit(1);
});

nestProcess.on('close', (code) => {
  console.log(`NestJS server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  nestProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  nestProcess.kill('SIGINT');
});