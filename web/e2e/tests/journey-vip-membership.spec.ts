import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E Journey Test: VIP Membership (Golden MetaPharm) Journey
 *
 * This test covers the complete VIP membership flow:
 * 1. Patient views Golden MetaPharm program benefits
 * 2. Patient compares subscription tiers (Silver, Gold, Platinum)
 * 3. Patient subscribes to VIP program
 * 4. Patient receives VIP membership confirmation
 * 5. VIP benefits applied to orders (priority delivery, discounts)
 * 6. Patient uses exclusive VIP features (priority teleconsultation, dedicated support)
 * 7. VIP discount calculation on checkout
 * 8. Patient views VIP dashboard with savings and benefits used
 *
 * This is a KEY monetization feature for MetaPharm Connect platform.
 */

test.describe('VIP Membership (Golden MetaPharm) Journey', () => {
  const patientId = 'patient_vip_001';
  const membershipId = 'membership_001';
  const orderId = 'order_vip_001';

  /**
   * Journey Step 1-2: Patient views VIP program and compares tiers
   */
  test('should display Golden MetaPharm program with subscription tiers', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);
    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Mock VIP program details
    await mockApiResponse(patientPage, '**/vip/program-details', {
      status: 200,
      body: {
        success: true,
        data: {
          tiers: [
            {
              id: 'silver',
              name: 'Silver',
              price: 9.99,
              currency: 'CHF',
              billingCycle: 'monthly',
              benefits: [
                { id: 'discount_5', name: '5% discount on all orders', icon: 'discount' },
                { id: 'free_delivery_50', name: 'Free delivery on orders over 50 CHF', icon: 'delivery' },
                { id: 'priority_support', name: 'Priority customer support', icon: 'support' },
                { id: 'monthly_health_tips', name: 'Monthly health newsletter', icon: 'newsletter' },
              ],
            },
            {
              id: 'gold',
              name: 'Gold',
              price: 19.99,
              currency: 'CHF',
              billingCycle: 'monthly',
              popular: true,
              benefits: [
                { id: 'discount_10', name: '10% discount on all orders', icon: 'discount' },
                { id: 'free_delivery_all', name: 'Free delivery on all orders', icon: 'delivery' },
                { id: 'priority_teleconsult', name: 'Priority teleconsultation booking', icon: 'video' },
                { id: 'priority_support', name: 'Priority customer support', icon: 'support' },
                { id: 'health_tracking', name: 'Advanced health tracking', icon: 'health' },
                { id: 'quarterly_checkup', name: 'Quarterly health check-up', icon: 'checkup' },
              ],
            },
            {
              id: 'platinum',
              name: 'Platinum',
              price: 29.99,
              currency: 'CHF',
              billingCycle: 'monthly',
              benefits: [
                { id: 'discount_15', name: '15% discount on all orders', icon: 'discount' },
                { id: 'free_delivery_all', name: 'Free delivery on all orders', icon: 'delivery' },
                { id: 'express_delivery', name: 'Express delivery (1-2 hours)', icon: 'express' },
                { id: 'priority_teleconsult', name: 'Priority teleconsultation booking', icon: 'video' },
                { id: 'dedicated_pharmacist', name: 'Dedicated personal pharmacist', icon: 'pharmacist' },
                { id: '24_7_support', name: '24/7 customer support', icon: 'support' },
                { id: 'health_tracking_premium', name: 'Premium health tracking & AI insights', icon: 'ai' },
                { id: 'monthly_checkup', name: 'Monthly health check-up', icon: 'checkup' },
                { id: 'annual_wellness', name: 'Annual wellness program', icon: 'wellness' },
              ],
            },
          ],
          savings: {
            silver: { monthly: 25, yearly: 300 },
            gold: { monthly: 75, yearly: 900 },
            platinum: { monthly: 150, yearly: 1800 },
          },
        },
      },
    });

    // Navigate to VIP program page
    await patientPage.getByRole('link', { name: /golden metapharm|vip|premium/i }).click();

    // Verify page loaded
    await expect(patientPage.getByRole('heading', { name: /golden metapharm/i })).toBeVisible();
    await expect(patientPage.getByText(/exclusive benefits|avantages exclusifs/i)).toBeVisible();

    // Verify all tiers displayed
    await expect(patientPage.locator('[data-testid="tier-silver"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="tier-gold"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="tier-platinum"]')).toBeVisible();

    // Verify tier details - Silver
    const silverTier = patientPage.locator('[data-testid="tier-silver"]');
    await expect(silverTier.getByText('9.99 CHF')).toBeVisible();
    await expect(silverTier.getByText(/5% discount/i)).toBeVisible();
    await expect(silverTier.getByText(/free delivery.*50 CHF/i)).toBeVisible();

    // Verify tier details - Gold (most popular)
    const goldTier = patientPage.locator('[data-testid="tier-gold"]');
    await expect(goldTier.locator('[data-testid="popular-badge"]')).toBeVisible();
    await expect(goldTier.getByText('19.99 CHF')).toBeVisible();
    await expect(goldTier.getByText(/10% discount/i)).toBeVisible();
    await expect(goldTier.getByText(/priority teleconsultation/i)).toBeVisible();

    // Verify tier details - Platinum
    const platinumTier = patientPage.locator('[data-testid="tier-platinum"]');
    await expect(platinumTier.getByText('29.99 CHF')).toBeVisible();
    await expect(platinumTier.getByText(/15% discount/i)).toBeVisible();
    await expect(platinumTier.getByText(/dedicated personal pharmacist/i)).toBeVisible();
    await expect(platinumTier.getByText(/24\/7 support/i)).toBeVisible();

    // Verify savings calculator
    await expect(patientPage.locator('[data-testid="savings-calculator"]')).toBeVisible();
    await expect(patientPage.getByText(/save up to.*1800 CHF/i)).toBeVisible();

    await patientPage.close();
  });

  /**
   * Journey Step 3-4: Patient subscribes and receives confirmation
   */
  test('should allow patient to subscribe to Gold VIP tier', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock VIP program details
    await mockApiResponse(patientPage, '**/vip/program-details', {
      status: 200,
      body: {
        success: true,
        data: {
          tiers: [
            { id: 'gold', name: 'Gold', price: 19.99, popular: true },
          ],
        },
      },
    });

    // Mock subscription endpoint
    await mockApiResponse(patientPage, '**/vip/subscribe', {
      status: 201,
      body: {
        success: true,
        membershipId: membershipId,
        tier: 'gold',
        status: 'active',
        startDate: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        benefits: [
          { id: 'discount_10', active: true },
          { id: 'free_delivery_all', active: true },
          { id: 'priority_teleconsult', active: true },
        ],
      },
    });

    // Mock payment method validation
    await mockApiResponse(patientPage, '**/patient/payment-methods', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'card_001',
            type: 'credit_card',
            last4: '4242',
            brand: 'Visa',
            default: true,
          },
        ],
      },
    });

    // Navigate to VIP program
    await patientPage.getByRole('link', { name: /golden metapharm|vip/i }).click();

    // Select Gold tier
    await patientPage.locator('[data-testid="tier-gold"]').click();
    await patientPage.getByRole('button', { name: /s'abonner|subscribe/i }).click();

    // Verify subscription modal
    await expect(patientPage.locator('[data-testid="subscription-modal"]')).toBeVisible();
    await expect(patientPage.getByText('Gold')).toBeVisible();
    await expect(patientPage.getByText('19.99 CHF/month')).toBeVisible();

    // Verify payment method displayed
    await expect(patientPage.getByText('Visa •••• 4242')).toBeVisible();

    // Accept terms
    await patientPage.locator('[data-testid="terms-checkbox"]').check();

    // Confirm subscription
    await patientPage.getByRole('button', { name: /confirmer|confirm subscription/i }).click();

    // Verify subscription success
    await expect(patientPage.locator('[data-testid="success-modal"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="success-modal"]')).toContainText(/welcome.*golden metapharm/i);
    await expect(patientPage.locator('[data-testid="membership-id"]')).toContainText(membershipId);

    // Verify benefits summary displayed
    await expect(patientPage.getByText(/10% discount.*active/i)).toBeVisible();
    await expect(patientPage.getByText(/free delivery.*active/i)).toBeVisible();
    await expect(patientPage.getByText(/priority teleconsultation.*active/i)).toBeVisible();

    // Close success modal
    await patientPage.getByRole('button', { name: /commencer|get started/i }).click();

    // Verify redirected to VIP dashboard
    await expect(patientPage).toHaveURL(/.*\/vip\/dashboard/);
    await expect(patientPage.locator('[data-testid="vip-badge"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="vip-badge"]')).toContainText('Gold');

    await patientPage.close();
  });

  /**
   * Journey Step 5-7: VIP benefits applied to orders with discount calculation
   */
  test('should apply VIP discount and free delivery to order', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock VIP membership status
    await mockApiResponse(patientPage, '**/vip/membership', {
      status: 200,
      body: {
        success: true,
        data: {
          id: membershipId,
          tier: 'gold',
          status: 'active',
          discountPercentage: 10,
          freeDelivery: true,
          benefits: ['discount_10', 'free_delivery_all', 'priority_teleconsult'],
        },
      },
    });

    // Mock product catalog
    await mockApiResponse(patientPage, '**/products**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'prod_001',
            name: 'Ibuprofen 400mg',
            price: 12.50,
            category: 'OTC',
          },
          {
            id: 'prod_002',
            name: 'Vitamin D 1000 IU',
            price: 18.90,
            category: 'Supplements',
          },
        ],
      },
    });

    // Mock cart
    await mockApiResponse(patientPage, '**/cart/add', {
      status: 200,
      body: { success: true },
    });

    // Mock checkout with VIP discount
    await mockApiResponse(patientPage, '**/cart', {
      status: 200,
      body: {
        success: true,
        data: {
          items: [
            { productId: 'prod_001', name: 'Ibuprofen 400mg', quantity: 2, price: 12.50, subtotal: 25.00 },
            { productId: 'prod_002', name: 'Vitamin D 1000 IU', quantity: 1, price: 18.90, subtotal: 18.90 },
          ],
          subtotal: 43.90,
          vipDiscount: 4.39, // 10% of 43.90
          deliveryFee: 0.00, // Free for VIP Gold
          total: 39.51,
          vipSavings: 9.39, // Discount + delivery fee saved (5.00)
        },
      },
    });

    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Verify VIP badge visible in header
    await expect(patientPage.locator('[data-testid="vip-badge-header"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="vip-badge-header"]')).toContainText('Gold');

    // Navigate to product catalog
    await patientPage.getByRole('link', { name: /produits|products|shop/i }).click();

    // Add products to cart
    await patientPage.locator('[data-testid="product-prod_001"]').click();
    await patientPage.locator('[data-testid="quantity"]').fill('2');
    await patientPage.getByRole('button', { name: /ajouter au panier|add to cart/i }).click();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();

    await patientPage.goBack();
    await patientPage.locator('[data-testid="product-prod_002"]').click();
    await patientPage.getByRole('button', { name: /ajouter au panier|add to cart/i }).click();

    // Go to cart
    await patientPage.locator('[data-testid="cart-button"]').click();

    // Verify cart items
    await expect(patientPage.getByText('Ibuprofen 400mg')).toBeVisible();
    await expect(patientPage.getByText('Vitamin D 1000 IU')).toBeVisible();

    // Verify VIP discount badge visible
    await expect(patientPage.locator('[data-testid="vip-discount-badge"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="vip-discount-badge"]')).toContainText('Gold - 10%');

    // Verify price breakdown
    await expect(patientPage.locator('[data-testid="subtotal"]')).toContainText('43.90');
    await expect(patientPage.locator('[data-testid="vip-discount"]')).toContainText('-4.39'); // 10% discount
    await expect(patientPage.locator('[data-testid="delivery-fee"]')).toContainText('0.00'); // Free delivery
    await expect(patientPage.locator('[data-testid="vip-savings"]')).toContainText('9.39'); // Total savings
    await expect(patientPage.locator('[data-testid="total"]')).toContainText('39.51');

    // Verify VIP savings callout
    await expect(patientPage.locator('[data-testid="vip-savings-callout"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="vip-savings-callout"]')).toContainText(/vous économisez.*9.39 CHF.*gold/i);

    // Proceed to checkout
    await patientPage.getByRole('button', { name: /commander|checkout/i }).click();

    // Verify VIP discount maintained on checkout page
    await expect(patientPage.locator('[data-testid="checkout-vip-discount"]')).toContainText('4.39');
    await expect(patientPage.locator('[data-testid="checkout-total"]')).toContainText('39.51');

    await patientPage.close();
  });

  /**
   * Journey Step 6: Patient uses exclusive VIP features
   */
  test('should allow VIP member to access priority teleconsultation booking', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock VIP membership status
    await mockApiResponse(patientPage, '**/vip/membership', {
      status: 200,
      body: {
        success: true,
        data: {
          tier: 'gold',
          status: 'active',
          benefits: ['priority_teleconsult'],
        },
      },
    });

    // Mock priority slots (VIP members see earlier slots)
    await mockApiResponse(patientPage, '**/teleconsultation/available-slots**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'slot_priority_001',
            pharmacistName: 'Marie Dupont',
            startTime: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
            duration: 30,
            vipOnly: true, // Exclusive slot
          },
          {
            id: 'slot_priority_002',
            pharmacistName: 'Marie Dupont',
            startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            duration: 30,
            vipOnly: true,
          },
          {
            id: 'slot_regular_001',
            pharmacistName: 'Marie Dupont',
            startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (regular slot)
            duration: 30,
            vipOnly: false,
          },
        ],
      },
    });

    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Navigate to teleconsultation booking
    await patientPage.getByRole('link', { name: /téléconsultation/i }).click();

    // Verify VIP priority slots visible
    await expect(patientPage.locator('[data-testid="vip-priority-section"]')).toBeVisible();
    await expect(patientPage.getByText(/priorité vip|vip priority/i)).toBeVisible();

    // Verify VIP-exclusive slots marked
    const prioritySlot1 = patientPage.locator('[data-testid="slot-slot_priority_001"]');
    await expect(prioritySlot1.locator('[data-testid="vip-exclusive-badge"]')).toBeVisible();
    await expect(prioritySlot1.getByText(/30.*min/i)).toBeVisible(); // Available in 30 minutes

    const prioritySlot2 = patientPage.locator('[data-testid="slot-slot_priority_002"]');
    await expect(prioritySlot2.locator('[data-testid="vip-exclusive-badge"]')).toBeVisible();

    // Verify regular slots also visible (but later)
    await expect(patientPage.locator('[data-testid="slot-slot_regular_001"]')).toBeVisible();

    // VIP member can book priority slot
    await prioritySlot1.click();
    await expect(patientPage.getByRole('button', { name: /réserver|book/i })).toBeEnabled();

    await patientPage.close();
  });

  /**
   * Journey Step 8: Patient views VIP dashboard with usage statistics
   */
  test('should display VIP dashboard with savings and benefits tracking', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock VIP membership with statistics
    await mockApiResponse(patientPage, '**/vip/membership', {
      status: 200,
      body: {
        success: true,
        data: {
          id: membershipId,
          tier: 'gold',
          status: 'active',
          startDate: new Date(Date.now() - 60 * 86400000).toISOString(), // 2 months ago
          nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          monthlyFee: 19.99,
        },
      },
    });

    // Mock VIP statistics
    await mockApiResponse(patientPage, '**/vip/statistics', {
      status: 200,
      body: {
        success: true,
        data: {
          totalSavings: 142.35,
          savingsThisMonth: 68.20,
          discountsSaved: 87.35,
          deliveryFeesSaved: 55.00,
          ordersPlaced: 11,
          ordersWithVipDiscount: 11,
          teleconsultationsBooked: 3,
          prioritySlotsUsed: 2,
          averageOrderSavings: 7.94,
          breakEvenDate: new Date(Date.now() - 45 * 86400000).toISOString(), // Broke even 45 days ago
          netSavings: 102.37, // Total savings minus fees paid
        },
      },
    });

    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Navigate to VIP dashboard
    await patientPage.locator('[data-testid="vip-badge-header"]').click();

    // Verify VIP dashboard loaded
    await expect(patientPage.getByRole('heading', { name: /golden metapharm.*dashboard/i })).toBeVisible();

    // Verify membership details
    await expect(patientPage.locator('[data-testid="membership-tier"]')).toContainText('Gold');
    await expect(patientPage.locator('[data-testid="membership-status"]')).toContainText(/active|actif/i);

    // Verify savings statistics
    const savingsSection = patientPage.locator('[data-testid="savings-summary"]');
    await expect(savingsSection.getByText('142.35 CHF')).toBeVisible(); // Total savings
    await expect(savingsSection.getByText('68.20 CHF')).toBeVisible(); // This month
    await expect(savingsSection.getByText('102.37 CHF')).toBeVisible(); // Net savings

    // Verify savings breakdown
    await expect(patientPage.locator('[data-testid="discount-savings"]')).toContainText('87.35 CHF');
    await expect(patientPage.locator('[data-testid="delivery-savings"]')).toContainText('55.00 CHF');

    // Verify usage statistics
    await expect(patientPage.locator('[data-testid="orders-count"]')).toContainText('11');
    await expect(patientPage.locator('[data-testid="teleconsultations-count"]')).toContainText('3');
    await expect(patientPage.locator('[data-testid="priority-slots-used"]')).toContainText('2');

    // Verify break-even indicator
    await expect(patientPage.locator('[data-testid="break-even-status"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="break-even-status"]')).toContainText(/économies réalisées|savings achieved/i);

    // Verify benefits status
    const benefitsSection = patientPage.locator('[data-testid="benefits-status"]');
    await expect(benefitsSection.locator('[data-testid="benefit-discount_10"]')).toContainText(/active|actif/i);
    await expect(benefitsSection.locator('[data-testid="benefit-free_delivery_all"]')).toContainText(/active|actif/i);
    await expect(benefitsSection.locator('[data-testid="benefit-priority_teleconsult"]')).toContainText(/active|actif/i);

    // Verify billing information
    await expect(patientPage.locator('[data-testid="next-billing-date"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="monthly-fee"]')).toContainText('19.99 CHF');

    // Verify upgrade/downgrade options
    await expect(patientPage.getByRole('button', { name: /upgrade.*platinum/i })).toBeVisible();
    await expect(patientPage.getByRole('button', { name: /manage.*subscription/i })).toBeVisible();

    await patientPage.close();
  });

  /**
   * Complete VIP journey - all steps in sequence
   */
  test('should complete entire VIP membership journey from discovery to usage', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Step 1: View VIP program
    await mockApiResponse(patientPage, '**/vip/program-details', {
      status: 200,
      body: {
        success: true,
        data: {
          tiers: [
            { id: 'gold', name: 'Gold', price: 19.99, popular: true },
          ],
        },
      },
    });

    await patientPage.getByRole('link', { name: /golden metapharm|vip/i }).click();
    await expect(patientPage.getByRole('heading', { name: /golden metapharm/i })).toBeVisible();

    // Step 2: Subscribe
    await mockApiResponse(patientPage, '**/vip/subscribe', {
      status: 201,
      body: {
        success: true,
        membershipId: 'membership_journey_001',
        tier: 'gold',
        status: 'active',
      },
    });

    await mockApiResponse(patientPage, '**/patient/payment-methods', {
      status: 200,
      body: {
        success: true,
        data: [{ id: 'card_001', type: 'credit_card', default: true }],
      },
    });

    await patientPage.locator('[data-testid="tier-gold"]').click();
    await patientPage.getByRole('button', { name: /s'abonner/i }).click();
    await patientPage.locator('[data-testid="terms-checkbox"]').check();
    await patientPage.getByRole('button', { name: /confirmer/i }).click();
    await expect(patientPage.locator('[data-testid="success-modal"]')).toBeVisible();

    // Step 3: Use VIP benefits (add product with discount)
    await mockApiResponse(patientPage, '**/vip/membership', {
      status: 200,
      body: {
        success: true,
        data: { tier: 'gold', status: 'active', discountPercentage: 10 },
      },
    });

    await mockApiResponse(patientPage, '**/cart', {
      status: 200,
      body: {
        success: true,
        data: {
          subtotal: 50.00,
          vipDiscount: 5.00,
          total: 45.00,
        },
      },
    });

    // Navigate to shop and add item
    await patientPage.getByRole('link', { name: /produits|shop/i }).click();
    await expect(patientPage.locator('[data-testid="vip-badge-header"]')).toContainText('Gold');

    // Verify VIP discount applied in cart
    await patientPage.locator('[data-testid="cart-button"]').click();
    await expect(patientPage.locator('[data-testid="vip-discount"]')).toContainText('5.00');

    await patientPage.close();
  });
});
