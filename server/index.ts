// Development server with integrated Vite and API backend
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const PORT = process.env.PORT || 5000;

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(process.cwd(), 'client')
  });

  // JSON parsing for API routes
  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // API Routes for testing connectivity
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/auth/me', (req, res) => res.json({ id: 1, email: 'admin@wikistore.com', role: 'admin', tenantId: 1 }));
  app.get('/api/tenants', (req, res) => res.json([{ id: 1, name: 'WikiStore Demo', subdomain: 'demo', status: 'active' }]));
  app.get('/api/products', (req, res) => res.json([{ id: 1, name: 'Produto Demo', price: 99.99, stock: 50, isActive: true }]));
  app.get('/api/orders', (req, res) => res.json([{ id: 1, total: 199.99, status: 'pending', createdAt: new Date().toISOString() }]));

  // Vite middleware serves React app
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
    console.log(`React app with Vite HMR and API backend ready`);
  });
}

createServer().catch(console.error);