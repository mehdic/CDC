/**
 * Adherence Service
 * Main Express server for medication adherence tracking
 *
 * Endpoints:
 * - GET /api/adherence/patient/:id - Get patient adherence summary
 * - GET /api/adherence/patient/:id/medication/:medId - Get specific medication adherence
 * - GET /api/adherence/patient/:id/history - Get adherence history
 * - GET /api/adherence/alerts/patient/:id - Get patient alerts
 * - GET /api/adherence/doctor/patients/poor-adherence - Get patients with poor adherence
 * - POST /api/adherence/dispensation - Record medication dispensation
 * - PATCH /api/adherence/alerts/:alertId/resolve - Resolve alert
 * - GET /health - Health check
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import adherenceRoutes from './routes/adherence.routes';

// Configuration
const PORT = process.env.ADHERENCE_SERVICE_PORT || 4010;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// Create Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'adherence-service',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API routes
app.use('/api/adherence', adherenceRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   MetaPharm Connect - Adherence Service                  ║
║                                                           ║
║   Status: RUNNING                                         ║
║   Port: ${PORT}                                            ║
║   Environment: ${NODE_ENV}                                 ║
║   Time: ${new Date().toLocaleString()}                     ║
║                                                           ║
║   API Endpoints:                                          ║
║   - GET  /health                                          ║
║   - GET  /api/adherence/patient/:id                       ║
║   - GET  /api/adherence/patient/:id/medication/:medId     ║
║   - GET  /api/adherence/patient/:id/history               ║
║   - GET  /api/adherence/alerts/patient/:id                ║
║   - GET  /api/adherence/doctor/patients/poor-adherence    ║
║   - POST /api/adherence/dispensation                      ║
║   - PATCH /api/adherence/alerts/:alertId/resolve          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
