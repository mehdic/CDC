/**
 * Unit Tests for Inventory Service
 * Tests all endpoints with comprehensive coverage
 */

import request from 'supertest';
import app from '../src/index';

describe('Inventory Service - Unit Tests', () => {
  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'inventory-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('POST /api/inventory', () => {
    it('should create a new inventory item with all required fields', async () => {
      const newItem = {
        pharmacyId: 'pharmacy-1',
        productName: 'Aspirin 500mg',
        sku: 'ASP-500',
        quantity: 100,
        minQuantity: 20,
        maxQuantity: 500,
        unitPrice: 5.99,
        expirationDate: '2025-12-31',
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Inventory item created successfully');
      expect(response.body.item).toMatchObject({
        pharmacyId: 'pharmacy-1',
        productName: 'Aspirin 500mg',
        sku: 'ASP-500',
        quantity: 100,
        minQuantity: 20,
        maxQuantity: 500,
        unitPrice: 5.99,
        expirationDate: '2025-12-31',
        status: 'in_stock',
      });
      expect(response.body.item).toHaveProperty('id');
      expect(response.body.item).toHaveProperty('createdAt');
      expect(response.body.item).toHaveProperty('updatedAt');
    });

    it('should calculate low_stock status when quantity < minQuantity', async () => {
      const newItem = {
        pharmacyId: 'pharmacy-2',
        productName: 'Ibuprofen 200mg',
        sku: 'IBU-200',
        quantity: 15,
        minQuantity: 20,
        maxQuantity: 500,
        unitPrice: 4.99,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.item.status).toBe('low_stock');
    });

    it('should calculate out_of_stock status when quantity is 0', async () => {
      const newItem = {
        pharmacyId: 'pharmacy-3',
        productName: 'Paracetamol 1000mg',
        sku: 'PAR-1000',
        quantity: 0,
        minQuantity: 10,
        maxQuantity: 300,
        unitPrice: 3.99,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.item.status).toBe('out_of_stock');
    });

    it('should calculate expired status when expirationDate is past', async () => {
      const newItem = {
        pharmacyId: 'pharmacy-4',
        productName: 'Expired Medicine',
        sku: 'EXP-001',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 200,
        unitPrice: 2.99,
        expirationDate: '2020-01-01',
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.item.status).toBe('expired');
    });

    it('should return 400 when missing required fields', async () => {
      const invalidItem = {
        pharmacyId: 'pharmacy-1',
        productName: 'Incomplete Item',
        // Missing sku, quantity, minQuantity, maxQuantity, unitPrice
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 when quantity is negative', async () => {
      const invalidItem = {
        pharmacyId: 'pharmacy-1',
        productName: 'Invalid Quantity',
        sku: 'INV-QTY',
        quantity: -5,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 5.99,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('non-negative number');
    });

    it('should return 400 when minQuantity >= maxQuantity', async () => {
      const invalidItem = {
        pharmacyId: 'pharmacy-1',
        productName: 'Invalid Range',
        sku: 'INV-RNG',
        quantity: 50,
        minQuantity: 100,
        maxQuantity: 50,
        unitPrice: 5.99,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('minQuantity must be less than maxQuantity');
    });

    it('should return 400 when unitPrice is not positive', async () => {
      const invalidItem = {
        pharmacyId: 'pharmacy-1',
        productName: 'Zero Price',
        sku: 'ZERO-PRC',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 0,
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('positive number');
    });

    it('should return 409 when SKU already exists for the same pharmacy', async () => {
      const item = {
        pharmacyId: 'pharmacy-dup',
        productName: 'Duplicate SKU',
        sku: 'DUP-SKU',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 5.99,
      };

      // Create first item
      await request(app).post('/api/inventory').send(item);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/inventory')
        .send(item);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Conflict');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      const response = await request(app).get('/api/inventory');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should filter items by pharmacyId', async () => {
      // Create item for specific pharmacy
      const item = {
        pharmacyId: 'pharmacy-filter',
        productName: 'Filter Test',
        sku: 'FILTER-001',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 5.99,
      };
      await request(app).post('/api/inventory').send(item);

      const response = await request(app)
        .get('/api/inventory')
        .query({ pharmacyId: 'pharmacy-filter' });

      expect(response.status).toBe(200);
      expect(response.body.items.every((i: any) => i.pharmacyId === 'pharmacy-filter')).toBe(true);
    });
  });

  describe('GET /api/inventory/:id', () => {
    it('should return a specific inventory item by ID', async () => {
      // Create an item first
      const newItem = {
        pharmacyId: 'pharmacy-get',
        productName: 'Get Test',
        sku: 'GET-001',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 5.99,
      };
      const createResponse = await request(app)
        .post('/api/inventory')
        .send(newItem);

      const itemId = createResponse.body.item.id;

      const response = await request(app).get(`/api/inventory/${itemId}`);

      expect(response.status).toBe(200);
      expect(response.body.item).toHaveProperty('id', itemId);
      expect(response.body.item.productName).toBe('Get Test');
    });

    it('should return 404 when item not found', async () => {
      const response = await request(app).get('/api/inventory/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('PATCH /api/inventory/:id/quantity', () => {
    it('should update item quantity and recalculate status', async () => {
      // Create an item
      const newItem = {
        pharmacyId: 'pharmacy-patch',
        productName: 'Patch Test',
        sku: 'PATCH-001',
        quantity: 100,
        minQuantity: 20,
        maxQuantity: 500,
        unitPrice: 5.99,
      };
      const createResponse = await request(app)
        .post('/api/inventory')
        .send(newItem);

      const itemId = createResponse.body.item.id;

      // Update quantity to low stock level
      const response = await request(app)
        .patch(`/api/inventory/${itemId}/quantity`)
        .send({ quantity: 15 });

      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(15);
      expect(response.body.item.status).toBe('low_stock');
    });

    it('should return 400 when quantity is missing', async () => {
      const response = await request(app)
        .patch('/api/inventory/some-id/quantity')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required field: quantity');
    });

    it('should return 400 when quantity is negative', async () => {
      const response = await request(app)
        .patch('/api/inventory/some-id/quantity')
        .send({ quantity: -10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 404 when item not found', async () => {
      const response = await request(app)
        .patch('/api/inventory/nonexistent-id/quantity')
        .send({ quantity: 50 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('should delete an inventory item', async () => {
      // Create an item
      const newItem = {
        pharmacyId: 'pharmacy-delete',
        productName: 'Delete Test',
        sku: 'DEL-001',
        quantity: 50,
        minQuantity: 10,
        maxQuantity: 100,
        unitPrice: 5.99,
      };
      const createResponse = await request(app)
        .post('/api/inventory')
        .send(newItem);

      const itemId = createResponse.body.item.id;

      // Delete the item
      const deleteResponse = await request(app).delete(`/api/inventory/${itemId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toContain('deleted successfully');
      expect(deleteResponse.body.item.id).toBe(itemId);

      // Verify item is deleted
      const getResponse = await request(app).get(`/api/inventory/${itemId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent item', async () => {
      const response = await request(app).delete('/api/inventory/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('not found');
    });
  });
});
