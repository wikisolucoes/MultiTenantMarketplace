import http from 'http';
import url from 'url';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
    return;
  }
  
  // API routes
  if (path === '/api/auth/me') {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 1,
      email: 'admin@wikistore.com',
      role: 'admin',
      tenantId: 1
    }));
    return;
  }
  
  if (path === '/api/tenants') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 1,
        name: 'WikiStore Demo',
        subdomain: 'demo',
        status: 'active'
      }
    ]));
    return;
  }
  
  if (path === '/api/products') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 1,
        name: 'Produto Demo',
        price: 99.99,
        stock: 50,
        isActive: true
      }
    ]));
    return;
  }
  
  if (path === '/api/orders') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: 1,
        total: 199.99,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]));
    return;
  }
  
  // Default API response
  if (path.startsWith('/api/')) {
    res.writeHead(200);
    res.end(JSON.stringify({
      endpoint: path,
      method: req.method,
      available: true
    }));
    return;
  }
  
  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});