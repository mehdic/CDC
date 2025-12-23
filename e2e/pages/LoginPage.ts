import { Page, Locator } from '@playwright/test';

/**
 * Login Page Object
 * Handles authentication for all user roles
 */

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly roleSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"][name*="email"], input[placeholder*="Email"]');
    this.passwordInput = page.locator('input[type="password"][name*="password"], input[placeholder*="Password"]');
    this.loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
    this.logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
    this.errorMessage = page.locator('[role="alert"], .error-message, .alert-danger');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"]');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password"), a:has-text("forgot")');
    this.roleSelector = page.locator('select[name*="role"], [data-testid="role-selector"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(/\/(nurse|doctor|pharmacist|patient|delivery)\/.*/);
  }

  /**
   * Perform login with role selection
   */
  async loginWithRole(email: string, password: string, role?: string) {
    if (role && (await this.roleSelector.isVisible())) {
      await this.roleSelector.selectOption(role);
    }
    await this.login(email, password);
  }

  /**
   * Perform logout
   */
  async logout() {
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click();
      await this.page.waitForURL(/\/login/);
    }
  }

  /**
   * Check if login failed
   */
  async isLoginErrorDisplayed(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return (
      (await Promise.race([
        this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 }),
        this.page.waitForSelector('.user-profile', { timeout: 5000 }),
        Promise.reject(new Error('Not logged in')),
      ]).catch(() => false)) !== null
    );
  }

  /**
   * Enable remember me
   */
  async enableRememberMe() {
    if (await this.rememberMeCheckbox.isVisible()) {
      const isChecked = await this.rememberMeCheckbox.isChecked();
      if (!isChecked) {
        await this.rememberMeCheckbox.click();
      }
    }
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/forgot-password/);
  }
}
