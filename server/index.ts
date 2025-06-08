// Servidor de desenvolvimento que inicia backend e frontend separadamente
import { spawn } from 'child_process';
import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import path from 'path';

const PORT_API = 3001;
const PORT_CLIENT = 3000;
const PORT_MAIN = 5000; // Main port for workflow

async function startServices() {
  console.log('🚀 Iniciando WikiStore com arquitetura separada...');
  
  // Inicia o backend NestJS
  console.log(`📡 Iniciando API Backend na porta ${PORT_API}...`);
  const apiProcess = spawn('npm', ['run', 'start:dev'], {
    cwd: path.resolve(process.cwd(), 'api'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: PORT_API.toString() }
  });

  // Aguarda um pouco antes de iniciar o frontend
  setTimeout(() => {
    console.log(`🌐 Iniciando Frontend Client na porta ${PORT_CLIENT}...`);
    const clientProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(process.cwd(), 'client'),
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        VITE_API_URL: `http://localhost:${PORT_API}`,
        PORT: PORT_CLIENT.toString()
      }
    });

    clientProcess.on('error', (error) => {
      console.error('Erro no frontend:', error);
    });

    // Create proxy server on port 5000 for workflow compatibility
    setTimeout(() => {
      const app = express();
      
      // Proxy API requests to backend
      app.use('/api', createProxyMiddleware({
        target: `http://localhost:${PORT_API}`,
        changeOrigin: true,
      }));
      
      // Proxy all other requests to frontend
      app.use('/', createProxyMiddleware({
        target: `http://localhost:${PORT_CLIENT}`,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying for HMR
      }));

      app.listen(PORT_MAIN, '0.0.0.0', () => {
        console.log(`🌍 Proxy server running on http://localhost:${PORT_MAIN}`);
        console.log(`   Frontend: http://localhost:${PORT_CLIENT} → :${PORT_MAIN}`);
        console.log(`   API: http://localhost:${PORT_API}/api → :${PORT_MAIN}/api`);
      });
    }, 5000);
  }, 3000);

  apiProcess.on('error', (error) => {
    console.error('Erro no backend:', error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando serviços...');
    apiProcess.kill();
    process.exit(0);
  });
}

startServices().catch(console.error);