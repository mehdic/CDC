/**
 * Teleconsultation Service - Main Entry Point
 * Handles video consultation booking, Twilio Video integration, and AI transcription
 * Port: 4003
 * Phase 4 - US2: Secure Teleconsultation (FR-021 to FR-030)
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { Teleconsultation } from '../../../shared/models/Teleconsultation';
import { ConsultationNote } from '../../../shared/models/ConsultationNote';
import { Prescription } from '../../../shared/models/Prescription';
import { User } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { authenticateJWT } from '../../../shared/middleware/auth';
import { requirePermission, Permission } from '../../../shared/middleware/rbac';
import availabilityRouter from './routes/availability';
import bookRouter from './routes/book';
import joinRouter from './routes/join';
import notesRouter from './routes/notes';

const app = express();
const PORT = process.env.TELECONSULTATION_SERVICE_PORT || 4003;

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
  entities: [
    Teleconsultation,
    ConsultationNote,
    Prescription,
    User,
    Pharmacy,
    AuditTrailEntry,
  ],
  synchronize: false, // Use migrations instead in production
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// Initialize Database
// ============================================================================

dataSource
  .initialize()
  .then(() => {
    console.log('[Teleconsultation Service] ✓ Database connected');
  })
  .catch((error) => {
    console.error('[Teleconsultation Service] ✗ Database connection error:', error);
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
    service: 'teleconsultation-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Teleconsultation Routes with Authentication & Authorization
// ============================================================================
//
// Security Requirements (FR-006, FR-007, FR-112):
// - All teleconsultation endpoints require JWT authentication
// - RBAC enforced based on user role and permissions
// - Audit logging handled by auth middleware

// Availability checking - Requires authentication (patients)
app.use('/teleconsultations/availability', authenticateJWT as RequestHandler, availabilityRouter);

// Booking endpoint - Requires BOOK_CONSULTATION permission (patients)
app.use('/teleconsultations', authenticateJWT as RequestHandler, requirePermission(Permission.BOOK_CONSULTATION) as RequestHandler, bookRouter);

// Join video call - Requires authentication (patient or pharmacist)
app.use('/teleconsultations/:id/join', authenticateJWT as RequestHandler, joinRouter);

// Consultation notes - Requires CONDUCT_CONSULTATION permission (pharmacists)
app.use('/teleconsultations/:id/notes', authenticateJWT as RequestHandler, requirePermission(Permission.CONDUCT_CONSULTATION) as RequestHandler, notesRouter);

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
  console.log(`[Teleconsultation Service] 🚀 Running on port ${PORT}`);
  console.log(`[Teleconsultation Service] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Teleconsultation Service] Health check: http://localhost:${PORT}/health`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('[Teleconsultation Service] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Teleconsultation Service] HTTP server closed');
  });
  await dataSource.destroy();
  console.log('[Teleconsultation Service] Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Teleconsultation Service] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[Teleconsultation Service] HTTP server closed');
  });
  await dataSource.destroy();
  console.log('[Teleconsultation Service] Database connection closed');
  process.exit(0);
});

export { app, dataSource };
