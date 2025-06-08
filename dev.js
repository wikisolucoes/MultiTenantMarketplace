#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting WikiStore Platform - Independent Deployment');

// Start server first
const serverProcess = spawn('node', ['express-server.js'], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'development'
  }
});

// Wait for server to start, then start client
setTimeout(() => {
  const clientProcess = spawn('npm', ['run', 'dev:client'], {
    cwd: path.join(__dirname, 'client'),
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      VITE_API_URL: 'http://localhost:3001',
      PORT: '3000'
    }
  });

  // Pipe outputs
  clientProcess.stdout.pipe(process.stdout);
  clientProcess.stderr.pipe(process.stderr);

  clientProcess.on('exit', (code) => {
    if (code !== 0) {
      serverProcess.kill('SIGTERM');
      process.exit(1);
    }
  });
}, 2000);

// Pipe server output
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    process.exit(1);
  }
});

// Handle cleanup
process.on('SIGINT', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});