/**
 * Integration Tests for Inventory Service
 * Tests all REST API endpoints with in-memory storage
 */

import request from 'supertest';
import app from '../src/index';

describe('Inventory Service - Integration Tests', () => {

  // Test data
  const validInventoryItem = {
    pharmacyId: 'PHR-001',
    productName: 'Aspirin 500mg',
    sku: 'ASP-500-001',
    quantity: 100,
    minQuantity: 10,
    maxQuantity: 500,
    unitPrice: 12.50,
    expirationDate: '2026-12-31',
  };

  const lowStockItem = {
    pharmacyId: 'PHR-001',
    productName: 'Ibuprofen 200mg',
    sku: 'IBU-200-001',
    quantity: 5,
    minQuantity: 10,
    maxQuantity: 500,
    unitPrice: 8.99,
    expirationDate: '2026-06-30',
  };

  const outOfStockItem = {
    pharmacyId: 'PHR-002',
    productName: 'Paracetamol 1000mg',
    sku: 'PAR-1000-001',
    quantity: 0,
    minQuantity: 10,
    maxQuantity: 500,
    unitPrice: 15.00,
    expirationDate: '2026-09-15',
  };

  // ============================================================================
  // Health Check Tests
  // ============================================================================

  describe('GET /health', () => {
    it('should return health status 200', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'inventory-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  // ============================================================================
  // POST /api/inventory - Create Inventory Item Tests
  // ============================================================================

  describe('POST /api/inventory', () => {
    it('should create inventory item with valid data (201)', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send(validInventoryItem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Inventory item created successfully');
      expect(response.body).toHaveProperty('item');
      expect(response.body.item).toMatchObject({
        pharmacyId: validInventoryItem.pharmacyId,
        productName: validInventoryItem.productName,
        sku: validInventoryItem.sku,
        quantity: validInventoryItem.quantity,
        minQuantity: validInventoryItem.minQuantity,
        maxQuantity: validInventoryItem.maxQuantity,
        unitPrice: validInventoryItem.unitPrice,
        expirationDate: validInventoryItem.expirationDate,
        status: 'in_stock',
      });
      expect(response.body.item).toHaveProperty('id');
      expect(response.body.item).toHaveProperty('createdAt');
      expect(response.body.item).toHaveProperty('updatedAt');
    });

    it('should create low stock item with quantity < 10', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send(lowStockItem);

      expect(response.status).toBe(201);
      expect(response.body.item.status).toBe('low_stock');
      expect(response.body.item.quantity).toBe(5);
    });

    it('should create out of stock item with quantity = 0', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send(outOfStockItem);

      expect(response.status).toBe(201);
      expect(response.body.item.status).toBe('out_of_stock');
      expect(response.body.item.quantity).toBe(0);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          pharmacyId: 'PHR-001',
          productName: 'Aspirin',
          // Missing sku, quantity, minQuantity, maxQuantity, unitPrice
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UNIQUE-SKU-001',
          quantity: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Quantity must be a non-negative number');
    });

    it('should return 400 for invalid unitPrice (zero or negative)', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UNIQUE-SKU-002',
          unitPrice: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Unit price must be a positive number');
    });

    it('should return 400 for invalid expiration date format', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UNIQUE-SKU-003',
          expirationDate: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Invalid expiration date format');
    });

    it('should return 409 for duplicate SKU in same pharmacy', async () => {
      // Create first item
      await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'DUPLICATE-SKU-001',
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'DUPLICATE-SKU-001',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Conflict');
      expect(response.body.message).toContain('already exists for this pharmacy');
    });
  });

  // ============================================================================
  // GET /api/inventory - List Inventory Items Tests
  // ============================================================================

  describe('GET /api/inventory', () => {
    it('should return all inventory items (200)', async () => {
      // Create test items
      await request(app).post('/api/inventory').send({
        ...validInventoryItem,
        sku: 'LIST-TEST-001',
      });
      await request(app).post('/api/inventory').send({
        ...validInventoryItem,
        sku: 'LIST-TEST-002',
      });

      const response = await request(app).get('/api/inventory');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });

    it('should filter inventory items by pharmacyId', async () => {
      // Create items for different pharmacies
      await request(app).post('/api/inventory').send({
        ...validInventoryItem,
        pharmacyId: 'PHR-FILTER-001',
        sku: 'FILTER-TEST-001',
      });
      await request(app).post('/api/inventory').send({
        ...validInventoryItem,
        pharmacyId: 'PHR-FILTER-002',
        sku: 'FILTER-TEST-002',
      });

      const response = await request(app).get('/api/inventory?pharmacyId=PHR-FILTER-001');

      expect(response.status).toBe(200);
      expect(response.body.items.every((item: any) => item.pharmacyId === 'PHR-FILTER-001')).toBe(true);
    });
  });

  // ============================================================================
  // GET /api/inventory/:id - Get Inventory Item by ID Tests
  // ============================================================================

  describe('GET /api/inventory/:id', () => {
    it('should return inventory item by ID (200)', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'GET-BY-ID-001',
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app).get(`/api/inventory/${itemId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.id).toBe(itemId);
      expect(response.body.item.sku).toBe('GET-BY-ID-001');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app).get('/api/inventory/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // PATCH /api/inventory/:id/quantity - Update Quantity Tests
  // ============================================================================

  describe('PATCH /api/inventory/:id/quantity', () => {
    it('should update inventory item quantity (200)', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UPDATE-QTY-001',
          quantity: 50,
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({ quantity: 150 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Inventory item quantity updated successfully');
      expect(response.body.item.quantity).toBe(150);
      expect(response.body.item.status).toBe('in_stock');
    });

    it('should update status to low_stock when quantity < 10', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UPDATE-QTY-002',
          quantity: 50,
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(5);
      expect(response.body.item.status).toBe('low_stock');
    });

    it('should update status to out_of_stock when quantity = 0', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UPDATE-QTY-003',
          quantity: 50,
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({ quantity: 0 });

      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(0);
      expect(response.body.item.status).toBe('out_of_stock');
    });

    it('should return 400 for missing quantity field', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UPDATE-QTY-004',
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required field: quantity');
    });

    it('should return 400 for negative quantity', async () => {
      // Create test item
      const createResponse = await request(app)
        .post('/api/inventory')
        .send({
          ...validInventoryItem,
          sku: 'UPDATE-QTY-005',
        });

      const itemId = createResponse.body.item.id;

      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({ quantity: -10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Quantity must be a non-negative number');
    });

    it('should return 404 for non-existent item ID', async () => {
      const response = await request(app)
        .patch('/api/inventory/99999/quantity')
        .send({ quantity: 100 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // 404 Handler Tests
  // ============================================================================

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('not found');
    });
  });
});
