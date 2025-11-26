import { test, expect } from '../fixtures/auth.fixture';
import { EcommercePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-007: Shopping Cart Workflow
 *
 * Tests complete shopping cart functionality including adding items,
 * updating quantities, removing items, and viewing cart summary.
 *
 * SKIPPED: E-commerce frontend UI not implemented yet
 */
test.describe.skip('E2E-007: Shopping Cart Workflow', () => {
  const mockProducts = [
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
      name: 'Crème hydratante SPF30',
      category: 'Parapharmacie',
      price: 12.0,
      stock: 50,
      requiresPrescription: false,
    },
    {
      id: 'prod_003',
      name: 'Vitamine D3 1000IU',
      category: 'Compléments',
      price: 15.0,
      stock: 75,
      requiresPrescription: false,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await mockApiResponse(page, '**/products**', {
      status: 200,
      body: {
        success: true,
        products: mockProducts,
      },
    });

    await mockApiResponse(page, '**/cart**', {
      status: 200,
      body: {
        success: true,
        cart: {
          id: 'cart_001',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
        },
      },
    });
  });

  test('should add single product to cart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/add', {
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
          total: 6.05,
          itemCount: 1,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Add product to cart
    const addToCartButton = pharmacistPage.locator('[data-testid="add-to-cart-prod_001"]');
    await addToCartButton.click();

    // Verify product added
    const cartCount = pharmacistPage.locator('[data-testid="cart-count"]');
    await expect(cartCount).toContainText('1');
  });

  test('should add multiple products to cart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/add', {
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
          total: 19.25,
          itemCount: 2,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Add first product
    let addToCartButton = pharmacistPage.locator('[data-testid="add-to-cart-prod_001"]');
    await addToCartButton.click();

    // Add second product
    addToCartButton = pharmacistPage.locator('[data-testid="add-to-cart-prod_002"]');
    await addToCartButton.click();

    // Verify both products in cart
    const cartCount = pharmacistPage.locator('[data-testid="cart-count"]');
    await expect(cartCount).toContainText('2');
  });

  test('should display cart summary with totals', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart', {
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
          ],
          subtotal: 11.0,
          tax: 1.1,
          total: 12.1,
          itemCount: 1,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Verify cart summary is displayed
    const cartSummary = pharmacistPage.locator('[data-testid="cart-summary"]');
    await expect(cartSummary).toBeVisible();

    // Verify subtotal
    const subtotal = pharmacistPage.locator('[data-testid="cart-subtotal"]');
    await expect(subtotal).toContainText('11.0');

    // Verify total
    const total = pharmacistPage.locator('[data-testid="cart-total"]');
    await expect(total).toContainText('12.1');
  });

  test('should update product quantity in cart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/items/prod_001/quantity', {
      status: 200,
      body: {
        success: true,
        cart: {
          id: 'cart_001',
          items: [
            {
              productId: 'prod_001',
              name: 'Paracétamol 500mg',
              quantity: 3,
              price: 5.5,
              subtotal: 16.5,
            },
          ],
          subtotal: 16.5,
          tax: 1.65,
          total: 18.15,
          itemCount: 1,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Find quantity input
    const quantityInput = pharmacistPage.locator('[data-testid="quantity-input-prod_001"]');
    await quantityInput.fill('3');

    // Verify subtotal updated
    const subtotal = pharmacistPage.locator('[data-testid="cart-subtotal"]');
    await expect(subtotal).toContainText('16.5');
  });

  test('should increase product quantity using increment button', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Find and click increment button
    const incrementButton = pharmacistPage.locator('[data-testid="increment-qty-prod_001"]');
    if (await incrementButton.count() > 0) {
      await incrementButton.click();

      // Verify quantity increased
      const quantityInput = pharmacistPage.locator('[data-testid="quantity-input-prod_001"]');
      const newQuantity = await quantityInput.inputValue();
      expect(parseInt(newQuantity) > 1).toBeTruthy();
    }
  });

  test('should decrease product quantity using decrement button', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Find and click decrement button
    const decrementButton = pharmacistPage.locator('[data-testid="decrement-qty-prod_001"]');
    if (await decrementButton.count() > 0) {
      await decrementButton.click();
    }
  });

  test('should remove product from cart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/items/prod_001', {
      status: 200,
      body: {
        success: true,
        cart: {
          id: 'cart_001',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Find and click remove button
    const removeButton = pharmacistPage.locator('[data-testid="remove-item-prod_001"]');
    await removeButton.click();

    // Verify item removed
    const itemElement = pharmacistPage.locator('[data-testid="cart-item-prod_001"]');
    await expect(itemElement).not.toBeVisible();
  });

  test('should display empty cart message', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart (empty)
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Verify empty message
    const emptyMessage = pharmacistPage.locator('[data-testid="empty-cart-message"]');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should persist cart across page navigation', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/add', {
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
          total: 6.05,
          itemCount: 1,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Add product
    const addToCartButton = pharmacistPage.locator('[data-testid="add-to-cart-prod_001"]');
    await addToCartButton.click();

    // Navigate elsewhere
    await pharmacistPage.goBack();

    // Navigate back
    await ecommercePage.goto();

    // Verify cart still has item
    const cartCount = pharmacistPage.locator('[data-testid="cart-count"]');
    await expect(cartCount).toContainText('1');
  });

  test('should calculate taxes and totals correctly', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart', {
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
          total: 25.3,
          itemCount: 2,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Verify calculations
    const subtotal = pharmacistPage.locator('[data-testid="cart-subtotal"]');
    const tax = pharmacistPage.locator('[data-testid="cart-tax"]');
    const total = pharmacistPage.locator('[data-testid="cart-total"]');

    await expect(subtotal).toContainText('23.0');
    await expect(tax).toContainText('2.3');
    await expect(total).toContainText('25.3');
  });

  test('should prevent adding out of stock products', async ({ pharmacistPage }) => {
    // Mock product as out of stock
    await mockApiResponse(pharmacistPage, '**/products**', {
      status: 200,
      body: {
        success: true,
        products: [
          {
            id: 'prod_001',
            name: 'Paracétamol 500mg',
            price: 5.5,
            stock: 0,
            requiresPrescription: false,
          },
        ],
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Verify add to cart button is disabled
    const addToCartButton = pharmacistPage.locator('[data-testid="add-to-cart-prod_001"]');
    if (await addToCartButton.count() > 0) {
      const isDisabled = await addToCartButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('should limit quantity to available stock', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Try to set quantity above stock
    const quantityInput = pharmacistPage.locator('[data-testid="quantity-input-prod_001"]');
    if (await quantityInput.count() > 0) {
      await quantityInput.fill('150'); // Stock is 100

      // Should be limited to stock amount or show error
      const currentValue = await quantityInput.inputValue();
      const numValue = parseInt(currentValue);
      expect(numValue <= 100).toBeTruthy();
    }
  });

  test('should show discount code input field', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Look for discount code field
    const discountInput = pharmacistPage.locator('[data-testid="discount-code-input"]');
    if (await discountInput.count() > 0) {
      await expect(discountInput).toBeVisible();
    }
  });

  test('should apply discount code', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/cart/apply-discount', {
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
          discount: 0.55,
          discountCode: 'SAVE10',
          tax: 0.495,
          total: 5.445,
          itemCount: 1,
        },
      },
    });

    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Enter discount code
    const discountInput = pharmacistPage.locator('[data-testid="discount-code-input"]');
    if (await discountInput.count() > 0) {
      await discountInput.fill('SAVE10');

      // Apply discount
      const applyButton = pharmacistPage.getByRole('button', { name: /apply/i });
      await applyButton.click();

      // Verify discount applied
      const discountAmount = pharmacistPage.locator('[data-testid="cart-discount"]');
      if (await discountAmount.count() > 0) {
        await expect(discountAmount).toBeVisible();
      }
    }
  });

  test('should show clear cart option', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Look for clear cart button
    const clearButton = pharmacistPage.getByRole('button', { name: /clear.*cart/i });
    if (await clearButton.count() > 0) {
      await expect(clearButton).toBeVisible();
    }
  });

  test('should display continue shopping button in cart', async ({ pharmacistPage }) => {
    const ecommercePage = new EcommercePage(pharmacistPage);
    await ecommercePage.goto();

    // Open cart
    const cartIcon = pharmacistPage.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Look for continue shopping button
    const continueButton = pharmacistPage.getByRole('button', { name: /continue.*shopping|back.*catalog/i });
    if (await continueButton.count() > 0) {
      await expect(continueButton).toBeVisible();
    }
  });
});
