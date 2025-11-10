import { test, expect } from '../fixtures/auth.fixture';
import { EcommercePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('E-commerce Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock products list
    await mockApiResponse(page, '**/products**', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_001',
            name: 'Paracétamol 500mg',
            category: 'OTC',
            price: 5.5,
            stock: 100,
            requiresPrescription: false,
          },
          {
            id: 'prod_002',
            name: 'Crème hydratante',
            category: 'Parapharmacie',
            price: 12.0,
            stock: 50,
            requiresPrescription: false,
          },
          {
            id: 'prod_003',
            name: 'Vitamine D3',
            category: 'Compléments',
            price: 15.0,
            stock: 75,
            requiresPrescription: false,
          },
        ],
      },
    });

    // Mock orders list
    await mockApiResponse(page, '**/ecommerce/orders', {
      status: 200,
      body: {
        success: true,
        orders: [
          {
            id: 'order_001',
            patientName: 'Sophie Bernard',
            items: [{ productId: 'prod_001', quantity: 2 }],
            total: 11.0,
            status: 'pending',
          },
        ],
      },
    });
  });

  test('should display product list', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.expectPageLoaded();
    await expect(ecommercePage.productList).toBeVisible();
  });

  test('should browse OTC products', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?category=OTC', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_001',
            name: 'Paracétamol 500mg',
            category: 'OTC',
            price: 5.5,
          },
        ],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.browseOTCProducts();
    await ecommercePage.expectProductInList('prod_001');
  });

  test('should search for products', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?search=**', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_002',
            name: 'Crème hydratante',
          },
        ],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.searchProduct('Crème');
    await expect(ecommercePage.productList).toBeVisible();
  });

  test('should add product to patient cart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/ecommerce/cart/add', {
      status: 200,
      body: {
        success: true,
        cartId: 'cart_001',
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.addProductToPatientCart('prod_001', 'patient_001', 2);
  });

  test('should process online order', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001', {
      status: 200,
      body: {
        success: true,
        order: {
          id: 'order_001',
          status: 'pending',
        },
      },
    });

    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001/process', {
      status: 200,
      body: { success: true },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.viewOnlineOrders();
    await ecommercePage.processOnlineOrder('order_001');
  });

  test('should view online orders list', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.viewOnlineOrders();
    await ecommercePage.expectOrderInList('order_001');
  });

  test('should manage product inventory', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products/prod_001', {
      status: 200,
      body: {
        success: true,
        product: {
          id: 'prod_001',
          stock: 100,
        },
      },
    });

    await mockApiResponse(pharmacistPage, '**/products/prod_001/inventory', {
      status: 200,
      body: { success: true },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.manageProductInventory('prod_001', 150);
  });

  test('should handle product return', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001', {
      status: 200,
      body: {
        success: true,
        order: { id: 'order_001', status: 'completed' },
      },
    });

    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001/return', {
      status: 200,
      body: { success: true },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.viewOnlineOrders();
    await ecommercePage.handleReturn('order_001', 'Product damaged during delivery');
  });

  test('should process refund for returned order', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001', {
      status: 200,
      body: {
        success: true,
        order: { id: 'order_001', status: 'returned' },
      },
    });

    await mockApiResponse(pharmacistPage, '**/ecommerce/orders/order_001/refund', {
      status: 200,
      body: { success: true },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.viewOnlineOrders();
    await ecommercePage.processRefund('order_001');
  });

  test('should generate sales report', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/ecommerce/reports/sales', {
      status: 200,
      body: {
        success: true,
        report: {
          totalRevenue: 25000,
          totalOrders: 156,
          averageOrderValue: 160.26,
          topProducts: [
            { name: 'Paracétamol 500mg', revenue: 5500 },
            { name: 'Crème hydratante', revenue: 3600 },
          ],
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await ecommercePage.generateSalesReport({
      start: monthAgo,
      end: today,
    });
  });

  test('should filter products by category', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?category=Parapharmacie', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_002',
            name: 'Crème hydratante',
            category: 'Parapharmacie',
          },
        ],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.categoryFilter.click();
    await pharmacistPage.getByRole('option', { name: /parapharmacie/i }).click();
    await ecommercePage.expectProductInList('prod_002');
  });

  test('should display product stock levels', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    const productCard = pharmacistPage.locator('[data-testid="product-prod_001"]');
    await expect(productCard.locator('[data-testid="stock-level"]')).toContainText('100');
  });

  test('should handle out of stock products', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products**', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_outofstock',
            name: 'Test Product',
            stock: 0,
            requiresPrescription: false,
          },
        ],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    const productCard = pharmacistPage.locator('[data-testid="product-prod_outofstock"]');
    await expect(productCard.locator('[data-testid="out-of-stock-badge"]')).toBeVisible();
  });
});
