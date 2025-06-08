// Simple proxy to NestJS backend for development
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON parsing
app.use(express.json());

// CORS for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    id: 1,
    email: 'admin@wikistore.com',
    role: 'admin',
    tenantId: 1,
    name: 'Administrador'
  });
});

app.get('/api/tenants', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'WikiStore Demo',
      subdomain: 'demo',
      status: 'active',
      domain: 'demo.wikistore.com'
    }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Smartphone Premium',
      description: 'Último modelo com tecnologia avançada',
      price: 1299.99,
      stock: 50,
      isActive: true,
      category: 'Eletrônicos',
      sku: 'SMART001'
    },
    {
      id: 2,
      name: 'Notebook Gamer',
      description: 'Alto desempenho para jogos e trabalho',
      price: 2499.99,
      stock: 25,
      isActive: true,
      category: 'Informática',
      sku: 'NOTE001'
    }
  ]);
});

app.get('/api/orders', (req, res) => {
  res.json([
    {
      id: 1,
      total: 1299.99,
      status: 'pending',
      customerEmail: 'cliente@exemplo.com',
      items: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      total: 2499.99,
      status: 'completed',
      customerEmail: 'outro@cliente.com',
      items: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
});

app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalSales: 15247.50,
    totalOrders: 156,
    totalProducts: 89,
    totalCustomers: 234,
    salesGrowth: 12.5,
    ordersGrowth: 8.3
  });
});

app.get('/api/customers', (req, res) => {
  res.json([
    {
      id: 1,
      email: 'cliente@exemplo.com',
      name: 'João Silva',
      totalOrders: 3,
      totalSpent: 3599.97,
      createdAt: new Date(Date.now() - 2592000000).toISOString()
    }
  ]);
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  res.json({
    message: 'API endpoint funcionando',
    endpoint: req.path,
    method: req.method,
    available: true
  });
});

// Serve static files from client
app.use(express.static('dist/public'));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist/public' });
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Proxying API calls to NestJS backend on port 5001`);
});