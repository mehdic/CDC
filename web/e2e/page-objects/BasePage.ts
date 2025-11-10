import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 *
 * Provides common functionality for all page objects including
 * navigation, waiting, and common UI elements.
 *
 * All page objects should extend this class.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific URL pattern
   */
  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: { path: string }): Promise<Buffer> {
    return this.page.screenshot(options);
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden' });
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWaitForNavigation(locator: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      locator.click(),
    ]);
  }

  /**
   * Fill input and blur
   */
  async fillAndBlur(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
    await locator.blur();
  }

  /**
   * Get local storage item
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set local storage item
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Get session storage item
   */
  async getSessionStorageItem(key: string): Promise<string | null> {
    return this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  /**
   * Set session storage item
   */
  async setSessionStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => sessionStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear session storage
   */
  async clearSessionStorage(): Promise<void> {
    await this.page.evaluate(() => sessionStorage.clear());
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Wait for specific timeout
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }
}
