// Simple Express server for independent deployment
import http from 'http';
import url from 'url';

const PORT = process.env.PORT || 3001;

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Mock API responses
const mockResponses = {
  '/health': {
    status: 'ok',
    service: 'WikiStore API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  },
  '/api/auth/login': {
    success: true,
    token: 'demo-jwt-token',
    user: {
      id: 1,
      email: 'demo@wikistore.com',
      name: 'Demo User',
      role: 'admin'
    }
  },
  '/api/products': {
    data: [{
      id: 1,
      name: 'Sample Product',
      description: 'This is a sample product',
      price: 99.99,
      stock: 100,
      category: 'Electronics',
      brand: 'WikiStore',
      status: 'active'
    }],
    pagination: { page: 1, limit: 10, total: 1 }
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Handle POST requests
  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      if (path === '/api/auth/login') {
        const loginData = JSON.parse(body || '{}');
        const response = {
          ...mockResponses['/api/auth/login'],
          user: {
            ...mockResponses['/api/auth/login'].user,
            email: loginData.email || 'demo@wikistore.com'
          }
        };
        res.writeHead(200);
        res.end(JSON.stringify(response));
        return;
      }
    });
    return;
  }

  // Handle GET requests
  if (mockResponses[path]) {
    res.writeHead(200);
    res.end(JSON.stringify(mockResponses[path]));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Endpoint not found',
    path: path,
    method: method
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WikiStore API is running on: http://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});