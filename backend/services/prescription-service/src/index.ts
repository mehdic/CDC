/**
 * Prescription Service - Main Entry Point
 * Handles prescription upload and AI-powered OCR transcription using AWS Textract
 * Port: 4002
 * Phase 3 - US1: Prescription Processing & Validation
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { Prescription } from '../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../shared/models/PrescriptionItem';
import { TreatmentPlan } from '../../../shared/models/TreatmentPlan';
import { User } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { authenticateJWT } from '../../../shared/middleware/auth';
import { requirePermission, Permission } from '../../../shared/middleware/rbac';
import prescriptionsRouter from './routes/prescriptions';
import transcribeRouter from './routes/transcribe';
import validateRouter from './routes/validate';
import approveRouter from './routes/approve';
import rejectRouter from './routes/reject';
import listRouter from './routes/list';

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
  entities: [Prescription, PrescriptionItem, TreatmentPlan, User, Pharmacy, AuditTrailEntry],
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

// ============================================================================
// Prescription Routes with Authentication & Authorization
// ============================================================================
//
// Security Requirements (FR-006, FR-007, FR-112):
// - All prescription endpoints require JWT authentication
// - RBAC enforced based on user role and permissions
// - Audit logging handled by auth middleware

// List prescriptions - Requires authentication (filtering by role in controller)
app.use('/prescriptions', authenticateJWT as RequestHandler, listRouter);

// Upload prescription - Requires UPLOAD_PRESCRIPTION permission (patients)
app.use('/prescriptions', authenticateJWT as RequestHandler, requirePermission(Permission.UPLOAD_PRESCRIPTION) as RequestHandler, prescriptionsRouter);

// Transcribe prescription - Requires REVIEW_PRESCRIPTION permission (pharmacists)
app.use('/prescriptions/:id/transcribe', authenticateJWT as RequestHandler, requirePermission(Permission.REVIEW_PRESCRIPTION) as RequestHandler, transcribeRouter);

// Validate prescription - Requires REVIEW_PRESCRIPTION permission (pharmacists)
app.use('/prescriptions/:id/validate', authenticateJWT as RequestHandler, requirePermission(Permission.REVIEW_PRESCRIPTION) as RequestHandler, validateRouter);

// Approve prescription - Requires APPROVE_PRESCRIPTION permission (pharmacists only)
app.use('/prescriptions/:id/approve', authenticateJWT as RequestHandler, requirePermission(Permission.APPROVE_PRESCRIPTION) as RequestHandler, approveRouter);

// Reject prescription - Requires APPROVE_PRESCRIPTION permission (pharmacists only)
app.use('/prescriptions/:id/reject', authenticateJWT as RequestHandler, requirePermission(Permission.APPROVE_PRESCRIPTION) as RequestHandler, rejectRouter);

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
