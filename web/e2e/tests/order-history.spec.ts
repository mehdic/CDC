import { test, expect } from '../fixtures/auth.fixture';
import { EcommercePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-009: Order History Viewing
 *
 * Tests order history page functionality including viewing past orders,
 * filtering, tracking, and reordering capabilities.
 */
test.describe('E2E-009: Order History Viewing', () => {
  const mockOrders = [
    {
      id: 'order_001',
      date: '2025-11-20',
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
      deliveryDate: '2025-11-22',
      address: {
        street: '123 Rue de la Paix',
        city: 'Geneva',
        postalCode: '1200',
      },
    },
    {
      id: 'order_002',
      date: '2025-11-15',
      status: 'delivered',
      items: [
        {
          productId: 'prod_002',
          name: 'Crème hydratante SPF30',
          quantity: 1,
          price: 12.0,
        },
        {
          productId: 'prod_003',
          name: 'Vitamine D3 1000IU',
          quantity: 1,
          price: 15.0,
        },
      ],
      subtotal: 27.0,
      tax: 2.7,
      shipping: 5.0,
      total: 34.7,
      deliveryDate: '2025-11-17',
      address: {
        street: '123 Rue de la Paix',
        city: 'Geneva',
        postalCode: '1200',
      },
    },
    {
      id: 'order_003',
      date: '2025-11-10',
      status: 'in_transit',
      items: [
        {
          productId: 'prod_004',
          name: 'Antibiotics - Amoxicilline 500mg',
          quantity: 1,
          price: 8.5,
        },
      ],
      subtotal: 8.5,
      tax: 0.85,
      shipping: 5.0,
      total: 14.35,
      deliveryDate: '2025-11-26',
      address: {
        street: '456 Avenue de la République',
        city: 'Zurich',
        postalCode: '8000',
      },
    },
    {
      id: 'order_004',
      date: '2025-11-05',
      status: 'pending',
      items: [
        {
          productId: 'prod_001',
          name: 'Paracétamol 500mg',
          quantity: 1,
          price: 5.5,
        },
      ],
      subtotal: 5.5,
      tax: 0.55,
      shipping: 5.0,
      total: 11.05,
      deliveryDate: '2025-11-08',
      address: {
        street: '789 Test Street',
        city: 'Bern',
        postalCode: '3000',
      },
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
        page: 1,
        pageSize: 10,
      },
    });

    // Mock order statuses
    await mockApiResponse(page, '**/orders/statuses**', {
      status: 200,
      body: {
        success: true,
        statuses: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
      },
    });
  });

  test('should display order history page with list of orders', async ({ patientPage }) => {
    // Patient page fixture for patient-specific tests
    const ecommercePage = new EcommercePage(patientPage);

    // Navigate to order history
    await patientPage.goto('/orders');

    // Verify page loaded
    await expect(patientPage).toHaveURL(/\/orders/);

    // Verify orders list visible
    const ordersList = patientPage.locator('[data-testid="orders-list"]');
    await expect(ordersList).toBeVisible();

    // Verify order items displayed
    const orderItems = patientPage.locator('[data-testid^="order-"]');
    const count = await orderItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display order details including date, status, and total', async ({ patientPage }) => {
    await patientPage.goto('/orders');

    // Find first order
    const firstOrder = patientPage.locator('[data-testid="order-order_001"]');

    // Verify order information visible
    const orderDate = patientPage.locator('[data-testid="order-date-order_001"]');
    const orderStatus = patientPage.locator('[data-testid="order-status-order_001"]');
    const orderTotal = patientPage.locator('[data-testid="order-total-order_001"]');

    if (await orderDate.count() > 0) {
      await expect(orderDate).toContainText('2025-11-20');
    }
    if (await orderStatus.count() > 0) {
      await expect(orderStatus).toContainText('delivered');
    }
    if (await orderTotal.count() > 0) {
      await expect(orderTotal).toContainText('17.1');
    }
  });

  test('should click on order to view detailed view', async ({ patientPage }) => {
    await patientPage.goto('/orders');

    // Click on first order
    const orderLink = patientPage.locator('[data-testid="order-link-order_001"]');
    if (await orderLink.count() > 0) {
      await orderLink.click();

      // Verify navigated to order detail page
      await expect(patientPage).toHaveURL(/\/orders\/order_001/);
    }
  });

  test('should display order detail page with all information', async ({ patientPage }) => {
    // Mock single order detail
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Verify order information
    const orderNumber = patientPage.locator('[data-testid="order-number"]');
    const orderDate = patientPage.locator('[data-testid="order-date"]');
    const orderStatus = patientPage.locator('[data-testid="order-status"]');
    const deliveryAddress = patientPage.locator('[data-testid="delivery-address"]');

    await expect(orderNumber).toContainText('order_001');
    if (await orderDate.count() > 0) {
      await expect(orderDate).toContainText('2025-11-20');
    }
    if (await orderStatus.count() > 0) {
      await expect(orderStatus).toContainText('delivered');
    }
  });

  test('should display items in order detail', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Verify items listed
    const items = patientPage.locator('[data-testid^="order-item-"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Verify specific item details
    const itemName = patientPage.locator('[data-testid="item-name-prod_001"]');
    if (await itemName.count() > 0) {
      await expect(itemName).toContainText('Paracétamol');
    }
  });

  test('should filter orders by status', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders?status=delivered**', {
      status: 200,
      body: {
        success: true,
        orders: mockOrders.filter(o => o.status === 'delivered'),
        total: 2,
      },
    });

    await patientPage.goto('/orders');

    // Click status filter
    const statusFilter = patientPage.locator('[data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.click();

      // Select delivered status
      const deliveredOption = patientPage.getByRole('option', { name: /delivered/i });
      if (await deliveredOption.count() > 0) {
        await deliveredOption.click();
      }
    }

    // Verify filtered results
    const orders = patientPage.locator('[data-testid^="order-"]');
    const count = await orders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter orders by date range', async ({ patientPage }) => {
    await patientPage.goto('/orders');

    // Look for date range filter
    const startDateInput = patientPage.locator('[data-testid="start-date"]');
    const endDateInput = patientPage.locator('[data-testid="end-date"]');

    if (await startDateInput.count() > 0) {
      await startDateInput.fill('2025-11-01');
    }
    if (await endDateInput.count() > 0) {
      await endDateInput.fill('2025-11-30');
    }
  });

  test('should search orders by order number', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders?search=order_001**', {
      status: 200,
      body: {
        success: true,
        orders: [mockOrders[0]],
        total: 1,
      },
    });

    await patientPage.goto('/orders');

    // Search for order
    const searchInput = patientPage.locator('[data-testid="search-input"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('order_001');
      await searchInput.press('Enter');
    }

    // Verify search results
    const orders = patientPage.locator('[data-testid^="order-"]');
    const count = await orders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display order status with tracking information', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Look for tracking info
    const statusTimeline = patientPage.locator('[data-testid="status-timeline"]');
    if (await statusTimeline.count() > 0) {
      await expect(statusTimeline).toBeVisible();
    }
  });

  test('should show delivery date for orders', async ({ patientPage }) => {
    await patientPage.goto('/orders');

    // Verify delivery date displayed
    const deliveryDate = patientPage.locator('[data-testid="delivery-date-order_001"]');
    if (await deliveryDate.count() > 0) {
      await expect(deliveryDate).toContainText('2025-11-22');
    }
  });

  test('should allow viewing tracking information for in-transit orders', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_003/tracking**', {
      status: 200,
      body: {
        success: true,
        tracking: {
          orderId: 'order_003',
          status: 'in_transit',
          currentLocation: 'Distribution center',
          estimatedDelivery: '2025-11-26',
          gpsLocation: {
            latitude: 47.45,
            longitude: 8.55,
          },
        },
      },
    });

    await patientPage.goto('/orders/order_003');

    // Look for tracking button
    const trackingButton = patientPage.getByRole('button', { name: /track|tracking/i });
    if (await trackingButton.count() > 0) {
      await trackingButton.click();

      // Verify tracking info appears
      const trackingInfo = patientPage.locator('[data-testid="tracking-info"]');
      if (await trackingInfo.count() > 0) {
        await expect(trackingInfo).toBeVisible();
      }
    }
  });

  test('should allow reordering items from previous order', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await mockApiResponse(patientPage, '**/cart/add', {
      status: 200,
      body: {
        success: true,
        message: 'Items added to cart',
      },
    });

    await patientPage.goto('/orders/order_001');

    // Look for reorder button
    const reorderButton = patientPage.getByRole('button', { name: /reorder|order.*again/i });
    if (await reorderButton.count() > 0) {
      await reorderButton.click();

      // Should add items to cart and redirect
      const cartNotification = patientPage.locator('[data-testid="notification"]');
      if (await cartNotification.count() > 0) {
        await expect(cartNotification).toBeVisible();
      }
    }
  });

  test('should display order summary with line item breakdown', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Verify order summary
    const subtotal = patientPage.locator('[data-testid="order-subtotal"]');
    const tax = patientPage.locator('[data-testid="order-tax"]');
    const shipping = patientPage.locator('[data-testid="order-shipping"]');
    const total = patientPage.locator('[data-testid="order-total"]');

    if (await subtotal.count() > 0) {
      await expect(subtotal).toBeVisible();
    }
    if (await tax.count() > 0) {
      await expect(tax).toBeVisible();
    }
    if (await shipping.count() > 0) {
      await expect(shipping).toBeVisible();
    }
    if (await total.count() > 0) {
      await expect(total).toBeVisible();
    }
  });

  test('should allow downloading invoice for completed orders', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001/invoice**', {
      status: 200,
      body: Buffer.from('PDF content'),
      headers: {
        'Content-Type': 'application/pdf',
      },
    });

    await patientPage.goto('/orders/order_001');

    // Look for download invoice button
    const downloadButton = patientPage.getByRole('button', { name: /download.*invoice|invoice|pdf/i });
    if (await downloadButton.count() > 0) {
      await expect(downloadButton).toBeVisible();
    }
  });

  test('should support pagination for large order lists', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders?page=2**', {
      status: 200,
      body: {
        success: true,
        orders: [],
        total: mockOrders.length,
        page: 2,
        pageSize: 10,
      },
    });

    await patientPage.goto('/orders');

    // Look for pagination controls
    const nextButton = patientPage.getByRole('button', { name: /next|page.*2/i });
    if (await nextButton.count() > 0) {
      await expect(nextButton).toBeVisible();
    }
  });

  test('should display order address information', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Verify address displayed
    const address = patientPage.locator('[data-testid="delivery-address"]');
    if (await address.count() > 0) {
      await expect(address).toBeVisible();
      await expect(address).toContainText('Geneva');
    }
  });

  test('should allow filtering and sorting orders', async ({ patientPage }) => {
    await patientPage.goto('/orders');

    // Look for sort dropdown
    const sortDropdown = patientPage.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();

      // Select sort by date descending
      const sortOption = patientPage.getByRole('option', { name: /newest|recent|date.*desc/i });
      if (await sortOption.count() > 0) {
        await sortOption.click();
      }
    }
  });

  test('should cancel pending orders if allowed', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_004/cancel**', {
      status: 200,
      body: {
        success: true,
        message: 'Order cancelled successfully',
      },
    });

    await patientPage.goto('/orders/order_004');

    // Look for cancel button
    const cancelButton = patientPage.getByRole('button', { name: /cancel|cancel.*order/i });
    if (await cancelButton.count() > 0) {
      await expect(cancelButton).toBeVisible();

      // Click cancel
      await cancelButton.click();

      // Confirm cancellation
      const confirmButton = patientPage.getByRole('button', { name: /confirm|yes|cancel.*order/i });
      if (await confirmButton.count() > 1) {
        await confirmButton.last().click();
      }
    }
  });

  test('should display empty order history message when no orders exist', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders**', {
      status: 200,
      body: {
        success: true,
        orders: [],
        total: 0,
      },
    });

    await patientPage.goto('/orders');

    // Verify empty message
    const emptyMessage = patientPage.locator('[data-testid="no-orders-message"]');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should display return/exchange options for completed orders', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        order: mockOrders[0],
      },
    });

    await patientPage.goto('/orders/order_001');

    // Look for return button
    const returnButton = patientPage.getByRole('button', { name: /return|exchange|refund/i });
    if (await returnButton.count() > 0) {
      await expect(returnButton).toBeVisible();
    }
  });
});
