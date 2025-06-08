import { spawn } from 'child_process';
import { join } from 'path';

// Start NestJS backend
const nestjsProcess = spawn('npm', ['run', 'start:dev'], {
  cwd: join(process.cwd(), 'server-nestjs'),
  stdio: 'inherit',
  shell: true
});

nestjsProcess.on('error', (err) => {
  console.error('Failed to start NestJS server:', err);
  process.exit(1);
});

nestjsProcess.on('close', (code) => {
  console.log(`NestJS server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  nestjsProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nestjsProcess.kill('SIGTERM');
});