// Simple proxy to NestJS backend for development
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Proxy API calls to NestJS backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  logLevel: 'debug'
}));

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