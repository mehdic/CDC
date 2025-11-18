/**
 * Inventory Service (In-Memory Version for Batch 1 Tests)
 * Main Express server for inventory management
 *
 * Endpoints:
 * - POST /api/inventory - Add inventory item
 * - GET /api/inventory - List all inventory items
 * - GET /api/inventory/:id - Get inventory item by ID
 * - PATCH /api/inventory/:id/quantity - Update quantity
 * - DELETE /api/inventory/:id - Remove inventory item
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { inventoryRepository } from './repository/InventoryRepository';

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.INVENTORY_SERVICE_PORT || 4004;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Validation Functions
// ============================================================================

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
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
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/inventory - Add inventory item
 */
app.post('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { pharmacyId, productName, sku, quantity, minQuantity, maxQuantity, unitPrice, expirationDate } = req.body;

    // Validate required fields
    if (!pharmacyId || !productName || !sku || quantity === undefined || minQuantity === undefined || maxQuantity === undefined || unitPrice === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: pharmacyId, productName, sku, quantity, minQuantity, maxQuantity, unitPrice',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate quantity is a non-negative number
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be a non-negative number',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate minQuantity and maxQuantity
    if (typeof minQuantity !== 'number' || minQuantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'minQuantity must be a non-negative number',
        timestamp: new Date().toISOString(),
      });
    }

    if (typeof maxQuantity !== 'number' || maxQuantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'maxQuantity must be a non-negative number',
        timestamp: new Date().toISOString(),
      });
    }

    if (minQuantity >= maxQuantity) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'minQuantity must be less than maxQuantity',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate unitPrice is a positive number
    if (typeof unitPrice !== 'number' || unitPrice <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Unit price must be a positive number',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate expiration date format if provided
    if (expirationDate && !isValidDate(expirationDate)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid expiration date format',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Create new inventory item using repository
      const newItem = await inventoryRepository.create({
        pharmacyId,
        productName,
        sku,
        quantity,
        minQuantity,
        maxQuantity,
        unitPrice,
        expirationDate,
        status: 'in_stock', // Will be calculated by repository
      });

      console.log(`✅ Created inventory item: ${newItem.id} (${productName})`);

      return res.status(201).json({
        message: 'Inventory item created successfully',
        item: {
          ...newItem,
          createdAt: newItem.createdAt.toISOString(),
          updatedAt: newItem.updatedAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (repoError: any) {
      if (repoError.message === 'DUPLICATE_SKU') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Inventory item with this SKU already exists for this pharmacy',
          timestamp: new Date().toISOString(),
        });
      }
      throw repoError;
    }
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create inventory item',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/inventory - List all inventory items
 */
app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.query;

    // Fetch items using repository
    const items = await inventoryRepository.findAll(pharmacyId as string | undefined);

    // Convert dates to ISO strings
    const itemsWithISODates = items.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      count: itemsWithISODates.length,
      items: itemsWithISODates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory items',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/inventory/:id - Get inventory item by ID
 */
app.get('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await inventoryRepository.findById(id);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Inventory item with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      item: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory item',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/inventory/:id/quantity - Update quantity
 */
app.patch('/api/inventory/:id/quantity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    // Validate quantity is provided
    if (quantity === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: quantity',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate quantity is a non-negative number
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity must be a non-negative number',
        timestamp: new Date().toISOString(),
      });
    }

    const item = await inventoryRepository.updateQuantity(id, quantity);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Inventory item with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Updated inventory item ${id} quantity to ${quantity}`);

    return res.status(200).json({
      message: 'Inventory item quantity updated successfully',
      item: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating inventory item quantity:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update inventory item quantity',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/inventory/:id - Remove inventory item
 */
app.delete('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await inventoryRepository.delete(id);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Inventory item with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Deleted inventory item: ${id} (${item.productName})`);

    return res.status(200).json({
      message: 'Inventory item deleted successfully',
      item: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete inventory item',
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
      console.log(`🚀 Inventory Service running on port ${PORT}`);
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
