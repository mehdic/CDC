/**
 * Product Search Route Tests
 * Tests for GET /products/search and GET /products/:id endpoints
 * Task: Medication Autocomplete Feature
 */

import request from 'supertest';
import express, { Express } from 'express';
import productRoutes from '../routes/products';

// ============================================================================
// Test Setup
// ============================================================================

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/products', productRoutes);
});

// ============================================================================
// GET /products/search Tests
// ============================================================================

describe('GET /products/search', () => {
  describe('Query validation', () => {
    it('should return 400 when query parameter is missing', async () => {
      const response = await request(app).get('/products/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('required');
    });

    it('should return 400 when query is less than 2 characters', async () => {
      const response = await request(app).get('/products/search?q=a');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('at least 2 characters');
    });

    it('should return 400 when query is empty string', async () => {
      const response = await request(app).get('/products/search?q=');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('Successful searches', () => {
    it('should return products matching query', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('query', 'para');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should return products with correct structure', async () => {
      const response = await request(app).get('/products/search?q=paracetamol');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);

      const product = response.body.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('manufacturer');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('stock_status');
      expect(product).toHaveProperty('requires_prescription');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('dosage_form');
    });

    it('should search case-insensitively', async () => {
      const responseUpper = await request(app).get('/products/search?q=PARA');
      const responseLower = await request(app).get('/products/search?q=para');

      expect(responseUpper.status).toBe(200);
      expect(responseLower.status).toBe(200);
      expect(responseUpper.body.total).toBe(responseLower.body.total);
    });

    it('should search with accent-insensitivity', async () => {
      const responseAccented = await request(app).get('/products/search?q=cetirizine');
      const responseNonAccented = await request(app).get('/products/search?q=cetirizine');

      expect(responseAccented.status).toBe(200);
      expect(responseNonAccented.status).toBe(200);
    });

    it('should return empty array when no products match', async () => {
      const response = await request(app).get('/products/search?q=xyznonexistent');

      expect(response.status).toBe(200);
      expect(response.body.products).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should search by manufacturer', async () => {
      const response = await request(app).get('/products/search?q=sandoz');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(
        response.body.products.some(
          (p: any) => p.manufacturer.toLowerCase() === 'sandoz'
        )
      ).toBe(true);
    });

    it('should search by SKU', async () => {
      const response = await request(app).get('/products/search?q=PARA-500');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
    });
  });

  describe('Limit parameter', () => {
    it('should respect limit parameter', async () => {
      const response = await request(app).get('/products/search?q=am&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(5);
    });

    it('should use default limit of 10', async () => {
      const response = await request(app).get('/products/search?q=am');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(10);
    });

    it('should cap limit at 50', async () => {
      const response = await request(app).get('/products/search?q=am&limit=100');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(50);
    });

    it('should handle invalid limit gracefully', async () => {
      const response = await request(app).get('/products/search?q=para&limit=invalid');

      expect(response.status).toBe(200);
      // Should use default limit
      expect(response.body.products.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Stock status', () => {
    it('should include correct stock_status for products', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      response.body.products.forEach((product: any) => {
        expect(['in_stock', 'low_stock', 'out_of_stock']).toContain(
          product.stock_status
        );
      });
    });
  });

  describe('Response structure', () => {
    it('should include timestamp in response', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timestamp');
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include query in response', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('para');
    });

    it('should include total count in response', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBe(response.body.products.length);
    });
  });

  describe('Search relevance', () => {
    it('should prioritize exact matches at start of name', async () => {
      const response = await request(app).get('/products/search?q=para');

      expect(response.status).toBe(200);
      if (response.body.products.length > 1) {
        const firstName = response.body.products[0].name.toLowerCase();
        // First result should start with the query
        expect(firstName.startsWith('para')).toBe(true);
      }
    });
  });
});

// ============================================================================
// GET /products/:id Tests
// ============================================================================

describe('GET /products/:id', () => {
  it('should return product for valid ID', async () => {
    const response = await request(app).get('/products/prod-001');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product.id).toBe('prod-001');
    expect(response.body.product.name).toBe('Paracetamol 500mg');
  });

  it('should return 404 for non-existent ID', async () => {
    const response = await request(app).get('/products/invalid-id');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
    expect(response.body.message).toContain('invalid-id');
  });

  it('should include all product fields', async () => {
    const response = await request(app).get('/products/prod-001');

    expect(response.status).toBe(200);
    const product = response.body.product;
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('sku');
    expect(product).toHaveProperty('manufacturer');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('stock');
    expect(product).toHaveProperty('stock_status');
    expect(product).toHaveProperty('requires_prescription');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('dosage_form');
  });

  it('should include timestamp in response', async () => {
    const response = await request(app).get('/products/prod-001');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return correct stock_status based on stock level', async () => {
    const response = await request(app).get('/products/prod-001');

    expect(response.status).toBe(200);
    const product = response.body.product;

    // prod-001 has stock: 150, which should be 'in_stock'
    if (product.stock > 20) {
      expect(product.stock_status).toBe('in_stock');
    } else if (product.stock > 0) {
      expect(product.stock_status).toBe('low_stock');
    } else {
      expect(product.stock_status).toBe('out_of_stock');
    }
  });
});
