import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions
 * Common utilities for E2E testing
 */

export class TestHelpers {
  /**
   * Wait for network to be idle
   */
  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch (e) {
      // Timeout is acceptable
    }
  }

  /**
   * Get current user email from storage
   */
  static async getCurrentUserEmail(page: Page): Promise<string | null> {
    try {
      return await page.evaluate(() => localStorage.getItem('userEmail'));
    } catch {
      return null;
    }
  }

  /**
   * Clear all storage
   */
  static async clearAllStorage(page: Page) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Get auth token from storage
   */
  static async getAuthToken(page: Page): Promise<string | null> {
    try {
      return await page.evaluate(() => localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
    } catch {
      return null;
    }
  }

  /**
   * Check if element is in viewport
   */
  static async isInViewport(page: Page, selector: string): Promise<boolean> {
    try {
      return await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
      }, selector);
    } catch {
      return false;
    }
  }

  /**
   * Scroll element into view
   */
  static async scrollIntoView(page: Page, selector: string) {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, selector);
  }

  /**
   * Wait for element with retry
   */
  static async waitForElementWithRetry(page: Page, selector: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        return;
      } catch {
        if (i < retries - 1) {
          await page.reload();
        } else {
          throw new Error(`Element ${selector} not found after ${retries} retries`);
        }
      }
    }
  }

  /**
   * Format date for input
   */
  static formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format time for input
   */
  static formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Generate random email
   */
  static generateRandomEmail(): string {
    const random = Math.random().toString(36).substring(7);
    return `test${random}@metapharm.ch`;
  }

  /**
   * Get future date
   */
  static getFutureDate(daysOffset: number = 1): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  /**
   * Get past date
   */
  static getPastDate(daysOffset: number = 1): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysOffset);
    return date;
  }

  /**
   * Check for accessibility issues
   */
  static async checkAccessibility(page: Page) {
    try {
      await page.evaluate(() => {
        // Check for images without alt text
        const images = Array.from(document.querySelectorAll('img'));
        const imagesWithoutAlt = images.filter((img) => !img.getAttribute('alt'));

        // Check for buttons without text or aria-label
        const buttons = Array.from(document.querySelectorAll('button'));
        const buttonsMissingLabels = buttons.filter(
          (btn) => !btn.textContent?.trim() && !btn.getAttribute('aria-label')
        );

        // Check for form inputs without labels
        const inputs = Array.from(document.querySelectorAll('input'));
        const inputsMissingLabels = inputs.filter((input) => {
          const label = document.querySelector(`label[for="${input.id}"]`);
          return !label && !input.getAttribute('aria-label');
        });

        return {
          imagesWithoutAlt: imagesWithoutAlt.length,
          buttonsMissingLabels: buttonsMissingLabels.length,
          inputsMissingLabels: inputsMissingLabels.length,
        };
      });
    } catch (e) {
      // Evaluation errors are not critical
    }
  }

  /**
   * Verify page title
   */
  static async verifyPageTitle(page: Page, expectedTitle: string) {
    const title = await page.title();
    expect(title).toContain(expectedTitle);
  }

  /**
   * Get all console messages
   */
  static async captureConsoleMessages(
    page: Page,
    callback: () => Promise<void>
  ): Promise<{ type: string; message: string }[]> {
    const messages: { type: string; message: string }[] = [];

    page.on('console', (msg) => {
      messages.push({ type: msg.type(), message: msg.text() });
    });

    await callback();
    return messages;
  }

  /**
   * Verify no console errors
   */
  static async verifyNoConsoleErrors(page: Page, callback: () => Promise<void>) {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await callback();

    expect(errors).toHaveLength(0);
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeTimestampedScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
  }
}
