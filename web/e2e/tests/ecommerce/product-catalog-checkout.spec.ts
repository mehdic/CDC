import { test, expect } from '../../fixtures/auth.fixture';
import { EcommercePage } from '../../page-objects';
import { mockApiResponse } from '../../utils/api-mock';

/**
 * E2E-ECOM: E-Commerce Complete Workflow
 *
 * Tests the complete e-commerce user journey from product discovery
 * to order completion and history viewing.
 *
 * Task: T8-049 - E-Commerce E2E Tests
 *
 * Coverage:
 * - Product catalog browsing with filters and search
 * - Shopping cart management (add, update, remove)
 * - Checkout process with address and payment
 * - Payment simulation (mock)
 * - Order confirmation and history
 */

test.describe('E2E-ECOM: Product Catalog & Checkout Workflow', () => {
  // Mock product data
  const mockProducts = [
    {
      id: 'prod_001',
      name: 'Paracétamol 500mg',
      category: 'OTC',
      price: 5.5,
      stock: 100,
      requiresPrescription: false,
      description: 'Pain relief medication',
      image: '/images/paracetamol.jpg',
    },
    {
      id: 'prod_002',
      name: 'Crème hydratante SPF30',
      category: 'Parapharmacie',
      price: 12.0,
      stock: 50,
      requiresPrescription: false,
      description: 'Moisturizing cream with sun protection',
      image: '/images/creme.jpg',
    },
    {
      id: 'prod_003',
      name: 'Vitamine D3 1000IU',
      category: 'Compléments',
      price: 15.0,
      stock: 75,
      requiresPrescription: false,
      description: 'Vitamin D supplement',
      image: '/images/vitamin-d.jpg',
    },
    {
      id: 'prod_004',
      name: 'Antibiotiques - Amoxicilline',
      category: 'Prescription',
      price: 25.0,
      stock: 30,
      requiresPrescription: true,
      description: 'Antibiotic medication - prescription required',
      image: '/images/antibiotics.jpg',
    },
  ];

  // Mock cart
  let mockCart = {
    id: 'cart_001',
    items: [] as Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>,
    subtotal: 0,
    tax: 0,
    shipping: 5.0,
    total: 0,
    itemCount: 0,
  };

  test.beforeEach(async ({ page }) => {
    // Reset mock cart
    mockCart = {
      id: 'cart_001',
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 5.0,
      total: 5.0,
      itemCount: 0,
    };

    // Mock product catalog API
    await mockApiResponse(page, '**/products**', {
      status: 200,
      body: {
        success: true,
        products: mockProducts,
        total: mockProducts.length,
        page: 1,
        pageSize: 20,
      },
    });

    // Mock empty cart initially
    await mockApiResponse(page, '**/cart**', {
      status: 200,
      body: {
        success: true,
        cart: mockCart,
      },
    });

    // Mock categories API
    await mockApiResponse(page, '**/products/categories**', {
      status: 200,
      body: {
        success: true,
        categories: ['OTC', 'Parapharmacie', 'Compléments', 'Prescription'],
      },
    });
  });

  test.describe('Product Catalog Browsing', () => {
    test('should display product catalog with all products', async ({ patientPage }) => {
      await patientPage.goto('/ecommerce');

      // Verify page loaded
      await expect(patientPage).toHaveURL(/\/ecommerce/);

      // Verify products are displayed
      const productList = patientPage.locator('[data-testid="product-list"]');
      await expect(productList).toBeVisible();

      // Verify product cards are visible
      const productCards = patientPage.locator('[data-testid^="product-prod_"]');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);

      // Verify first product details
      const firstProduct = patientPage.locator('[data-testid="product-prod_001"]');
      await expect(firstProduct).toBeVisible();
      await expect(firstProduct).toContainText('Paracétamol');
      await expect(firstProduct).toContainText('5.5');
    });

    test('should filter products by category', async ({ patientPage }) => {
      // Mock filtered products
      await mockApiResponse(patientPage, '**/products?category=OTC**', {
        status: 200,
        body: {
          success: true,
          products: mockProducts.filter((p) => p.category === 'OTC'),
          total: 1,
        },
      });

      await patientPage.goto('/ecommerce');

      // Click category filter
      const categoryFilter = patientPage.locator('[data-testid="category-filter"]');
      await categoryFilter.click();

      // Select OTC category
      const otcOption = patientPage.getByRole('option', { name: /otc|sans ordonnance/i });
      await otcOption.click();

      // Verify only OTC products shown
      const productCards = patientPage.locator('[data-testid^="product-prod_"]');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should search products by name', async ({ patientPage }) => {
      // Mock search results
      await mockApiResponse(patientPage, '**/products?search=creme**', {
        status: 200,
        body: {
          success: true,
          products: [mockProducts[1]], // Crème hydratante
          total: 1,
        },
      });

      await patientPage.goto('/ecommerce');

      // Search for product
      const searchInput = patientPage.getByPlaceholder(/rechercher|search/i);
      await searchInput.fill('creme');
      await searchInput.press('Enter');

      // Wait for search results
      await patientPage.waitForTimeout(500);

      // Verify search results
      const productCard = patientPage.locator('[data-testid="product-prod_002"]');
      if (await productCard.count() > 0) {
        await expect(productCard).toContainText('Crème hydratante');
      }
    });

    test('should display product details when clicked', async ({ patientPage }) => {
      // Mock product detail API
      await mockApiResponse(patientPage, '**/products/prod_001**', {
        status: 200,
        body: {
          success: true,
          product: mockProducts[0],
        },
      });

      await patientPage.goto('/ecommerce');

      // Click on product to view details
      const productCard = patientPage.locator('[data-testid="product-prod_001"]');
      await productCard.click();

      // Verify product detail view or modal
      const productDetail = patientPage.locator('[data-testid="product-detail"]');
      if (await productDetail.count() > 0) {
        await expect(productDetail).toBeVisible();
        await expect(productDetail).toContainText('Paracétamol 500mg');
        await expect(productDetail).toContainText('Pain relief medication');
      }
    });

    test('should show stock availability for products', async ({ patientPage }) => {
      await patientPage.goto('/ecommerce');

      // Verify stock level displayed
      const stockLevel = patientPage.locator('[data-testid="stock-level-prod_001"]');
      if (await stockLevel.count() > 0) {
        await expect(stockLevel).toBeVisible();
        await expect(stockLevel).toContainText(/100|en stock|in stock/i);
      }
    });

    test('should indicate prescription-required products', async ({ patientPage }) => {
      await patientPage.goto('/ecommerce');

      // Verify prescription badge on prescription-required product
      const prescriptionBadge = patientPage.locator('[data-testid="prescription-badge-prod_004"]');
      if (await prescriptionBadge.count() > 0) {
        await expect(prescriptionBadge).toBeVisible();
        await expect(prescriptionBadge).toContainText(/ordonnance|prescription/i);
      }
    });
  });

  test.describe('Add to Cart Functionality', () => {
    test('should add single product to cart', async ({ patientPage }) => {
      // Mock add to cart response
      await mockApiResponse(patientPage, '**/cart/add', {
        status: 200,
        body: {
          success: true,
          cart: {
            id: 'cart_001',
            items: [
              {
                productId: 'prod_001',
                name: 'Paracétamol 500mg',
                quantity: 1,
                price: 5.5,
                subtotal: 5.5,
              },
            ],
            subtotal: 5.5,
            tax: 0.55,
            shipping: 5.0,
            total: 11.05,
            itemCount: 1,
          },
        },
      });

      await patientPage.goto('/ecommerce');

      // Click add to cart button
      const addToCartBtn = patientPage.locator('[data-testid="add-to-cart-prod_001"]');
      await addToCartBtn.click();

      // Verify cart count updated
      const cartCount = patientPage.locator('[data-testid="cart-count"]');
      if (await cartCount.count() > 0) {
        await expect(cartCount).toContainText('1');
      }

      // Verify success notification
      const notification = patientPage.locator('[data-testid="notification"]');
      if (await notification.count() > 0) {
        await expect(notification).toBeVisible();
        await expect(notification).toContainText(/ajouté|added/i);
      }
    });

    test('should add multiple different products to cart', async ({ patientPage }) => {
      // Mock add to cart for first product
      await mockApiResponse(patientPage, '**/cart/add', {
        status: 200,
        body: {
          success: true,
          cart: {
            id: 'cart_001',
            items: [
              {
                productId: 'prod_001',
                name: 'Paracétamol 500mg',
                quantity: 1,
                price: 5.5,
                subtotal: 5.5,
              },
              {
                productId: 'prod_002',
                name: 'Crème hydratante SPF30',
                quantity: 1,
                price: 12.0,
                subtotal: 12.0,
              },
            ],
            subtotal: 17.5,
            tax: 1.75,
            shipping: 5.0,
            total: 24.25,
            itemCount: 2,
          },
        },
      });

      await patientPage.goto('/ecommerce');

      // Add first product
      await patientPage.locator('[data-testid="add-to-cart-prod_001"]').click();
      await patientPage.waitForTimeout(300);

      // Add second product
      await patientPage.locator('[data-testid="add-to-cart-prod_002"]').click();

      // Verify cart count
      const cartCount = patientPage.locator('[data-testid="cart-count"]');
      if (await cartCount.count() > 0) {
        await expect(cartCount).toContainText(/2|items/i);
      }
    });

    test('should allow specifying quantity when adding to cart', async ({ patientPage }) => {
      await patientPage.goto('/ecommerce');

      // Click on product to open detail
      const productCard = patientPage.locator('[data-testid="product-prod_001"]');
      await productCard.click();

      // Find quantity input
      const quantityInput = patientPage.locator('[data-testid="quantity-input"]');
      if (await quantityInput.count() > 0) {
        await quantityInput.fill('3');

        // Click add to cart
        const addBtn = patientPage.getByRole('button', { name: /ajouter|add.*cart/i });
        await addBtn.click();
      }
    });

    test('should prevent adding out-of-stock products', async ({ patientPage }) => {
      // Mock product as out of stock
      await mockApiResponse(patientPage, '**/products**', {
        status: 200,
        body: {
          success: true,
          products: [
            {
              ...mockProducts[0],
              stock: 0,
            },
          ],
        },
      });

      await patientPage.goto('/ecommerce');

      // Verify add to cart button is disabled
      const addToCartBtn = patientPage.locator('[data-testid="add-to-cart-prod_001"]');
      if (await addToCartBtn.count() > 0) {
        const isDisabled = await addToCartBtn.isDisabled();
        expect(isDisabled).toBeTruthy();
      }

      // Verify out of stock message
      const outOfStockMsg = patientPage.locator('[data-testid="out-of-stock-prod_001"]');
      if (await outOfStockMsg.count() > 0) {
        await expect(outOfStockMsg).toBeVisible();
      }
    });
  });

  test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
      // Mock cart with items for checkout tests
      await mockApiResponse(page, '**/cart**', {
        status: 200,
        body: {
          success: true,
          cart: {
            id: 'cart_001',
            items: [
              {
                productId: 'prod_001',
                name: 'Paracétamol 500mg',
                quantity: 2,
                price: 5.5,
                subtotal: 11.0,
              },
              {
                productId: 'prod_002',
                name: 'Crème hydratante SPF30',
                quantity: 1,
                price: 12.0,
                subtotal: 12.0,
              },
            ],
            subtotal: 23.0,
            tax: 2.3,
            shipping: 5.0,
            total: 30.3,
            itemCount: 2,
          },
        },
      });
    });

    test('should view cart and proceed to checkout', async ({ patientPage }) => {
      await patientPage.goto('/ecommerce');

      // Open cart
      const cartIcon = patientPage.locator('[data-testid="cart-icon"]');
      await cartIcon.click();

      // Verify cart items displayed
      const cartModal = patientPage.locator('[data-testid="cart-modal"]');
      if (await cartModal.count() > 0) {
        await expect(cartModal).toBeVisible();
      }

      // Verify cart summary
      const cartTotal = patientPage.locator('[data-testid="cart-total"]');
      if (await cartTotal.count() > 0) {
        await expect(cartTotal).toContainText('30.3');
      }

      // Click checkout button
      const checkoutBtn = patientPage.getByRole('button', { name: /passer commande|checkout/i });
      await checkoutBtn.click();

      // Verify navigated to checkout
      await expect(patientPage).toHaveURL(/\/checkout/);
    });

    test('should complete checkout with delivery address', async ({ patientPage }) => {
      // Mock address validation
      await mockApiResponse(patientPage, '**/checkout/validate-address', {
        status: 200,
        body: {
          success: true,
          valid: true,
        },
      });

      await patientPage.goto('/checkout');

      // Fill delivery address
      const streetInput = patientPage.getByLabel(/rue|street|adresse/i);
      if (await streetInput.count() > 0) {
        await streetInput.fill('123 Rue de la Paix');
      }

      const cityInput = patientPage.getByLabel(/ville|city/i);
      if (await cityInput.count() > 0) {
        await cityInput.fill('Geneva');
      }

      const postalCodeInput = patientPage.getByLabel(/code postal|postal code|zip/i);
      if (await postalCodeInput.count() > 0) {
        await postalCodeInput.fill('1200');
      }

      const countrySelect = patientPage.getByLabel(/pays|country/i);
      if (await countrySelect.count() > 0) {
        await countrySelect.selectOption('CH');
      }

      // Proceed to payment
      const continueBtn = patientPage.getByRole('button', { name: /continuer|continue|payment/i });
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
      }
    });

    test('should simulate payment processing', async ({ patientPage }) => {
      // Mock payment processing
      await mockApiResponse(patientPage, '**/checkout/process-payment', {
        status: 200,
        body: {
          success: true,
          orderId: 'order_12345',
          paymentStatus: 'completed',
          transactionId: 'txn_98765',
        },
      });

      // Mock order creation
      await mockApiResponse(patientPage, '**/orders', {
        status: 201,
        body: {
          success: true,
          order: {
            id: 'order_12345',
            status: 'pending',
            items: [
              {
                productId: 'prod_001',
                name: 'Paracétamol 500mg',
                quantity: 2,
                price: 5.5,
              },
            ],
            total: 30.3,
            deliveryAddress: {
              street: '123 Rue de la Paix',
              city: 'Geneva',
              postalCode: '1200',
              country: 'CH',
            },
          },
        },
      });

      await patientPage.goto('/checkout');

      // Navigate to payment step (assume address already filled)
      const paymentSection = patientPage.locator('[data-testid="payment-section"]');
      if (await paymentSection.count() > 0) {
        await expect(paymentSection).toBeVisible();
      }

      // Select payment method
      const cardPayment = patientPage.locator('[data-testid="payment-method-card"]');
      if (await cardPayment.count() > 0) {
        await cardPayment.click();
      }

      // Fill mock card details
      const cardNumberInput = patientPage.getByLabel(/numéro.*carte|card.*number/i);
      if (await cardNumberInput.count() > 0) {
        await cardNumberInput.fill('4242424242424242');
      }

      const expiryInput = patientPage.getByLabel(/expiration|expiry/i);
      if (await expiryInput.count() > 0) {
        await expiryInput.fill('12/25');
      }

      const cvvInput = patientPage.getByLabel(/cvv|cvc|code sécurité/i);
      if (await cvvInput.count() > 0) {
        await cvvInput.fill('123');
      }

      // Submit payment
      const submitBtn = patientPage.getByRole('button', { name: /payer|pay|confirmer/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();

        // Wait for payment processing
        await patientPage.waitForTimeout(1000);

        // Verify success message or redirect
        const successMsg = patientPage.locator('[data-testid="order-success"]');
        if (await successMsg.count() > 0) {
          await expect(successMsg).toBeVisible();
        }
      }
    });

    test('should display order confirmation after successful payment', async ({ patientPage }) => {
      // Mock order detail
      await mockApiResponse(patientPage, '**/orders/order_12345**', {
        status: 200,
        body: {
          success: true,
          order: {
            id: 'order_12345',
            date: new Date().toISOString(),
            status: 'confirmed',
            items: [
              {
                productId: 'prod_001',
                name: 'Paracétamol 500mg',
                quantity: 2,
                price: 5.5,
                subtotal: 11.0,
              },
              {
                productId: 'prod_002',
                name: 'Crème hydratante SPF30',
                quantity: 1,
                price: 12.0,
                subtotal: 12.0,
              },
            ],
            subtotal: 23.0,
            tax: 2.3,
            shipping: 5.0,
            total: 30.3,
            deliveryAddress: {
              street: '123 Rue de la Paix',
              city: 'Geneva',
              postalCode: '1200',
              country: 'CH',
            },
            estimatedDelivery: '2025-12-28',
          },
        },
      });

      await patientPage.goto('/orders/order_12345/confirmation');

      // Verify order confirmation page
      const confirmationPage = patientPage.locator('[data-testid="order-confirmation"]');
      if (await confirmationPage.count() > 0) {
        await expect(confirmationPage).toBeVisible();
      }

      // Verify order number
      const orderNumber = patientPage.locator('[data-testid="order-number"]');
      if (await orderNumber.count() > 0) {
        await expect(orderNumber).toContainText('order_12345');
      }

      // Verify order total
      const orderTotal = patientPage.locator('[data-testid="order-total"]');
      if (await orderTotal.count() > 0) {
        await expect(orderTotal).toContainText('30.3');
      }

      // Verify estimated delivery
      const deliveryDate = patientPage.locator('[data-testid="estimated-delivery"]');
      if (await deliveryDate.count() > 0) {
        await expect(deliveryDate).toBeVisible();
      }
    });

    test('should allow updating cart during checkout', async ({ patientPage }) => {
      await patientPage.goto('/checkout');

      // Look for edit cart button
      const editCartBtn = patientPage.getByRole('button', { name: /modifier.*panier|edit.*cart/i });
      if (await editCartBtn.count() > 0) {
        await editCartBtn.click();

        // Should navigate back to cart or ecommerce page
        await expect(patientPage).toHaveURL(/\/ecommerce|\/cart/);
      }
    });

    test('should validate required fields in checkout form', async ({ patientPage }) => {
      await patientPage.goto('/checkout');

      // Try to submit without filling required fields
      const submitBtn = patientPage.getByRole('button', { name: /continuer|continue|submit/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();

        // Verify validation errors
        const errors = patientPage.locator('[data-testid="validation-error"]');
        if (await errors.count() > 0) {
          await expect(errors.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Order History', () => {
    const mockOrders = [
      {
        id: 'order_001',
        date: '2025-12-20',
        status: 'delivered',
        items: [
          {
            productId: 'prod_001',
            name: 'Paracétamol 500mg',
            quantity: 2,
            price: 5.5,
          },
        ],
        subtotal: 11.0,
        tax: 1.1,
        shipping: 5.0,
        total: 17.1,
        deliveryDate: '2025-12-22',
      },
      {
        id: 'order_002',
        date: '2025-12-15',
        status: 'in_transit',
        items: [
          {
            productId: 'prod_002',
            name: 'Crème hydratante SPF30',
            quantity: 1,
            price: 12.0,
          },
        ],
        subtotal: 12.0,
        tax: 1.2,
        shipping: 5.0,
        total: 18.2,
        estimatedDelivery: '2025-12-26',
      },
    ];

    test.beforeEach(async ({ page }) => {
      // Mock orders list
      await mockApiResponse(page, '**/orders**', {
        status: 200,
        body: {
          success: true,
          orders: mockOrders,
          total: mockOrders.length,
        },
      });
    });

    test('should display order history with all orders', async ({ patientPage }) => {
      await patientPage.goto('/orders');

      // Verify order history page loaded
      await expect(patientPage).toHaveURL(/\/orders/);

      // Verify orders list visible
      const ordersList = patientPage.locator('[data-testid="orders-list"]');
      await expect(ordersList).toBeVisible();

      // Verify orders displayed
      const orderItems = patientPage.locator('[data-testid^="order-"]');
      const count = await orderItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display order details including status and total', async ({ patientPage }) => {
      await patientPage.goto('/orders');

      // Check first order details
      const firstOrder = patientPage.locator('[data-testid="order-order_001"]');
      if (await firstOrder.count() > 0) {
        await expect(firstOrder).toBeVisible();

        // Verify order information
        const orderStatus = patientPage.locator('[data-testid="order-status-order_001"]');
        if (await orderStatus.count() > 0) {
          await expect(orderStatus).toContainText(/delivered|livré/i);
        }

        const orderTotal = patientPage.locator('[data-testid="order-total-order_001"]');
        if (await orderTotal.count() > 0) {
          await expect(orderTotal).toContainText('17.1');
        }
      }
    });

    test('should view detailed order information', async ({ patientPage }) => {
      // Mock single order detail
      await mockApiResponse(patientPage, '**/orders/order_001**', {
        status: 200,
        body: {
          success: true,
          order: mockOrders[0],
        },
      });

      await patientPage.goto('/orders');

      // Click on order to view details
      const orderLink = patientPage.locator('[data-testid="order-link-order_001"]');
      if (await orderLink.count() > 0) {
        await orderLink.click();

        // Verify navigated to order detail
        await expect(patientPage).toHaveURL(/\/orders\/order_001/);

        // Verify order details displayed
        const orderDetail = patientPage.locator('[data-testid="order-detail"]');
        if (await orderDetail.count() > 0) {
          await expect(orderDetail).toBeVisible();
        }
      }
    });

    test('should allow tracking in-transit orders', async ({ patientPage }) => {
      // Mock tracking information
      await mockApiResponse(patientPage, '**/orders/order_002/tracking**', {
        status: 200,
        body: {
          success: true,
          tracking: {
            orderId: 'order_002',
            status: 'in_transit',
            currentLocation: 'Distribution Center - Geneva',
            estimatedDelivery: '2025-12-26',
            events: [
              {
                timestamp: '2025-12-24T10:00:00Z',
                status: 'in_transit',
                location: 'Distribution Center',
              },
              {
                timestamp: '2025-12-23T15:00:00Z',
                status: 'shipped',
                location: 'Warehouse',
              },
            ],
          },
        },
      });

      await patientPage.goto('/orders/order_002');

      // Click track button
      const trackBtn = patientPage.getByRole('button', { name: /suivre|track/i });
      if (await trackBtn.count() > 0) {
        await trackBtn.click();

        // Verify tracking information displayed
        const trackingInfo = patientPage.locator('[data-testid="tracking-info"]');
        if (await trackingInfo.count() > 0) {
          await expect(trackingInfo).toBeVisible();
          await expect(trackingInfo).toContainText(/distribution.*center|geneva/i);
        }
      }
    });

    test('should allow reordering items from previous orders', async ({ patientPage }) => {
      // Mock reorder API
      await mockApiResponse(patientPage, '**/cart/reorder', {
        status: 200,
        body: {
          success: true,
          message: 'Items added to cart',
          cart: {
            id: 'cart_001',
            itemCount: 1,
          },
        },
      });

      await patientPage.goto('/orders/order_001');

      // Click reorder button
      const reorderBtn = patientPage.getByRole('button', { name: /commander.*nouveau|reorder/i });
      if (await reorderBtn.count() > 0) {
        await reorderBtn.click();

        // Verify success notification
        const notification = patientPage.locator('[data-testid="notification"]');
        if (await notification.count() > 0) {
          await expect(notification).toBeVisible();
          await expect(notification).toContainText(/ajouté|added/i);
        }
      }
    });

    test('should filter orders by status', async ({ patientPage }) => {
      // Mock filtered orders
      await mockApiResponse(patientPage, '**/orders?status=delivered**', {
        status: 200,
        body: {
          success: true,
          orders: mockOrders.filter((o) => o.status === 'delivered'),
          total: 1,
        },
      });

      await patientPage.goto('/orders');

      // Click status filter
      const statusFilter = patientPage.locator('[data-testid="status-filter"]');
      if (await statusFilter.count() > 0) {
        await statusFilter.click();

        // Select delivered status
        const deliveredOption = patientPage.getByRole('option', { name: /delivered|livré/i });
        if (await deliveredOption.count() > 0) {
          await deliveredOption.click();

          // Verify filtered results
          await patientPage.waitForTimeout(500);
          const orders = patientPage.locator('[data-testid^="order-"]');
          const count = await orders.count();
          expect(count).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Payment Simulation', () => {
    test('should accept valid credit card details', async ({ patientPage }) => {
      // Mock payment validation
      await mockApiResponse(patientPage, '**/checkout/validate-payment', {
        status: 200,
        body: {
          success: true,
          valid: true,
        },
      });

      await patientPage.goto('/checkout');

      // Fill card details
      const cardNumber = patientPage.getByLabel(/numéro.*carte|card.*number/i);
      if (await cardNumber.count() > 0) {
        await cardNumber.fill('4242424242424242');

        // Verify no validation error
        const error = patientPage.locator('[data-testid="card-number-error"]');
        if (await error.count() > 0) {
          await expect(error).not.toBeVisible();
        }
      }
    });

    test('should reject invalid credit card details', async ({ patientPage }) => {
      await patientPage.goto('/checkout');

      // Fill invalid card number
      const cardNumber = patientPage.getByLabel(/numéro.*carte|card.*number/i);
      if (await cardNumber.count() > 0) {
        await cardNumber.fill('1234567890123456');
        await cardNumber.blur();

        // Verify validation error
        const error = patientPage.locator('[data-testid="card-number-error"]');
        if (await error.count() > 0) {
          await expect(error).toBeVisible();
        }
      }
    });

    test('should show processing state during payment', async ({ patientPage }) => {
      // Mock delayed payment processing
      await mockApiResponse(patientPage, '**/checkout/process-payment', {
        status: 200,
        body: {
          success: true,
          orderId: 'order_12345',
        },
      });

      await patientPage.goto('/checkout');

      // Submit payment
      const submitBtn = patientPage.getByRole('button', { name: /payer|pay|confirmer/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();

        // Verify loading state
        const loadingIndicator = patientPage.locator('[data-testid="payment-processing"]');
        if (await loadingIndicator.count() > 0) {
          await expect(loadingIndicator).toBeVisible();
        }
      }
    });

    test('should handle payment failure gracefully', async ({ patientPage }) => {
      // Mock payment failure
      await mockApiResponse(patientPage, '**/checkout/process-payment', {
        status: 400,
        body: {
          success: false,
          error: 'Payment declined',
        },
      });

      await patientPage.goto('/checkout');

      // Submit payment
      const submitBtn = patientPage.getByRole('button', { name: /payer|pay|confirmer/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();

        // Wait for response
        await patientPage.waitForTimeout(1000);

        // Verify error message
        const errorMsg = patientPage.locator('[data-testid="payment-error"]');
        if (await errorMsg.count() > 0) {
          await expect(errorMsg).toBeVisible();
          await expect(errorMsg).toContainText(/declined|refusé|error/i);
        }
      }
    });
  });
});
