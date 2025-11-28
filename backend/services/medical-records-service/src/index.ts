/**
 * Medical Records Service
 * Main server entry point
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database';
import { createMedicalRecordsRouter } from './routes/medicalRecords';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'medical-records-service',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    statusCode: 500,
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    const dataSource = await initializeDatabase();

    // Mount medical records routes
    app.use('/api', createMedicalRecordsRouter(dataSource));

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Medical Records Service running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
