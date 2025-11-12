/**
 * Pharmacy Service
 * Port: 4006
 * Handles pharmacy profile management, pages, operating hours, delivery zones
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { User } from '../../../shared/models/User';
import pharmacyRoutes from './routes/pharmacyRoutes';

// Load environment variables
config();

const app: Application = express();
const PORT = process.env.PHARMACY_SERVICE_PORT || 4006;

// ============================================================================
// Database Connection
// ============================================================================

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'metapharm_user',
  password: process.env.DATABASE_PASSWORD || 'your_password',
  database: process.env.DATABASE_NAME || 'metapharm_connect',
  entities: [Pharmacy, User],
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Routes
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pharmacy-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/pharmacy', pharmacyRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database connection (optional for now - E2E tests use mocks)
    if (process.env.ENABLE_DATABASE !== 'false') {
      try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.warn('⚠️  Database connection failed, starting in mock mode');
        console.warn('   Error:', dbError instanceof Error ? dbError.message : dbError);
      }
    } else {
      console.log('ℹ️  Database disabled (ENABLE_DATABASE=false)');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Pharmacy Service started');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Pharmacy Service:', error);
    process.exit(1);
  }
}

startServer();

export { AppDataSource };
