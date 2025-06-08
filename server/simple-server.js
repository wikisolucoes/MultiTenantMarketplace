const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'WikiStore API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'WikiStore API',
    version: '1.0.0',
    description: 'Multi-tenant e-commerce platform API',
    endpoints: {
      health: '/health',
      docs: '/api/docs',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      tenants: '/api/tenants'
    }
  });
});

// Mock endpoints for frontend compatibility
app.get('/api/tenants', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        name: 'Demo Store',
        domain: 'demo.wikistore.com',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ],
    pagination: { page: 1, limit: 10, total: 1 }
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        name: 'Sample Product',
        description: 'This is a sample product',
        price: 99.99,
        stock: 100,
        category: 'Electronics',
        brand: 'WikiStore',
        status: 'active'
      }
    ],
    pagination: { page: 1, limit: 10, total: 1 }
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        orderNumber: 'WS-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        total: 99.99,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ],
    pagination: { page: 1, limit: 10, total: 1 }
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'demo-jwt-token',
    user: {
      id: 1,
      email: req.body.email || 'demo@wikistore.com',
      name: 'Demo User',
      role: 'admin'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 2,
      email: req.body.email,
      name: req.body.name,
      role: 'merchant'
    }
  });
});

// Simple API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WikiStore API Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .method { color: #0066cc; font-weight: bold; }
        .path { color: #009900; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>WikiStore API Documentation</h1>
      <p>Multi-tenant e-commerce platform API</p>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/health</span>
        <p>Health check endpoint</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/info</span>
        <p>API information and available endpoints</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/tenants</span>
        <p>List tenants</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/products</span>
        <p>List products</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/orders</span>
        <p>List orders</p>
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/auth/login</span>
        <p>User authentication</p>
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/auth/register</span>
        <p>User registration</p>
      </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WikiStore API is running on: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});