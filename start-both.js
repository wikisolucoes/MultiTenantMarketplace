#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

const PORT_CLIENT = process.env.CLIENT_PORT || 3000;
const PORT_SERVER = process.env.SERVER_PORT || 3001;

console.log('🚀 Starting WikiStore Platform - Independent Deployment Mode');
console.log(`📱 Client will run on: http://localhost:${PORT_CLIENT}`);
console.log(`🔧 Server will run on: http://localhost:${PORT_SERVER}`);

// Start client
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(process.cwd(), 'client'),
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: `http://localhost:${PORT_SERVER}`,
    PORT: PORT_CLIENT
  }
});

// Start server
const serverProcess = spawn('node', ['express-server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: PORT_SERVER,
    NODE_ENV: 'development'
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WikiStore Platform...');
  clientProcess.kill('SIGINT');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

// Handle client process exit
clientProcess.on('exit', (code) => {
  console.log(`📱 Client process exited with code ${code}`);
  if (code !== 0) {
    serverProcess.kill('SIGINT');
    process.exit(1);
  }
});

// Handle server process exit
serverProcess.on('exit', (code) => {
  console.log(`🔧 Server process exited with code ${code}`);
  if (code !== 0) {
    clientProcess.kill('SIGINT');
    process.exit(1);
  }
});

console.log('✅ Both services started successfully');
console.log('👥 Client ready for AWS Amplify deployment');
console.log('⚡ Server ready for AWS App Runner deployment');