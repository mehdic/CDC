import { Page, Locator } from '@playwright/test';

/**
 * Dashboard Page Object
 * Handles role-specific dashboards for all user types
 */

export class DashboardPage {
  readonly page: Page;
  readonly userProfile: Locator;
  readonly navigationMenu: Locator;
  readonly mainContent: Locator;
  readonly pageTitle: Locator;
  readonly userGreeting: Locator;
  readonly notificationBell: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userProfile = page.locator('[data-testid="user-profile"], .user-menu');
    this.navigationMenu = page.locator('nav, [role="navigation"]');
    this.mainContent = page.locator('main, [role="main"]');
    this.pageTitle = page.locator('h1, [data-testid="page-title"]');
    this.userGreeting = page.locator('[data-testid="user-greeting"]');
    this.notificationBell = page.locator('button[aria-label*="notification"], [data-testid="notifications"]');
    this.settingsButton = page.locator('[data-testid="settings"], a:has-text("Settings")');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for dashboard to load
   */
  async waitForDashboardLoad() {
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  /**
   * Get user greeting text
   */
  async getUserGreeting(): Promise<string> {
    return await this.userGreeting.textContent() || '';
  }

  /**
   * Navigate using menu
   */
  async clickNavLink(linkText: string) {
    await this.page.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if specific dashboard section is visible
   */
  async isSectionVisible(sectionName: string): Promise<boolean> {
    return await this.page.locator(`[data-testid="${sectionName}"], h2:has-text("${sectionName}")`).isVisible();
  }

  /**
   * Navigate to settings
   */
  async goToSettings() {
    await this.settingsButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open notifications
   */
  async openNotifications() {
    if (await this.notificationBell.isVisible()) {
      await this.notificationBell.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }
}
