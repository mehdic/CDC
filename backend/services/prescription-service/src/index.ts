/**
 * Prescription Service - Main Entry Point
 * Handles prescription upload and AI-powered OCR transcription using AWS Textract
 * Port: 4002
 * Phase 3 - US1: Prescription Processing & Validation
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Prescription } from '../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../shared/models/PrescriptionItem';
import { TreatmentPlan } from '../../../shared/models/TreatmentPlan';
import prescriptionsRouter from './routes/prescriptions';
import transcribeRouter from './routes/transcribe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// Database Connection
// ============================================================================

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Prescription, PrescriptionItem, TreatmentPlan],
  synchronize: false, // Use migrations instead in production
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Initialize Database
// ============================================================================

dataSource
  .initialize()
  .then(() => {
    console.log('[Prescription Service] ✓ Database connected');
  })
  .catch((error) => {
    console.error('[Prescription Service] ✗ Database connection error:', error);
    process.exit(1);
  });

// Make dataSource available to routes
app.locals.dataSource = dataSource;

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'prescription-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Prescription routes
app.use('/prescriptions', prescriptionsRouter);
app.use('/prescriptions', transcribeRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ============================================================================
// Start Server
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`[Prescription Service] 🚀 Running on port ${PORT}`);
  console.log(`[Prescription Service] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Prescription Service] Health check: http://localhost:${PORT}/health`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('[Prescription Service] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Prescription Service] HTTP server closed');
  });
  await dataSource.destroy();
  console.log('[Prescription Service] Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Prescription Service] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[Prescription Service] HTTP server closed');
  });
  await dataSource.destroy();
  console.log('[Prescription Service] Database connection closed');
  process.exit(0);
});

export { app, dataSource };
