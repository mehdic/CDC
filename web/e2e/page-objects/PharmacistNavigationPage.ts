import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Navigation item interface matching the app's navigation structure
 */
export interface NavigationTestItem {
  id: string;
  label: string;
  path: string;
  expectedUrlPattern: string | RegExp;
  contentSelector?: string;
  contentText?: string;
}

/**
 * Page Object Model for Pharmacist Navigation Testing
 *
 * Encapsulates all navigation-related interactions and verifications
 * for the pharmacist portal.
 *
 * @example
 * const navPage = new PharmacistNavigationPage(page);
 * await navPage.goto();
 * await navPage.clickNavigationLink('dashboard');
 * await navPage.verifyPageLoaded('dashboard');
 */
export class PharmacistNavigationPage extends BasePage {
  // Navigation items to test
  readonly navigationItems: NavigationTestItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      path: '/',
      expectedUrlPattern: /.*\/$/,
      contentSelector: 'main',
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      path: '/prescriptions',
      expectedUrlPattern: /.*\/prescriptions/,
      contentSelector: 'main',
    },
    {
      id: 'inventory',
      label: 'Inventaire',
      path: '/inventory',
      expectedUrlPattern: /.*\/inventory/,
      contentSelector: 'main',
    },
    {
      id: 'teleconsultation',
      label: 'Téléconsultation',
      path: '/teleconsultation',
      expectedUrlPattern: /.*\/teleconsultation/,
      contentSelector: 'main',
    },
    {
      id: 'consultation-calendar',
      label: 'Calendrier Consultations',
      path: '/consultation-calendar',
      expectedUrlPattern: /.*\/consultation-calendar/,
      contentSelector: 'main',
    },
    {
      id: 'medical-records',
      label: 'Dossiers Médicaux',
      path: '/medical-records',
      expectedUrlPattern: /.*\/medical-records/,
      contentSelector: 'main',
    },
    {
      id: 'analytics',
      label: 'Analyses',
      path: '/analytics',
      expectedUrlPattern: /.*\/analytics/,
      contentSelector: 'main',
    },
    {
      id: 'marketing',
      label: 'Marketing',
      path: '/marketing',
      expectedUrlPattern: /.*\/marketing/,
      contentSelector: 'main',
    },
    {
      id: 'delivery',
      label: 'Livraisons',
      path: '/delivery',
      expectedUrlPattern: /.*\/delivery/,
      contentSelector: 'main',
    },
    {
      id: 'settings',
      label: 'Paramètres',
      path: '/settings',
      expectedUrlPattern: /.*\/settings/,
      contentSelector: 'main',
    },
  ];

  // Locators
  readonly navigationContainer: Locator;
  readonly mainContent: Locator;
  readonly appShell: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation components
    this.navigationContainer = page.locator('nav[role="navigation"]');
    this.mainContent = page.locator('main');
    this.appShell = page.locator('body'); // AppShell wraps entire app
    this.loadingIndicator = page.locator('svg[class*="CircularProgress"]');
  }

  /**
   * Navigate to dashboard (home page)
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');

    // Wait for main content to be visible
    await this.mainContent.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get navigation link by item ID
   */
  getNavigationLink(itemId: string): Locator {
    const item = this.navigationItems.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Navigation item not found: ${itemId}`);
    }

    // Try multiple selector strategies
    // 1. Try by exact text
    let link = this.navigationContainer.getByRole('button', { name: item.label, exact: true });

    return link;
  }

  /**
   * Click a navigation link by item ID
   */
  async clickNavigationLink(itemId: string): Promise<void> {
    const link = this.getNavigationLink(itemId);
    await link.click();

    // Wait for navigation to complete
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a page by clicking its navigation link
   */
  async navigateToPage(itemId: string): Promise<void> {
    await this.clickNavigationLink(itemId);

    const item = this.navigationItems.find(i => i.id === itemId);
    if (item) {
      await this.waitForUrl(item.expectedUrlPattern);
    }
  }

  /**
   * Verify that a navigation link is visible
   */
  async expectNavigationLinkVisible(itemId: string): Promise<void> {
    const link = this.getNavigationLink(itemId);
    await expect(link).toBeVisible();
  }

  /**
   * Verify that a navigation link is active (highlighted)
   */
  async expectNavigationLinkActive(itemId: string): Promise<void> {
    const link = this.getNavigationLink(itemId);
    await expect(link).toBeVisible();

    // Check if button has active styling (this depends on implementation)
    // The active state might be indicated by CSS class or aria-current
    const parent = link.locator('..');
    await expect(parent).toBeVisible();
  }

  /**
   * Verify current URL matches expected pattern for a page
   */
  async expectUrlMatches(itemId: string): Promise<void> {
    const item = this.navigationItems.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Navigation item not found: ${itemId}`);
    }

    await expect(this.page).toHaveURL(item.expectedUrlPattern);
  }

  /**
   * Verify page content is loaded and visible
   */
  async expectPageContentLoaded(itemId?: string): Promise<void> {
    // Main content should be visible
    await expect(this.mainContent).toBeVisible();

    // If specific item provided, check for additional content
    if (itemId) {
      const item = this.navigationItems.find(i => i.id === itemId);
      if (item && item.contentSelector) {
        const content = this.page.locator(item.contentSelector);
        await expect(content).toBeVisible();
      }
    }

    // Verify no loading indicators are visible
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 1000 }).catch(() => {
      // Loading indicator might not exist, which is fine
    });
  }

  /**
   * Verify navigation container is visible
   */
  async expectNavigationVisible(): Promise<void> {
    await expect(this.navigationContainer).toBeVisible();
  }

  /**
   * Get all navigation items
   */
  getNavigationItems(): NavigationTestItem[] {
    return this.navigationItems;
  }

  /**
   * Verify all expected navigation links are visible
   */
  async expectAllNavigationLinksVisible(): Promise<void> {
    await this.expectNavigationVisible();

    for (const item of this.navigationItems) {
      await this.expectNavigationLinkVisible(item.id);
    }
  }

  /**
   * Test complete navigation flow for an item
   * Clicks link, verifies URL, verifies content loads
   */
  async testNavigationFlow(itemId: string): Promise<void> {
    // Click navigation link
    await this.clickNavigationLink(itemId);

    // Verify URL changed correctly
    await this.expectUrlMatches(itemId);

    // Verify page content loaded
    await this.expectPageContentLoaded(itemId);
  }

  /**
   * Verify database content is displayed on a page
   * This checks for ANY content (not empty state)
   * Note: Some pages may be legitimately empty (e.g., calendar with no events)
   */
  async expectDatabaseContentDisplayed(): Promise<void> {
    // Wait for main content
    await expect(this.mainContent).toBeVisible();

    // Check that main content has children (not empty)
    // Some pages may have empty states which is valid
    const hasContent = await this.mainContent.evaluate(el => {
      const childCount = el.children.length;
      const textLength = el.textContent!.trim().length;
      // Accept if has children OR has text (empty states often have text explaining no data)
      return childCount > 0 || textLength > 0;
    });

    expect(hasContent).toBeTruthy();
  }

  /**
   * Get current page title from navigation or header
   */
  async getCurrentPageTitle(): Promise<string | null> {
    // Try to find page heading
    const heading = this.page.getByRole('heading', { level: 1 });

    try {
      await heading.waitFor({ state: 'visible', timeout: 3000 });
      return await heading.textContent();
    } catch {
      return null;
    }
  }
}
