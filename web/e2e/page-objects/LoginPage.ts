import { Page, Locator, expect } from '@playwright/test';

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Page Object Model for Login Page
 *
 * Encapsulates all interactions with the login page to provide
 * a clean API for test code and reduce duplication.
 *
 * @example
 * const loginPage = new LoginPage(page);
 * await loginPage.goto();
 * await loginPage.login({ email: 'test@example.com', password: 'password' });
 * await loginPage.expectLoginSuccess();
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly loadingIndicator: Locator;
  readonly pageTitle: Locator;
  readonly forgotPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Input fields
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');

    // Buttons
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordButton = page.getByRole('button', {
      name: /réinitialiser/i,
    });

    // Feedback elements
    this.errorAlert = page.locator('[role="alert"]');
    this.loadingIndicator = page.locator('svg[class*="CircularProgress"]');

    // Page elements
    this.pageTitle = page.getByRole('heading', { name: /MetaPharm Connect/i });
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.expectPageLoaded();
  }

  /**
   * Fill in login form and submit
   */
  async login(credentials: LoginCredentials): Promise<void> {
    await this.emailInput.fill(credentials.email);
    await this.passwordInput.fill(credentials.password);
    await this.submitButton.click();
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click forgot password button
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordButton.click();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible' });
    return this.errorAlert.textContent() || '';
  }

  /**
   * Check if error alert is visible
   */
  async hasError(): Promise<boolean> {
    return this.errorAlert.isVisible();
  }

  /**
   * Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return this.loadingIndicator.isVisible();
  }

  /**
   * Get validation error for email field
   */
  async getEmailError(): Promise<string | null> {
    // MUI TextField structure: the helper text is adjacent to the input wrapper div
    const helperText = this.page.locator('#email-helper-text');
    if (await helperText.isVisible()) {
      return helperText.textContent();
    }
    return null;
  }

  /**
   * Get validation error for password field
   */
  async getPasswordError(): Promise<string | null> {
    // MUI TextField structure: the helper text is adjacent to the input wrapper div
    const helperText = this.page.locator('#password-helper-text');
    if (await helperText.isVisible()) {
      return helperText.textContent();
    }
    return null;
  }

  /**
   * Wait for page to be loaded
   */
  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert successful login (redirected away from login page)
   */
  async expectLoginSuccess(): Promise<void> {
    // Wait for navigation away from login page
    await this.page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
  }

  /**
   * Assert login failed with error message
   */
  async expectLoginError(expectedMessage?: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorAlert).toContainText(expectedMessage);
    }
  }

  /**
   * Assert validation error on email field
   */
  async expectEmailValidationError(expectedMessage?: string): Promise<void> {
    const error = await this.getEmailError();
    expect(error).toBeTruthy();
    if (expectedMessage) {
      expect(error).toContain(expectedMessage);
    }
  }

  /**
   * Assert validation error on password field
   */
  async expectPasswordValidationError(
    expectedMessage?: string
  ): Promise<void> {
    const error = await this.getPasswordError();
    expect(error).toBeTruthy();
    if (expectedMessage) {
      expect(error).toContain(expectedMessage);
    }
  }

  /**
   * Assert submit button is disabled
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert submit button is enabled
   */
  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Assert loading state is active
   */
  async expectLoading(): Promise<void> {
    await expect(this.loadingIndicator).toBeVisible();
    await expect(this.submitButton).toBeDisabled();
  }
}
