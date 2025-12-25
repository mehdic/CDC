/**
 * Risk Prediction Service
 * Main application entry point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createRiskRoutes } from './routes/risk.routes';

const app = express();
const PORT = process.env.PORT ?? 3012;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'risk-prediction-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/risk-prediction', createRiskRoutes());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Risk Prediction Service listening on port ${PORT}`);
  });
}

export { app };
