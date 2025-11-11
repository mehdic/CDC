import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 4000;

// CORS configuration - MUST come before proxies
app.use(cors({
  origin: true,  // Allow all origins temporarily for testing
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Proxy routes using http-proxy-middleware (handles body parsing correctly)
// By default, the matched path is stripped. We need to preserve it.
// Solution: Use pathFilter to match, but proxy to the full path
app.use(createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true,
  logLevel: 'debug',
  pathFilter: '/auth/**'  // Match /auth/* but don't strip it
}));

app.use(createProxyMiddleware({
  target: 'http://localhost:4002',
  changeOrigin: true,
  logLevel: 'debug',
  pathFilter: '/prescriptions/**'
}));

app.use(createProxyMiddleware({
  target: 'http://localhost:4003',
  changeOrigin: true,
  logLevel: 'debug',
  pathFilter: '/teleconsultations/**'
}));

app.use(createProxyMiddleware({
  target: 'http://localhost:4004',
  changeOrigin: true,
  logLevel: 'debug',
  pathFilter: '/inventory/**'
}));

app.use(createProxyMiddleware({
  target: 'http://localhost:4005',
  changeOrigin: true,
  logLevel: 'debug',
  pathFilter: '/notifications/**'
}));

// Return 404 for unmatched routes
app.use((req, res) => {
  console.log(`No proxy match for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Simple Gateway running on port ${PORT}`);
  console.log(`CORS enabled for all origins (testing mode)`);
  console.log('Service routing:');
  console.log('  /auth/* -> :4001');
  console.log('  /prescriptions/* -> :4002');
  console.log('  /teleconsultations/* -> :4003');
  console.log('  /inventory/* -> :4004');
  console.log('  /notifications/* -> :4005');
});