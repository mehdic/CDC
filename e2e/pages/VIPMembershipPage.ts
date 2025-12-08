import { Page, Locator } from '@playwright/test';

/**
 * VIP Membership Page Object
 * Handles VIP program signup, points, tiers, and rewards
 */

export class VIPMembershipPage {
  readonly page: Page;
  readonly signUpButton: Locator;
  readonly membershipCard: Locator;
  readonly pointsDisplay: Locator;
  readonly tierDisplay: Locator;
  readonly rewardsSection: Locator;
  readonly discountInfo: Locator;
  readonly birthdayBonus: Locator;
  readonly freeDeliveryBadge: Locator;
  readonly referralCode: Locator;
  readonly transactionHistory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signUpButton = page.locator('button:has-text("Sign Up"), button:has-text("Join VIP")');
    this.membershipCard = page.locator('[data-testid="vip-card"], .vip-membership');
    this.pointsDisplay = page.locator('[data-testid="points"], .points-balance');
    this.tierDisplay = page.locator('[data-testid="tier"], .membership-tier');
    this.rewardsSection = page.locator('[data-testid="rewards"], .rewards-section');
    this.discountInfo = page.locator('[data-testid="discount"], .discount-info');
    this.birthdayBonus = page.locator('[data-testid="birthday-bonus"], .birthday-reward');
    this.freeDeliveryBadge = page.locator('[data-testid="free-delivery"], .free-delivery');
    this.referralCode = page.locator('[data-testid="referral-code"], .referral');
    this.transactionHistory = page.locator('[data-testid="transaction-history"], .transactions');
  }

  async goto() {
    await this.page.goto('/patient/vip-membership');
  }

  async signUpForVIP() {
    const signUpVisible = await this.signUpButton.isVisible().catch(() => false);
    if (signUpVisible) {
      await this.signUpButton.click();
      await this.page.waitForLoadState('networkidle');
      // Accept terms if present
      const acceptButton = this.page.locator('button:has-text("Accept"), button:has-text("agree")');
      const acceptVisible = await acceptButton.isVisible().catch(() => false);
      if (acceptVisible) {
        await acceptButton.click();
        await this.page.waitForLoadState('networkidle');
      }
    }
  }

  async isVIPMember(): Promise<boolean> {
    return await this.membershipCard.isVisible().catch(() => false);
  }

  async getPoints(): Promise<number> {
    const pointsVisible = await this.pointsDisplay.isVisible().catch(() => false);
    if (pointsVisible) {
      const pointsText = await this.pointsDisplay.textContent();
      const match = pointsText?.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    }
    return 0;
  }

  async getTier(): Promise<string> {
    const tierVisible = await this.tierDisplay.isVisible().catch(() => false);
    if (tierVisible) {
      return await this.tierDisplay.textContent() || 'BRONZE';
    }
    return 'NONE';
  }

  async simulatePurchase(amount: number) {
    // Simulate a purchase to earn points
    // In real E2E, would go through checkout flow
    await this.page.evaluate((purchaseAmount) => {
      const pointsEarned = Math.floor(purchaseAmount / 10); // 1 point per 10 CHF
      document.body.setAttribute('data-test-points-earned', String(pointsEarned));
    }, amount);
    await this.page.waitForTimeout(500);
  }

  async hasDiscountApplied(): Promise<boolean> {
    return await this.discountInfo.isVisible().catch(() => false);
  }

  async hasBirthdayBonus(): Promise<boolean> {
    return await this.birthdayBonus.isVisible().catch(() => false);
  }

  async hasFreeDelivery(): Promise<boolean> {
    return await this.freeDeliveryBadge.isVisible().catch(() => false);
  }

  async getReferralCode(): Promise<string | null> {
    const referralVisible = await this.referralCode.isVisible().catch(() => false);
    if (referralVisible) {
      return await this.referralCode.textContent();
    }
    return null;
  }

  async hasTransactionHistory(): Promise<boolean> {
    return await this.transactionHistory.isVisible().catch(() => false);
  }

  async verifyTierUpgrade(expectedTier: string): Promise<boolean> {
    await this.page.waitForTimeout(1000); // Wait for tier update
    const currentTier = await this.getTier();
    return currentTier.toLowerCase().includes(expectedTier.toLowerCase());
  }
}
