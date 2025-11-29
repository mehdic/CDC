/**
 * E2E Test: E-Commerce Workflow
 * E2E-004 - Tests the complete e-commerce flow from product browsing to checkout
 *
 * Workflow Steps:
 * 1. Patient browses product catalog
 * 2. Patient searches for specific products
 * 3. Patient adds products to cart
 * 4. Patient views cart and applies discount (if available)
 * 5. Patient proceeds to checkout
 * 6. Payment processing
 * 7. Order confirmation
 * 8. Order tracking
 */

import request from 'supertest';

// ============================================================================
// Test Configuration
// ============================================================================

const ECOMMERCE_SERVICE_URL = process.env.ECOMMERCE_SERVICE_URL || 'http://localhost:4005';

// Mock authentication tokens
const MOCK_PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGF0aWVudC1lMmUtMDAxIiwicm9sZSI6InBhdGllbnQiLCJpYXQiOjE2MDAwMDAwMDB9.test-signature';

// Test data
const TEST_PATIENT_ID = 'e2e-patient-ecommerce-001';
const TEST_PHARMACY_ID = 'e2e-pharmacy-ecommerce-001';

// Mock product IDs
const MOCK_PRODUCT_IDS = {
  otcMedicine: 'prod-otc-001',
  supplement: 'prod-supp-001',
  skincare: 'prod-skin-001',
};

// ============================================================================
// Test Suite
// ============================================================================

describe.skip('E2E: E-Commerce Workflow (SKIPPED - requires ecommerce-service running)', () => {
  let cartId: string;
  let orderId: string;

  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeAll(async () => {
    // Initialize any test data or connections if needed
  });

  afterAll(async () => {
    // Cleanup test data
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Test 1: Product Catalog Browsing
  // ==========================================================================

  describe('Product Catalog Browsing', () => {
    it('should retrieve products from catalog', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/products')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should search for products by name', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/products/search')
        .query({ q: 'paracetamol', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/products')
        .query({ category: 'OTC', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should get product details', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .get(`/api/products/${MOCK_PRODUCT_IDS.otcMedicine}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('description');
    });
  });

  // ==========================================================================
  // Test 2: Shopping Cart Management
  // ==========================================================================

  describe('Shopping Cart Management', () => {
    it('should create a new shopping cart', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      cartId = response.body.id;
    });

    it('should add product to cart', async () => {
      // First create a cart
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      // Then add item to cart
      const addResponse = await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 2,
        });

      expect(addResponse.status).toBe(201);
      expect(addResponse.body).toHaveProperty('items');
      expect(addResponse.body.items.length).toBeGreaterThan(0);
    });

    it('should update item quantity in cart', async () => {
      // Create cart and add item
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 1,
        });

      // Update quantity
      const updateResponse = await request(ECOMMERCE_SERVICE_URL)
        .patch(`/api/carts/${cartId}/items/${MOCK_PRODUCT_IDS.otcMedicine}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({ quantity: 3 });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('items');
    });

    it('should remove item from cart', async () => {
      // Create cart and add item
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 1,
        });

      // Remove item
      const removeResponse = await request(ECOMMERCE_SERVICE_URL)
        .delete(`/api/carts/${cartId}/items/${MOCK_PRODUCT_IDS.otcMedicine}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(removeResponse.status).toBe(200);
    });

    it('should retrieve cart contents', async () => {
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      const getResponse = await request(ECOMMERCE_SERVICE_URL)
        .get(`/api/carts/${cartId}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('id');
      expect(getResponse.body).toHaveProperty('items');
      expect(getResponse.body).toHaveProperty('total');
    });
  });

  // ==========================================================================
  // Test 3: Discount and Promotions
  // ==========================================================================

  describe('Discounts and Promotions', () => {
    it('should apply discount code to cart', async () => {
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      const discountResponse = await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/discount`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({ code: 'WELCOME10' });

      expect([200, 201, 400, 404]).toContain(discountResponse.status);
      if (discountResponse.status === 200) {
        expect(discountResponse.body).toHaveProperty('discount');
      }
    });

    it('should remove discount code from cart', async () => {
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      // Apply discount
      await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/discount`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({ code: 'WELCOME10' });

      // Remove discount
      const removeResponse = await request(ECOMMERCE_SERVICE_URL)
        .delete(`/api/carts/${cartId}/discount`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect([200, 204, 404]).toContain(removeResponse.status);
    });
  });

  // ==========================================================================
  // Test 4: Checkout and Order Creation
  // ==========================================================================

  describe('Checkout and Order Creation', () => {
    it('should create order from cart', async () => {
      // Create cart
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      // Add item to cart
      await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 1,
        });

      // Create order from cart
      const orderResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/orders')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          cartId: cartId,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'CH',
          },
          paymentMethod: 'credit_card',
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body).toHaveProperty('id');
      expect(orderResponse.body).toHaveProperty('status');
      expect(orderResponse.body).toHaveProperty('total');
      orderId = orderResponse.body.id;
    });

    it('should retrieve order details', async () => {
      // Create an order first
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      cartId = cartResponse.body.id;

      await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 1,
        });

      const orderResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/orders')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          cartId: cartId,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'CH',
          },
          paymentMethod: 'credit_card',
        });

      orderId = orderResponse.body.id;

      // Retrieve order
      const getResponse = await request(ECOMMERCE_SERVICE_URL)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('id');
      expect(getResponse.body).toHaveProperty('items');
      expect(getResponse.body).toHaveProperty('status');
      expect(getResponse.body).toHaveProperty('total');
    });

    it('should list patient orders', async () => {
      const response = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/orders')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .query({ patientId: TEST_PATIENT_ID });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });

  // ==========================================================================
  // Test 5: Complete Workflow (Happy Path)
  // ==========================================================================

  describe('Complete E-Commerce Workflow', () => {
    it('should complete full workflow: browse → search → add to cart → checkout', async () => {
      // Step 1: Browse products
      const browseResponse = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/products')
        .query({ limit: 10 });

      expect(browseResponse.status).toBe(200);

      // Step 2: Search for product
      const searchResponse = await request(ECOMMERCE_SERVICE_URL)
        .get('/api/products/search')
        .query({ q: 'paracetamol' });

      expect(searchResponse.status).toBe(200);

      // Step 3: Create cart
      const cartResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/carts')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          patientId: TEST_PATIENT_ID,
          pharmacyId: TEST_PHARMACY_ID,
        });

      expect(cartResponse.status).toBe(201);
      cartId = cartResponse.body.id;

      // Step 4: Add product to cart
      const addResponse = await request(ECOMMERCE_SERVICE_URL)
        .post(`/api/carts/${cartId}/items`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          productId: MOCK_PRODUCT_IDS.otcMedicine,
          quantity: 2,
        });

      expect(addResponse.status).toBe(201);

      // Step 5: View cart
      const viewResponse = await request(ECOMMERCE_SERVICE_URL)
        .get(`/api/carts/${cartId}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(viewResponse.status).toBe(200);
      expect(viewResponse.body.items.length).toBeGreaterThan(0);

      // Step 6: Proceed to checkout
      const orderResponse = await request(ECOMMERCE_SERVICE_URL)
        .post('/api/orders')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .send({
          cartId: cartId,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'CH',
          },
          paymentMethod: 'credit_card',
        });

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.body).toHaveProperty('id');
      orderId = orderResponse.body.id;

      // Step 7: Verify order was created
      const getResponse = await request(ECOMMERCE_SERVICE_URL)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('pending');
    });
  });
});
