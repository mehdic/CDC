/**
 * Prescription Service (Database Version)
 * Main Express server for prescription management
 *
 * Endpoints:
 * - POST /api/prescriptions - Create new prescription
 * - GET /api/prescriptions - List all prescriptions
 * - GET /api/prescriptions/:id - Get prescription by ID
 * - PATCH /api/prescriptions/:id/status - Update prescription status
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/database';
import { PrescriptionRepository } from './repository/PrescriptionRepository';
import { PrescriptionStatus } from './models/Prescription';

// Import route modules (with validation)
import prescriptionRoutes from './routes/prescriptions';
import listRoutes from './routes/list';
import approveRoutes from './routes/approve';
import rejectRoutes from './routes/reject';
import transcribeRoutes from './routes/transcribe';
import validateRoutes from './routes/validate';
import clarificationRoutes from './routes/clarification';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PRESCRIPTION_SERVICE_PORT || 4003;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Data Models (for API validation)
// ============================================================================

interface MedicationDTO {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidStatus(status: string): status is PrescriptionStatus {
  return ['pending', 'dispensed', 'cancelled'].includes(status);
}

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Only pending prescriptions can transition to dispensed or cancelled
  if (currentStatus === 'pending') {
    return newStatus === 'dispensed' || newStatus === 'cancelled';
  }
  // Dispensed and cancelled are terminal states
  return false;
}

function validateMedications(medications: any): medications is MedicationDTO[] {
  if (!Array.isArray(medications) || medications.length === 0) {
    return false;
  }

  return medications.every(med =>
    med &&
    typeof med.name === 'string' && med.name.trim() !== '' &&
    typeof med.dosage === 'string' && med.dosage.trim() !== '' &&
    typeof med.quantity === 'number' && med.quantity > 0 &&
    typeof med.instructions === 'string' && med.instructions.trim() !== ''
  );
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Repository Initialization
// ============================================================================

let prescriptionRepository: PrescriptionRepository;

// Initialize repository for tests (will be overridden in startServer for production)
if (NODE_ENV === 'test') {
  // In test mode, create a dummy DataSource that will be mocked by jest
  prescriptionRepository = new PrescriptionRepository(AppDataSource);
  // Make dataSource available to controllers in test mode
  app.locals.dataSource = AppDataSource;
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = AppDataSource.isInitialized;

    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      service: 'prescription-service',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'prescription-service',
      database: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
});

// ============================================================================
// Mount Routes with Validation
// ============================================================================

// Note: These routes use class-validator DTOs and validation middleware
app.use('/prescriptions', prescriptionRoutes);      // POST /prescriptions (upload)
app.use('/prescriptions', listRoutes);              // GET /prescriptions (list)
app.use('/prescriptions', approveRoutes);           // PUT /prescriptions/:id/approve
app.use('/prescriptions', rejectRoutes);            // PUT /prescriptions/:id/reject
app.use('/prescriptions', transcribeRoutes);        // POST /prescriptions/:id/transcribe
app.use('/prescriptions', validateRoutes);          // POST /prescriptions/:id/validate
app.use('/prescriptions', clarificationRoutes);     // POST /prescriptions/:id/request-clarification

// ============================================================================
// Legacy API Routes (for backward compatibility)
// ============================================================================

/**
 * POST /api/prescriptions - Create new prescription
 */
app.post('/api/prescriptions', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, pharmacyId, medications } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !pharmacyId || !medications) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: patientId, doctorId, pharmacyId, medications',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate medications array
    if (!validateMedications(medications)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid medications array. Must be non-empty array with valid medication objects (name, dosage, quantity, instructions)',
        timestamp: new Date().toISOString(),
      });
    }

    // Create prescription using repository
    const prescription = await prescriptionRepository.create({
      patientId,
      doctorId,
      pharmacyId,
      medications,
    });

    console.log(`✅ Created prescription: ${prescription.id} (${medications.length} medication(s))`);

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
        dispensedAt: prescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create prescription',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/prescriptions - List all prescriptions
 */
app.get('/api/prescriptions', async (_req: Request, res: Response) => {
  try {
    const prescriptions = await prescriptionRepository.findAll();

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions: prescriptions.map(p => ({
        id: p.id,
        patientId: p.patientId,
        doctorId: p.doctorId,
        pharmacyId: p.pharmacyId,
        medications: p.medications,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        dispensedAt: p.dispensedAt?.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch prescriptions',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/prescriptions/:id - Get prescription by ID
 */
app.get('/api/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionRepository.findById(id);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Prescription with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
        dispensedAt: prescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch prescription',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/prescriptions/:id/status - Update prescription status
 */
app.patch('/api/prescriptions/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status field
    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: status',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status value
    if (!isValidStatus(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status. Must be one of: pending, dispensed, cancelled',
        timestamp: new Date().toISOString(),
      });
    }

    const prescription = await prescriptionRepository.findById(id);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Prescription with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(prescription.status, status)) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Invalid status transition from ${prescription.status} to ${status}. Only pending prescriptions can be dispensed or cancelled.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update prescription status
    const updatedPrescription = await prescriptionRepository.updateStatus(id, status);

    if (!updatedPrescription) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update prescription status',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Updated prescription status: ${id} -> ${status}`);

    return res.status(200).json({
      message: 'Prescription status updated successfully',
      prescription: {
        id: updatedPrescription.id,
        patientId: updatedPrescription.patientId,
        doctorId: updatedPrescription.doctorId,
        pharmacyId: updatedPrescription.pharmacyId,
        medications: updatedPrescription.medications,
        status: updatedPrescription.status,
        createdAt: updatedPrescription.createdAt.toISOString(),
        updatedAt: updatedPrescription.updatedAt.toISOString(),
        dispensedAt: updatedPrescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update prescription status',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(500).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  try {
    // Initialize database connection
    const dataSource = await initializeDatabase();

    // Initialize repository
    prescriptionRepository = new PrescriptionRepository(dataSource);

    // Make dataSource available to controllers via app.locals
    app.locals.dataSource = dataSource;

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Prescription Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

// Export app and repository for testing
export default app;
export { prescriptionRepository, initializeDatabase, closeDatabase };
