/**
 * Pharmacy Service (In-Memory Version for Phase 2)
 * Main Express server for pharmacy management
 *
 * Endpoints:
 * - POST /api/pharmacies - Create new pharmacy
 * - GET /api/pharmacies - List all pharmacies
 * - GET /api/pharmacies/:id - Get pharmacy by ID
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PHARMACY_SERVICE_PORT || 4008;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Data Models
// ============================================================================

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// In-memory storage
const pharmacies = new Map<string, Pharmacy>();
let nextId = 1;

// ============================================================================
// Validation Functions
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation (allows various formats)
  const phoneRegex = /^\+?[\d\s\-().]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
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
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pharmacy-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/pharmacies - Create new pharmacy
 */
app.post('/api/pharmacies', (req: Request, res: Response) => {
  try {
    const { name, address, phone, email } = req.body;

    // Validate required fields
    if (!name || !address || !phone || !email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: name, address, phone, email',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid phone format',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if pharmacy with email already exists
    const existingPharmacy = Array.from(pharmacies.values()).find(p => p.email === email);
    if (existingPharmacy) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Pharmacy with this email already exists',
        timestamp: new Date().toISOString(),
      });
    }

    // Create new pharmacy
    const pharmacyId = String(nextId++);
    const now = new Date().toISOString();

    const newPharmacy: Pharmacy = {
      id: pharmacyId,
      name,
      address,
      phone,
      email,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    pharmacies.set(pharmacyId, newPharmacy);

    console.log(`✅ Created pharmacy: ${pharmacyId} (${name})`);

    return res.status(201).json({
      message: 'Pharmacy created successfully',
      pharmacy: newPharmacy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating pharmacy:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create pharmacy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/pharmacies - List all pharmacies
 */
app.get('/api/pharmacies', (_req: Request, res: Response) => {
  try {
    const allPharmacies = Array.from(pharmacies.values());

    return res.status(200).json({
      count: allPharmacies.length,
      pharmacies: allPharmacies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pharmacies',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/pharmacies/:id - Get pharmacy by ID
 */
app.get('/api/pharmacies/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pharmacy = pharmacies.get(id);

    if (!pharmacy) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Pharmacy with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      pharmacy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pharmacy',
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
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Pharmacy Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(() => {
        console.log('✅ HTTP server closed');
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

// Export app for testing
export default app;
