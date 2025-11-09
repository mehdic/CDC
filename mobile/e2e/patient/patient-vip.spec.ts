/**
 * Patient Golden MetaPharm VIP Program E2E Tests
 *
 * Tests VIP loyalty program functionality:
 * - VIP program enrollment
 * - View loyalty points
 * - Redeem rewards
 * - Exclusive offers
 * - Priority support access
 */

describe('Patient Golden MetaPharm VIP Program', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsPatient();
  });

  beforeEach(async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('vip-program-section')).tap();
    await expect(element(by.id('vip-screen'))).toBeVisible();
  });

  describe('VIP Program Enrollment', () => {
    it('should display VIP program benefits', async () => {
      await expect(element(by.id('vip-benefits-section'))).toBeVisible();
      await expect(element(by.id('benefit-priority-support'))).toBeVisible();
      await expect(element(by.id('benefit-exclusive-discounts'))).toBeVisible();
      await expect(element(by.id('benefit-free-delivery'))).toBeVisible();
      await expect(element(by.id('benefit-points-bonus'))).toBeVisible();
    });

    it('should show enrollment options', async () => {
      await element(by.id('enroll-button')).tap();
      await expect(element(by.id('enrollment-modal'))).toBeVisible();
      await expect(element(by.id('tier-bronze'))).toBeVisible();
      await expect(element(by.id('tier-silver'))).toBeVisible();
      await expect(element(by.id('tier-gold'))).toBeVisible();
    });

    it('should enroll in Bronze tier', async () => {
      await element(by.id('enroll-button')).tap();
      await element(by.id('tier-bronze')).tap();
      await element(by.id('accept-terms-checkbox')).tap();
      await element(by.id('confirm-enrollment-button')).tap();

      await expect(element(by.id('enrollment-success'))).toBeVisible();
      await expect(element(by.id('welcome-message'))).toContain('Welcome to Golden MetaPharm');
      await expect(element(by.id('current-tier'))).toHaveText('Bronze');
    });

    it('should enroll in Silver tier with payment', async () => {
      await element(by.id('enroll-button')).tap();
      await element(by.id('tier-silver')).tap();

      await expect(element(by.id('payment-section'))).toBeVisible();
      await expect(element(by.id('tier-price'))).toHaveText('CHF 49.90/year');

      await element(by.id('saved-card-0')).tap();
      await element(by.id('accept-terms-checkbox')).tap();
      await element(by.id('confirm-enrollment-button')).tap();

      await waitFor(element(by.id('enrollment-success'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('current-tier'))).toHaveText('Silver');
    });

    it('should view membership card', async () => {
      await enrollInProgram('Bronze');

      await element(by.id('view-membership-card-button')).tap();
      await expect(element(by.id('membership-card-modal'))).toBeVisible();
      await expect(element(by.id('member-id'))).toBeVisible();
      await expect(element(by.id('member-name'))).toHaveText('John Smith');
      await expect(element(by.id('member-tier'))).toHaveText('Bronze');
      await expect(element(by.id('membership-qr-code'))).toBeVisible();
    });
  });

  describe('View Loyalty Points', () => {
    beforeEach(async () => {
      await enrollInProgram('Silver');
    });

    it('should display current points balance', async () => {
      await expect(element(by.id('points-balance'))).toBeVisible();
      await expect(element(by.id('points-balance-value'))).toBeVisible();
    });

    it('should show points history', async () => {
      await element(by.id('points-history-tab')).tap();
      await expect(element(by.id('points-history-list'))).toBeVisible();
      await expect(element(by.id('history-item-0'))).toBeVisible();
      await expect(element(by.id('history-item-0-points'))).toBeVisible();
      await expect(element(by.id('history-item-0-reason'))).toBeVisible();
      await expect(element(by.id('history-item-0-date'))).toBeVisible();
    });

    it('should display points earned from purchases', async () => {
      // Simulate purchase
      await makePurchase();

      await element(by.id('vip-program-section')).tap();
      await element(by.id('points-history-tab')).tap();

      await expect(element(by.id('history-item-0-reason'))).toContain('Purchase');
      await expect(element(by.id('history-item-0-points'))).toHaveText('+50 points');
    });

    it('should show points expiration date', async () => {
      await element(by.id('points-history-tab')).tap();
      await element(by.id('history-item-0')).tap();

      await expect(element(by.id('points-detail-modal'))).toBeVisible();
      await expect(element(by.id('points-expiry-date'))).toBeVisible();
      await expect(element(by.id('points-expiry-date'))).toContain('Expires on');
    });

    it('should display next tier progress', async () => {
      await expect(element(by.id('tier-progress-bar'))).toBeVisible();
      await expect(element(by.id('tier-progress-text'))).toContain('points to Gold');
    });
  });

  describe('Redeem Rewards', () => {
    beforeEach(async () => {
      await enrollInProgram('Gold');
      await addPointsToAccount(500);
    });

    it('should display available rewards catalog', async () => {
      await element(by.id('rewards-tab')).tap();
      await expect(element(by.id('rewards-catalog'))).toBeVisible();
      await expect(element(by.id('reward-0'))).toBeVisible();
      await expect(element(by.id('reward-0-name'))).toBeVisible();
      await expect(element(by.id('reward-0-points'))).toBeVisible();
    });

    it('should view reward details', async () => {
      await element(by.id('rewards-tab')).tap();
      await element(by.id('reward-0')).tap();

      await expect(element(by.id('reward-detail-modal'))).toBeVisible();
      await expect(element(by.id('reward-description'))).toBeVisible();
      await expect(element(by.id('reward-terms'))).toBeVisible();
      await expect(element(by.id('redeem-button'))).toBeVisible();
    });

    it('should redeem points for discount code', async () => {
      await element(by.id('rewards-tab')).tap();
      await element(by.id('reward-discount-code')).tap();
      await element(by.id('redeem-button')).tap();

      await expect(element(by.id('redemption-confirmation'))).toBeVisible();
      await element(by.id('confirm-redemption-button')).tap();

      await waitFor(element(by.id('redemption-success'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('discount-code'))).toBeVisible();
      await expect(element(by.id('copy-code-button'))).toBeVisible();
    });

    it('should redeem points for free product', async () => {
      await element(by.id('rewards-tab')).tap();
      await element(by.id('reward-free-product')).tap();
      await element(by.id('redeem-button')).tap();
      await element(by.id('confirm-redemption-button')).tap();

      await expect(element(by.id('redemption-success'))).toBeVisible();
      await expect(element(by.id('coupon-code'))).toBeVisible();
    });

    it('should show insufficient points message', async () => {
      await element(by.id('rewards-tab')).tap();
      await element(by.id('reward-expensive-1000-points')).tap();

      await expect(element(by.id('insufficient-points-message'))).toBeVisible();
      await expect(element(by.id('redeem-button'))).not.toBeEnabled();
    });

    it('should view redemption history', async () => {
      await redeemReward();

      await element(by.id('redemption-history-tab')).tap();
      await expect(element(by.id('redemption-history-list'))).toBeVisible();
      await expect(element(by.id('redemption-item-0'))).toBeVisible();
      await expect(element(by.id('redemption-item-0-reward'))).toBeVisible();
      await expect(element(by.id('redemption-item-0-points'))).toHaveText('-100 points');
    });
  });

  describe('Exclusive Offers', () => {
    beforeEach(async () => {
      await enrollInProgram('Gold');
    });

    it('should display VIP-exclusive offers', async () => {
      await element(by.id('exclusive-offers-tab')).tap();
      await expect(element(by.id('exclusive-offers-list'))).toBeVisible();
      await expect(element(by.id('offer-0'))).toBeVisible();
      await expect(element(by.id('offer-0-badge'))).toHaveText('VIP Only');
    });

    it('should view offer details', async () => {
      await element(by.id('exclusive-offers-tab')).tap();
      await element(by.id('offer-0')).tap();

      await expect(element(by.id('offer-detail-modal'))).toBeVisible();
      await expect(element(by.id('offer-description'))).toBeVisible();
      await expect(element(by.id('offer-expiry'))).toBeVisible();
      await expect(element(by.id('use-offer-button'))).toBeVisible();
    });

    it('should apply offer to purchase', async () => {
      await element(by.id('exclusive-offers-tab')).tap();
      await element(by.id('offer-0')).tap();
      await element(by.id('use-offer-button')).tap();

      // Should navigate to shop with offer applied
      await expect(element(by.id('shop-screen'))).toBeVisible();
      await expect(element(by.id('active-offer-banner'))).toBeVisible();
    });

    it('should show personalized offers based on purchase history', async () => {
      await element(by.id('exclusive-offers-tab')).tap();
      await expect(element(by.id('personalized-section'))).toBeVisible();
      await expect(element(by.id('personalized-offer-0'))).toBeVisible();
      await expect(element(by.id('personalized-offer-0-badge'))).toHaveText('For You');
    });

    it('should receive notification for new exclusive offers', async () => {
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await device.launchApp({ newInstance: false });

      await element(by.id('notifications-button')).tap();
      await expect(element(by.id('notification-vip-offer'))).toBeVisible();
      await expect(element(by.id('notification-vip-offer-text'))).toContain('exclusive offer');
    });
  });

  describe('Priority Support Access', () => {
    beforeEach(async () => {
      await enrollInProgram('Silver');
    });

    it('should display priority support option', async () => {
      await element(by.id('support-tab')).tap();
      await expect(element(by.id('priority-support-badge'))).toBeVisible();
      await expect(element(by.id('priority-support-badge'))).toHaveText('VIP Priority');
    });

    it('should access priority chat support', async () => {
      await element(by.id('support-tab')).tap();
      await element(by.id('priority-chat-button')).tap();

      await expect(element(by.id('chat-screen'))).toBeVisible();
      await expect(element(by.id('priority-indicator'))).toBeVisible();
      await expect(element(by.id('wait-time-message'))).toContain('shorter wait time');
    });

    it('should access VIP phone support line', async () => {
      await element(by.id('support-tab')).tap();
      await element(by.id('vip-phone-support-button')).tap();

      await expect(element(by.id('call-confirmation-modal'))).toBeVisible();
      await expect(element(by.id('vip-support-number'))).toBeVisible();
    });

    it('should schedule priority callback', async () => {
      await element(by.id('support-tab')).tap();
      await element(by.id('schedule-callback-button')).tap();

      await expect(element(by.id('callback-scheduler'))).toBeVisible();
      await element(by.id('callback-time-asap')).tap();
      await element(by.id('callback-reason-input')).typeText('Need help with prescription');
      await element(by.id('confirm-callback-button')).tap();

      await expect(element(by.id('callback-scheduled-success'))).toBeVisible();
    });
  });

  describe('Tier Upgrades', () => {
    beforeEach(async () => {
      await enrollInProgram('Bronze');
    });

    it('should display upgrade options', async () => {
      await element(by.id('upgrade-tier-button')).tap();
      await expect(element(by.id('upgrade-modal'))).toBeVisible();
      await expect(element(by.id('upgrade-to-silver'))).toBeVisible();
      await expect(element(by.id('upgrade-to-gold'))).toBeVisible();
    });

    it('should compare tier benefits', async () => {
      await element(by.id('compare-tiers-button')).tap();
      await expect(element(by.id('tier-comparison-screen'))).toBeVisible();
      await expect(element(by.id('comparison-table'))).toBeVisible();
    });

    it('should upgrade to higher tier', async () => {
      await element(by.id('upgrade-tier-button')).tap();
      await element(by.id('upgrade-to-silver')).tap();
      await element(by.id('saved-card-0')).tap();
      await element(by.id('confirm-upgrade-button')).tap();

      await waitFor(element(by.id('upgrade-success'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('current-tier'))).toHaveText('Silver');
    });

    it('should show automatic tier qualification', async () => {
      // Simulate reaching spending threshold
      await simulateSpendingThreshold(1000);

      await expect(element(by.id('tier-upgrade-notification'))).toBeVisible();
      await expect(element(by.id('tier-upgrade-message'))).toContain('qualified for Silver');
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

async function enrollInProgram(tier: string) {
  await element(by.id('enroll-button')).tap();
  await element(by.id(`tier-${tier.toLowerCase()}`)).tap();

  if (tier !== 'Bronze') {
    await element(by.id('saved-card-0')).tap();
  }

  await element(by.id('accept-terms-checkbox')).tap();
  await element(by.id('confirm-enrollment-button')).tap();
  await waitFor(element(by.id('enrollment-success'))).toBeVisible().withTimeout(10000);
}

async function addPointsToAccount(points: number) {
  // Mock adding points (in production, points come from purchases)
}

async function makePurchase() {
  // Mock purchase to earn points
}

async function redeemReward() {
  await element(by.id('rewards-tab')).tap();
  await element(by.id('reward-0')).tap();
  await element(by.id('redeem-button')).tap();
  await element(by.id('confirm-redemption-button')).tap();
  await waitFor(element(by.id('redemption-success'))).toBeVisible().withTimeout(5000);
}

async function simulateSpendingThreshold(amount: number) {
  // Mock reaching spending threshold for tier upgrade
}
