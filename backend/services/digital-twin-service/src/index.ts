/**
 * Digital Twin Service - Main Entry Point
 * Microservice for AI-powered patient health profiles and predictive analytics
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { DigitalTwinProfile } from './models/DigitalTwinProfile';
import digitalTwinRoutes from './routes/digitalTwin.routes';

// TypeORM DataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm_digital_twin',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [DigitalTwinProfile],
  migrations: [],
  subscribers: [],
});

// Express app
export const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'digital-twin-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/digital-twin', digitalTwinRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: () => void) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('[Database] Connected to PostgreSQL');

    const PORT = process.env.PORT || 3009;
    app.listen(PORT, () => {
      console.log(`[Server] Digital Twin Service running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Only start if not imported for testing
if (require.main === module) {
  startServer();
}
