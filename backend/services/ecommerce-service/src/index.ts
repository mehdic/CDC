/**
 * E-commerce Service
 * Product catalog, category management, and product reviews
 * T3-030: Product Catalog API Endpoints
 * T3-047 to T3-050: Product Reviews System
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'reflect-metadata';

import { initializeDatabase } from './config/database';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import reviewRoutes from './routes/reviews';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4006;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    service: 'E-commerce Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'MetaPharm Connect - E-commerce Service',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    endpoints: {
      products: '/products',
      categories: '/categories',
      health: '/health',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/', reviewRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    app.listen(PORT, () => {
      console.info('='.repeat(60));
      console.info('MetaPharm Connect - E-commerce Service');
      console.info('='.repeat(60));
      console.info(`Environment: ${NODE_ENV}`);
      console.info(`Port: ${PORT}`);
      console.info(`Service URL: http://localhost:${PORT}`);
      console.info('='.repeat(60));
      console.info('Endpoints:');
      console.info(`  GET  /products           - List products`);
      console.info(`  GET  /products/:id       - Get product details`);
      console.info(`  GET  /products/search    - Search products`);
      console.info(`  GET  /categories         - Get category tree`);
      console.info(`  GET  /categories/:id     - Get category details`);
      console.info(`  GET  /products/:id/reviews          - Get product reviews`);
      console.info(`  POST /products/:id/reviews          - Submit review`);
      console.info(`  PUT /reviews/:id                   - Update review`);
      console.info(`  DELETE /reviews/:id                - Delete review`);
      console.info(`  POST /reviews/:id/helpful          - Mark as helpful`);
      console.info(`  POST /reviews/:id/unhelpful        - Mark as unhelpful`);
      console.info('='.repeat(60));
      console.info('Health Check: http://localhost:' + PORT + '/health');
      console.info('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start E-commerce Service:', error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', () => {
  console.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// ============================================================================
// Start
// ============================================================================

if (require.main === module) {
  startServer();
}

export default app;
