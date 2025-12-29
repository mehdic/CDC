/**
 * Inventory Service
 * Real-Time Inventory Management with QR Traceability and AI Forecasting
 *
 * Features:
 * - QR code scanning for stock updates (GS1 DataMatrix format)
 * - Real-time inventory tracking with multi-tenant isolation
 * - AI-powered low stock and expiration alerts
 * - AWS Forecast integration for demand prediction
 * - Controlled substance tracking with enhanced audit trails
 *
 * Port: 4004
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { InventoryItem } from '../../../shared/models/InventoryItem';
import { InventoryTransaction } from '../../../shared/models/InventoryTransaction';
import { InventoryAlert } from '../../../shared/models/InventoryAlert';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { User } from '../../../shared/models/User';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { Cart } from '../../../shared/models/Cart';
import { CartItem } from '../../../shared/models/CartItem';

// Routes
import { scanRouter } from './routes/scan';
import { itemsRouter } from './routes/items';
import { alertsRouter } from './routes/alerts';
import { analyticsRouter } from './routes/analytics';
import { predictionRouter } from './routes/predictionRoutes';

// Workers
import { startAlertWorkers } from './workers/alertWorker';

// Load environment variables
dotenv.config();

const PORT = process.env.INVENTORY_SERVICE_PORT || 4004;
const app: Application = express();

// ============================================================================
// Middleware
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Database Connection
// ============================================================================

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  entities: [InventoryItem, InventoryTransaction, InventoryAlert, Pharmacy, User, AuditTrailEntry, Cart, CartItem],
  synchronize: false, // Use migrations instead
  logging: process.env.NODE_ENV === 'development',
});

// ============================================================================
// In-Memory Store for Testing
// ============================================================================

interface InventoryItemSimple {
  id: string;
  pharmacyId: string;
  productName: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitPrice: number;
  expirationDate?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  createdAt?: string;
  updatedAt?: string;
}

const inMemoryInventory: Map<string, InventoryItemSimple> = new Map();
let itemIdCounter = 1;

function calculateStatus(item: Omit<InventoryItemSimple, 'id' | 'status'>): InventoryItemSimple['status'] {
  if (item.expirationDate && new Date(item.expirationDate) < new Date()) {
    return 'expired';
  }
  if (item.quantity === 0) {
    return 'out_of_stock';
  }
  if (item.quantity < item.minQuantity) {
    return 'low_stock';
  }
  return 'in_stock';
}

// ============================================================================
// Routes
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// Test-Compatible Simple Inventory Routes
// ============================================================================

app.post('/api/inventory', (req: Request, res: Response) => {
  try {
    const { pharmacyId, productName, sku, quantity, minQuantity, maxQuantity, unitPrice, expirationDate } = req.body;

    // Validation - check for missing required fields first
    const missingFields = [];
    if (!pharmacyId) missingFields.push('pharmacyId');
    if (!productName) missingFields.push('productName');
    if (!sku) missingFields.push('sku');
    if (quantity === undefined) missingFields.push('quantity');
    if (minQuantity === undefined) missingFields.push('minQuantity');
    if (maxQuantity === undefined) missingFields.push('maxQuantity');
    if (unitPrice === undefined) missingFields.push('unitPrice');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate quantity is non-negative
    if (quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quantity must be a non-negative number'
      });
    }

    // Validate minQuantity < maxQuantity
    if (minQuantity >= maxQuantity) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'minQuantity must be less than maxQuantity'
      });
    }

    // Validate unitPrice is positive
    if (unitPrice <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'unitPrice must be a positive number'
      });
    }

    // Check for duplicate SKU for same pharmacy
    for (const [, item] of inMemoryInventory) {
      if (item.pharmacyId === pharmacyId && item.sku === sku) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'SKU already exists for this pharmacy'
        });
      }
    }

    const id = `item-${itemIdCounter++}`;
    const now = new Date().toISOString();
    const itemData = { pharmacyId, productName, sku, quantity, minQuantity, maxQuantity, unitPrice, expirationDate };
    const status = calculateStatus(itemData);
    const newItem: InventoryItemSimple = { id, ...itemData, status, createdAt: now, updatedAt: now };

    inMemoryInventory.set(id, newItem);

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.query;

    let items = Array.from(inMemoryInventory.values());

    if (pharmacyId) {
      items = items.filter(item => item.pharmacyId === pharmacyId);
    }

    res.json({
      count: items.length,
      items,
      pagination: {
        total: items.length,
        limit: items.length,
        offset: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = inMemoryInventory.get(id);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item not found'
      });
    }

    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/inventory/:id/quantity', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: quantity'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quantity must be a non-negative number'
      });
    }

    const item = inMemoryInventory.get(id);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item not found'
      });
    }

    item.quantity = quantity;
    item.status = calculateStatus(item);
    item.updatedAt = new Date().toISOString();

    inMemoryInventory.set(id, item);

    res.json({
      message: 'Inventory quantity updated successfully',
      item,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/inventory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = inMemoryInventory.get(id);

    if (!item) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory item not found'
      });
    }

    inMemoryInventory.delete(id);

    res.json({
      message: 'Inventory item deleted successfully',
      item,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Production Routes (Postgres-backed)
// ============================================================================

app.use('/inventory/scan', scanRouter);
app.use('/inventory/items', itemsRouter);
app.use('/inventory/alerts', alertsRouter);
app.use('/inventory/analytics', analyticsRouter);
app.use('/inventory', predictionRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler for unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Start background workers for alerts
    startAlertWorkers();
    console.log('✅ Alert workers started');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Inventory Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Inventory Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await AppDataSource.destroy();
  process.exit(0);
});

// Start the service
if (require.main === module) {
  startServer();
}

export default app;
