/**
 * Patient E-commerce E2E Tests
 *
 * Tests e-commerce functionality for patients:
 * - Browse OTC products
 * - Search medications
 * - Add to cart
 * - Checkout process
 * - Payment (mock)
 * - Order tracking
 * - View order history
 */

describe('Patient E-commerce', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsPatient();
  });

  beforeEach(async () => {
    await element(by.id('shop-tab')).tap();
    await expect(element(by.id('shop-screen'))).toBeVisible();
  });

  describe('Browse OTC Products', () => {
    it('should display product categories', async () => {
      await expect(element(by.id('categories-section'))).toBeVisible();
      await expect(element(by.id('category-pain-relief'))).toBeVisible();
      await expect(element(by.id('category-vitamins'))).toBeVisible();
      await expect(element(by.id('category-first-aid'))).toBeVisible();
    });

    it('should browse products by category', async () => {
      await element(by.id('category-pain-relief')).tap();
      await expect(element(by.id('products-list'))).toBeVisible();
      await expect(element(by.id('product-0'))).toBeVisible();
    });

    it('should view product details', async () => {
      await element(by.id('category-pain-relief')).tap();
      await element(by.id('product-0')).tap();

      await expect(element(by.id('product-detail-screen'))).toBeVisible();
      await expect(element(by.id('product-name'))).toBeVisible();
      await expect(element(by.id('product-price'))).toBeVisible();
      await expect(element(by.id('product-description'))).toBeVisible();
      await expect(element(by.id('add-to-cart-button'))).toBeVisible();
    });

    it('should view product images', async () => {
      await element(by.id('category-vitamins')).tap();
      await element(by.id('product-0')).tap();

      await expect(element(by.id('product-image'))).toBeVisible();
      await element(by.id('product-image')).swipe('left');
      await expect(element(by.id('product-image-1'))).toBeVisible();
    });
  });

  describe('Search Medications', () => {
    it('should search for products', async () => {
      await element(by.id('search-input')).typeText('Aspirin');
      await element(by.id('search-button')).tap();

      await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('search-result-0'))).toBeVisible();
    });

    it('should filter search results', async () => {
      await element(by.id('search-input')).typeText('Vitamins');
      await element(by.id('search-button')).tap();
      await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(3000);

      await element(by.id('filter-button')).tap();
      await element(by.id('filter-price-low-to-high')).tap();
      await element(by.id('apply-filter')).tap();

      await expect(element(by.id('active-filter-badge'))).toHaveText('Price: Low to High');
    });
  });

  describe('Add to Cart', () => {
    it('should add product to cart', async () => {
      await element(by.id('category-pain-relief')).tap();
      await element(by.id('product-0')).tap();
      await element(by.id('add-to-cart-button')).tap();

      await expect(element(by.id('added-to-cart-notification'))).toBeVisible();
      await expect(element(by.id('cart-badge'))).toHaveText('1');
    });

    it('should update product quantity', async () => {
      await addProductToCart();
      await element(by.id('cart-button')).tap();

      await element(by.id('cart-item-0-increase')).tap();
      await expect(element(by.id('cart-item-0-quantity'))).toHaveText('2');
    });

    it('should remove product from cart', async () => {
      await addProductToCart();
      await element(by.id('cart-button')).tap();

      await element(by.id('cart-item-0-remove')).tap();
      await expect(element(by.id('cart-empty-message'))).toBeVisible();
    });

    it('should view cart total', async () => {
      await addProductToCart();
      await element(by.id('cart-button')).tap();

      await expect(element(by.id('cart-subtotal'))).toBeVisible();
      await expect(element(by.id('cart-tax'))).toBeVisible();
      await expect(element(by.id('cart-total'))).toBeVisible();
    });
  });

  describe('Checkout Process', () => {
    beforeEach(async () => {
      await addProductToCart();
      await element(by.id('cart-button')).tap();
      await element(by.id('checkout-button')).tap();
    });

    it('should enter delivery address', async () => {
      await expect(element(by.id('checkout-screen'))).toBeVisible();
      await element(by.id('address-line1-input')).typeText('123 Main Street');
      await element(by.id('city-input')).typeText('Lausanne');
      await element(by.id('postal-code-input')).typeText('1000');
      await element(by.id('continue-to-payment-button')).tap();

      await expect(element(by.id('payment-screen'))).toBeVisible();
    });

    it('should select delivery time', async () => {
      await fillDeliveryAddress();

      await element(by.id('delivery-time-picker')).tap();
      await element(by.text('Tomorrow, 2-4 PM')).tap();
      await expect(element(by.id('selected-delivery-time'))).toContain('Tomorrow, 2-4 PM');
    });
  });

  describe('Payment', () => {
    beforeEach(async () => {
      await addProductToCart();
      await element(by.id('cart-button')).tap();
      await element(by.id('checkout-button')).tap();
      await fillDeliveryAddress();
    });

    it('should add credit card payment', async () => {
      await element(by.id('payment-method-card')).tap();
      await element(by.id('card-number-input')).typeText('4242424242424242');
      await element(by.id('card-expiry-input')).typeText('12/25');
      await element(by.id('card-cvc-input')).typeText('123');
      await element(by.id('card-name-input')).typeText('John Smith');

      await expect(element(by.id('place-order-button'))).toBeEnabled();
    });

    it('should use saved payment method', async () => {
      await expect(element(by.id('saved-card-0'))).toBeVisible();
      await element(by.id('saved-card-0')).tap();
      await expect(element(by.id('place-order-button'))).toBeEnabled();
    });

    it('should place order successfully', async () => {
      await element(by.id('payment-method-card')).tap();
      await element(by.id('saved-card-0')).tap();
      await element(by.id('place-order-button')).tap();

      await waitFor(element(by.id('order-confirmation-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('order-number'))).toBeVisible();
      await expect(element(by.id('confirmation-message'))).toHaveText('Order placed successfully');
    });
  });

  describe('Order Tracking', () => {
    beforeEach(async () => {
      await placeOrder();
    });

    it('should view order status', async () => {
      await element(by.id('orders-tab')).tap();
      await expect(element(by.id('orders-list'))).toBeVisible();
      await expect(element(by.id('order-0'))).toBeVisible();
      await expect(element(by.id('order-0-status'))).toBeVisible();
    });

    it('should track delivery in real-time', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('order-0')).tap();

      await expect(element(by.id('order-tracking-screen'))).toBeVisible();
      await expect(element(by.id('delivery-map'))).toBeVisible();
      await expect(element(by.id('delivery-status'))).toBeVisible();
    });

    it('should contact delivery person', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('order-0')).tap();

      await expect(element(by.id('contact-delivery-button'))).toBeVisible();
      await element(by.id('contact-delivery-button')).tap();
      await expect(element(by.id('contact-options'))).toBeVisible();
    });
  });

  describe('Order History', () => {
    it('should view past orders', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('history-filter')).tap();

      await expect(element(by.id('past-orders-list'))).toBeVisible();
      await expect(element(by.id('past-order-0'))).toBeVisible();
    });

    it('should reorder from history', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('past-order-0')).tap();
      await element(by.id('reorder-button')).tap();

      await expect(element(by.id('cart-screen'))).toBeVisible();
      await expect(element(by.id('cart-item-0'))).toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function loginAsPatient() {
  await element(by.id('login-button')).tap();
  await element(by.id('login-email-input')).typeText('patient@example.com');
  await element(by.id('login-password-input')).typeText('ValidPassword123!');
  await element(by.id('login-submit-button')).tap();
  await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
}

async function addProductToCart() {
  await element(by.id('category-pain-relief')).tap();
  await element(by.id('product-0')).tap();
  await element(by.id('add-to-cart-button')).tap();
  await waitFor(element(by.id('added-to-cart-notification'))).toBeVisible().withTimeout(3000);
}

async function fillDeliveryAddress() {
  await element(by.id('address-line1-input')).typeText('123 Main Street');
  await element(by.id('city-input')).typeText('Lausanne');
  await element(by.id('postal-code-input')).typeText('1000');
  await element(by.id('continue-to-payment-button')).tap();
}

async function placeOrder() {
  await addProductToCart();
  await element(by.id('cart-button')).tap();
  await element(by.id('checkout-button')).tap();
  await fillDeliveryAddress();
  await element(by.id('saved-card-0')).tap();
  await element(by.id('place-order-button')).tap();
  await waitFor(element(by.id('order-confirmation-screen'))).toBeVisible().withTimeout(10000);
}
