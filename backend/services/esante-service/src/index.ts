/**
 * e-Santé Service
 * Swiss healthcare system integration (EPD, HIN, XDS.b)
 * Main server entry point
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { HINAuthService } from './services/hin-auth.service';
import { EPDService } from './services/epd.service';
import { ConsentService } from './services/consent.service';
import { VaudAdapter } from './adapters/vaud.adapter';
import { GenevaAdapter } from './adapters/geneva.adapter';
import { ZurichAdapter } from './adapters/zurich.adapter';
import { createESanteRouter } from './routes/esante.routes';

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const hinAuthService = new HINAuthService();
const epdService = new EPDService();
const consentService = new ConsentService();

// Register cantonal adapters
const vaudAdapter = new VaudAdapter();
const genevaAdapter = new GenevaAdapter();
const zurichAdapter = new ZurichAdapter();

epdService.registerAdapter(vaudAdapter);
epdService.registerAdapter(genevaAdapter);
epdService.registerAdapter(zurichAdapter);

consentService.registerAdapter(vaudAdapter);
consentService.registerAdapter(genevaAdapter);
consentService.registerAdapter(zurichAdapter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'esante-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cantons: ['VD', 'GE', 'ZH'],
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'e-Santé Integration Service',
    description: 'Swiss healthcare system integration for EPD, HIN authentication, and XDS.b document sharing',
    version: '1.0.0',
    baseUrl: '/api/esante',
    features: [
      'HIN Healthcare Provider Authentication',
      'Electronic Patient Dossier (EPD) Integration',
      'Multi-Cantonal Support (Vaud, Geneva, Zurich)',
      'Patient Consent Management',
      'XDS.b Document Registry',
      'Secure Document Upload/Download',
    ],
    endpoints: {
      health: '/health',
      authentication: {
        hinAuthenticate: 'POST /api/esante/hin/authenticate',
      },
      documents: {
        listDocuments: 'GET /api/esante/epd/:patientId/documents',
        getDocument: 'GET /api/esante/epd/documents/:documentId',
        uploadDocument: 'POST /api/esante/epd/documents',
      },
      consent: {
        getConsent: 'GET /api/esante/consent/:patientId',
        updateConsent: 'PUT /api/esante/consent/:patientId',
        validateConsent: 'GET /api/esante/consent/:patientId/validate',
      },
      admin: {
        stats: 'GET /api/esante/stats',
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    statusCode: 500,
    service: 'esante-service',
  });
});

// Mount e-Santé routes
app.use('/api/esante', createESanteRouter(epdService, hinAuthService, consentService));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    // Setup periodic cleanup tasks
    setInterval(() => {
      hinAuthService.clearExpiredCache();
      consentService.cleanupExpiredConsents();
    }, 60 * 60 * 1000); // Run every hour

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ e-Santé Service running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API base URL: http://localhost:${PORT}/api/esante`);
      console.log(`   Root info: http://localhost:${PORT}/`);
      console.log(`\n📋 Supported Cantons:`);
      console.log(`   - Vaud (VD) - CARA Platform`);
      console.log(`   - Geneva (GE) - MonDossierMedical`);
      console.log(`   - Zurich (ZH) - EPD System`);
      console.log(`\n🔐 Authentication:`);
      console.log(`   - HIN-based healthcare provider authentication`);
      console.log(`   - JWT token-based API access`);
      console.log(`   - Role-based access control`);
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
