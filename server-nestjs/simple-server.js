const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Basic API endpoints for testing
app.get('/api/auth/me', (req, res) => {
  res.json({
    id: 1,
    email: 'test@example.com',
    role: 'admin',
    tenantId: 1,
  });
});

app.get('/api/tenants', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Test Store',
      subdomain: 'test-store',
      status: 'active',
    }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      stock: 10,
      isActive: true,
    }
  ]);
});

app.get('/api/orders', (req, res) => {
  res.json([
    {
      id: 1,
      total: 99.99,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  ]);
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  res.json({
    message: 'API endpoint available',
    endpoint: req.path,
    method: req.method,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple Backend running on port ${PORT}`);
});