import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import controlledRoutes from './routes/controlled.routes';
import { ControlledSubstance } from './entities/ControlledSubstance';
import { DispensationLog } from './entities/DispensationLog';
import { ControlledPrescription } from './entities/ControlledPrescription';
import { Alert } from './entities/Alert';

dotenv.config();

/**
 * Controlled Substance Service
 * Manages controlled substances and Swiss Swissmedic compliance
 */

const PORT = process.env.CONTROLLED_SERVICE_PORT || 3008;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'metapharm_controlled';

// Initialize TypeORM DataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    ControlledSubstance,
    DispensationLog,
    ControlledPrescription,
    Alert,
  ],
  migrations: [],
  subscribers: [],
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'controlled-substance-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/controlled', controlledRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
);

// Start server
async function startServer() {
  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Start listening
    app.listen(PORT, () => {
      console.log(
        `Controlled Substance Service listening on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await AppDataSource.destroy();
  process.exit(0);
});

// Start the server
startServer();

export default app;
