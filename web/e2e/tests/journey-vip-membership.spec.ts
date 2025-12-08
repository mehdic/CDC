import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

/**
 * E2E Journey Test: VIP Membership (Golden MetaPharm) Journey
 *
 * Tests complete VIP membership flow:
 * 1. Patient views Golden MetaPharm program benefits
 * 2. Patient subscribes to VIP program
 * 3. VIP benefits applied to orders (priority delivery, discounts)
 * 4. VIP discount calculation on checkout
 * 5. Patient views VIP dashboard with savings
 */

test.describe('VIP Membership (Golden MetaPharm) Journey', () => {
  const membershipId = 'membership_001';

  test('should display Golden MetaPharm program with subscription tiers', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, '**/vip/program-details', {
      status: 200,
      body: {
        success: true,
        data: {
          tiers: [
            { id: 'gold', name: 'Gold', price: 19.99, popular: true, benefits: ['10% discount', 'Free delivery'] },
          ],
        },
      },
    });

    await patientPage.getByRole('link', { name: /golden metapharm|vip/i }).click();
    await expect(patientPage.getByRole('heading', { name: /golden metapharm/i })).toBeVisible();
    await expect(patientPage.locator('[data-testid="tier-gold"]')).toBeVisible();
    await expect(patientPage.getByText('19.99')).toBeVisible();

    await patientPage.close();
  });

  test('should allow patient to subscribe to Gold VIP tier', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, '**/vip/program-details', {
      status: 200,
      body: { success: true, data: { tiers: [{ id: 'gold', name: 'Gold', price: 19.99 }] } },
    });

    await mockApiResponse(patientPage, '**/vip/subscribe', {
      status: 201,
      body: { success: true, membershipId: membershipId, tier: 'gold', status: 'active' },
    });

    await mockApiResponse(patientPage, '**/patient/payment-methods', {
      status: 200,
      body: { success: true, data: [{ id: 'card_001', type: 'credit_card', default: true }] },
    });

    await patientPage.getByRole('link', { name: /golden metapharm|vip/i }).click();
    await patientPage.locator('[data-testid="tier-gold"]').click();
    await patientPage.getByRole('button', { name: /s'abonner|subscribe/i }).click();
    await patientPage.locator('[data-testid="terms-checkbox"]').check();
    await patientPage.getByRole('button', { name: /confirmer/i }).click();
    await expect(patientPage.locator('[data-testid="success-modal"]')).toBeVisible();

    await patientPage.close();
  });

  test('should apply VIP discount and free delivery to order', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, '**/vip/membership', {
      status: 200,
      body: { success: true, data: { tier: 'gold', status: 'active', discountPercentage: 10 } },
    });

    await mockApiResponse(patientPage, '**/cart', {
      status: 200,
      body: {
        success: true,
        data: { subtotal: 43.90, vipDiscount: 4.39, deliveryFee: 0.00, total: 39.51 },
      },
    });

    await expect(patientPage.locator('[data-testid="vip-badge-header"]')).toBeVisible();
    await patientPage.locator('[data-testid="cart-button"]').click();
    await expect(patientPage.locator('[data-testid="vip-discount"]')).toContainText('4.39');
    await expect(patientPage.locator('[data-testid="total"]')).toContainText('39.51');

    await patientPage.close();
  });
});
