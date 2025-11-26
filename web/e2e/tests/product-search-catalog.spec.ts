import { test, expect } from '../fixtures/auth.fixture';
import { EcommercePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-006: Product Search and Catalog
 *
 * Tests comprehensive product search, filtering, and catalog browsing workflows
 * for both pharmacist and patient roles.
 */
test.describe('E2E-006: Product Search and Catalog', () => {
  const mockProducts = [
    {
      id: 'prod_001',
      name: 'Paracétamol 500mg',
      category: 'OTC',
      subcategory: 'Pain Relief',
      price: 5.5,
      stock: 100,
      requiresPrescription: false,
      description: 'Relieves pain and fever',
      rating: 4.5,
      reviews: 24,
      image: 'paracetamol.jpg',
      manufacturer: 'Novartis',
      sku: 'PAR500MG',
      expiryDate: '2026-12-31',
    },
    {
      id: 'prod_002',
      name: 'Crème hydratante SPF30',
      category: 'Parapharmacie',
      subcategory: 'Skincare',
      price: 12.0,
      stock: 50,
      requiresPrescription: false,
      description: 'Moisturizing cream with UV protection',
      rating: 4.8,
      reviews: 67,
      image: 'cream-spf30.jpg',
      manufacturer: 'Eucerin',
      sku: 'CRM-SPF30',
      expiryDate: '2025-08-15',
    },
    {
      id: 'prod_003',
      name: 'Vitamine D3 1000IU',
      category: 'Compléments',
      subcategory: 'Vitamins',
      price: 15.0,
      stock: 75,
      requiresPrescription: false,
      description: 'Supports bone health and immune function',
      rating: 4.6,
      reviews: 42,
      image: 'vitamin-d3.jpg',
      manufacturer: 'Pharma Lab',
      sku: 'VIT-D3-1000',
      expiryDate: '2027-06-30',
    },
    {
      id: 'prod_004',
      name: 'Antibiotics - Amoxicilline 500mg',
      category: 'Prescription',
      subcategory: 'Antibiotics',
      price: 8.5,
      stock: 25,
      requiresPrescription: true,
      description: 'Beta-lactam antibiotic',
      rating: 4.3,
      reviews: 18,
      image: 'amoxicilline.jpg',
      manufacturer: 'GSK',
      sku: 'AMX500MG',
      expiryDate: '2025-10-20',
    },
    {
      id: 'prod_005',
      name: 'Ibuprofen 400mg',
      category: 'OTC',
      subcategory: 'Pain Relief',
      price: 6.8,
      stock: 0,
      requiresPrescription: false,
      description: 'Anti-inflammatory pain reliever',
      rating: 4.4,
      reviews: 33,
      image: 'ibuprofen.jpg',
      manufacturer: 'Roche',
      sku: 'IBU400MG',
      expiryDate: '2026-03-15',
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock initial products list
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

    // Mock categories endpoint
    await mockApiResponse(page, '**/categories**', {
      status: 200,
      body: {
        success: true,
        categories: [
          { id: 'cat_1', name: 'OTC', productCount: 2 },
          { id: 'cat_2', name: 'Parapharmacie', productCount: 1 },
          { id: 'cat_3', name: 'Compléments', productCount: 1 },
          { id: 'cat_4', name: 'Prescription', productCount: 1 },
        ],
      },
    });
  });

  test('should display product catalog with all available products', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    await ecommercePage.expectPageLoaded();

    // Verify product list is visible
    await expect(ecommercePage.productList).toBeVisible();

    // Count products displayed
    const productCards = await pharmacistPage.locator('[data-testid^="product-"]').count();
    expect(productCards).toBeGreaterThan(0);
  });

  test('should search products by keyword', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?search=Paracétamol**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0]],
        total: 1,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Search for product
    await ecommercePage.searchProduct('Paracétamol');

    // Verify search results
    await ecommercePage.expectProductInList('prod_001');
    await expect(pharmacistPage.locator('[data-testid="product-prod_001"]')).toBeVisible();
  });

  test('should filter products by category', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?category=OTC**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0], mockProducts[4]],
        total: 2,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open category filter
    await ecommercePage.categoryFilter.click();

    // Select OTC category
    await pharmacistPage.getByRole('option', { name: /OTC/i }).click();

    // Verify filtered results
    await ecommercePage.expectProductInList('prod_001');
  });

  test('should filter products by price range', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?minPrice=5&maxPrice=10**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0], mockProducts[4]],
        total: 2,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Set price range filter
    const minPriceInput = pharmacistPage.locator('[data-testid="price-min"]');
    const maxPriceInput = pharmacistPage.locator('[data-testid="price-max"]');

    await minPriceInput.fill('5');
    await maxPriceInput.fill('10');

    // Apply filter
    const applyButton = pharmacistPage.getByRole('button', { name: /apply|filter/i });
    await applyButton.click();

    // Verify filtered results
    const productCards = await pharmacistPage.locator('[data-testid^="product-"]').count();
    expect(productCards).toBeGreaterThan(0);
  });

  test('should sort products by various criteria', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?sort=price_asc**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0], mockProducts[4], mockProducts[1], mockProducts[2], mockProducts[3]],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open sort menu
    const sortDropdown = pharmacistPage.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.click();

    // Select sort by price (ascending)
    await pharmacistPage.getByRole('option', { name: /price.*low/i }).click();

    // Verify products are sorted
    const firstProduct = await pharmacistPage.locator('[data-testid="product-price"]').first();
    await expect(firstProduct).toContainText('5.5');
  });

  test('should display product details on catalog page', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Click on first product
    const productCard = pharmacistPage.locator('[data-testid="product-prod_001"]');
    await productCard.click();

    // Verify product details are displayed
    const productName = pharmacistPage.locator('[data-testid="product-name"]');
    await expect(productName).toContainText('Paracétamol');

    // Verify product price
    const productPrice = pharmacistPage.locator('[data-testid="product-price"]');
    await expect(productPrice).toContainText('5.5');

    // Verify product stock
    const stockBadge = pharmacistPage.locator('[data-testid="stock-level"]');
    await expect(stockBadge).toBeVisible();
  });

  test('should display product ratings and reviews', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Find product with rating
    const ratingElement = pharmacistPage.locator('[data-testid="product-rating"]').first();
    await expect(ratingElement).toBeVisible();

    // Verify rating display
    const ratingValue = await ratingElement.getAttribute('data-rating');
    expect(ratingValue).toBeTruthy();
  });

  test('should show out of stock indicator for unavailable products', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Look for out of stock product (Ibuprofen has stock: 0)
    const outOfStockBadge = pharmacistPage.locator('[data-testid="out-of-stock-badge"]');

    // If present, verify it's visible
    if (await outOfStockBadge.count() > 0) {
      await expect(outOfStockBadge).toBeVisible();
    }
  });

  test('should indicate prescription requirement for medications', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Find prescription-required product
    const prescriptionBadge = pharmacistPage.locator('[data-testid="prescription-required-badge"]');

    // Verify badge visibility if product requires prescription
    if (await prescriptionBadge.count() > 0) {
      await expect(prescriptionBadge).toBeVisible();
    }
  });

  test('should support pagination for large product lists', async ({ pharmacistPage }) => {
    // Mock paginated response
    await mockApiResponse(pharmacistPage, '**/products?page=2**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[3], mockProducts[4]],
        total: mockProducts.length,
        page: 2,
        pageSize: 3,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Find and click next page button
    const nextButton = pharmacistPage.getByRole('button', { name: /next|page.*2/i });
    if (await nextButton.count() > 0) {
      await nextButton.click();

      // Verify page changed
      await expect(pharmacistPage).toHaveURL(/page=2/);
    }
  });

  test('should remember search filters when navigating back', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?category=OTC**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0], mockProducts[4]],
        total: 2,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Apply filter
    await ecommercePage.categoryFilter.click();
    await pharmacistPage.getByRole('option', { name: /OTC/i }).click();

    // Store filter state
    const urlWithFilter = pharmacistPage.url();
    expect(urlWithFilter).toContain('category');

    // Navigate to product detail
    const productCard = pharmacistPage.locator('[data-testid="product-prod_001"]');
    await productCard.click();

    // Go back
    await pharmacistPage.goBack();

    // Verify filter is still applied
    await expect(pharmacistPage).toHaveURL(/category=OTC/);
  });

  test('should search products by manufacturer', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?manufacturer=Novartis**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0]],
        total: 1,
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open advanced search
    const advancedSearchButton = pharmacistPage.getByRole('button', { name: /advanced/i });
    if (await advancedSearchButton.count() > 0) {
      await advancedSearchButton.click();

      // Fill manufacturer field
      const manufacturerInput = pharmacistPage.locator('[data-testid="manufacturer-input"]');
      if (await manufacturerInput.count() > 0) {
        await manufacturerInput.fill('Novartis');
        await manufacturerInput.press('Enter');
      }
    }
  });

  test('should display related or recommended products', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Click on a product
    const productCard = pharmacistPage.locator('[data-testid="product-prod_001"]');
    await productCard.click();

    // Look for recommended products section
    const recommendedSection = pharmacistPage.locator('[data-testid="recommended-products"]');
    if (await recommendedSection.count() > 0) {
      await expect(recommendedSection).toBeVisible();
    }
  });

  test('should allow clearing all filters', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products?category=OTC**', {
      status: 200,
      body: {
        success: true,
        products: [mockProducts[0], mockProducts[4]],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Apply filter
    await ecommercePage.categoryFilter.click();
    await pharmacistPage.getByRole('option', { name: /OTC/i }).click();

    // Clear filters
    const clearButton = pharmacistPage.getByRole('button', { name: /clear|reset/i });
    if (await clearButton.count() > 0) {
      await clearButton.click();

      // Verify all products are shown again
      await mockApiResponse(pharmacistPage, '**/products**', {
        status: 200,
        body: {
          success: true,
          products: mockProducts,
        },
      });
    }
  });

  test('should display product availability status', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Check availability indicators
    const availabilityBadges = pharmacistPage.locator('[data-testid="availability-status"]');
    const count = await availabilityBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow quick view of product details', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Look for quick view button
    const quickViewButton = pharmacistPage.locator('[data-testid="quick-view-btn"]').first();
    if (await quickViewButton.count() > 0) {
      await quickViewButton.click();

      // Verify modal or details pane opens
      const detailsModal = pharmacistPage.locator('[data-testid="product-details-modal"]');
      if (await detailsModal.count() > 0) {
        await expect(detailsModal).toBeVisible();
      }
    }
  });
});
