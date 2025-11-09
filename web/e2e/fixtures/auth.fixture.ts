import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * Test user credentials for authentication testing
 */
export interface TestUser {
  email: string;
  password: string;
  role: 'pharmacist' | 'doctor' | 'patient';
  firstName?: string;
  lastName?: string;
  pharmacyId?: string;
}

/**
 * Default test users for different roles
 */
export const testUsers: Record<string, TestUser> = {
  pharmacist: {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist',
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  },
  doctor: {
    email: 'doctor@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'doctor',
    firstName: 'Jean',
    lastName: 'Martin',
  },
  patient: {
    email: 'patient@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'patient',
    firstName: 'Sophie',
    lastName: 'Bernard',
  },
};

/**
 * Extended test fixtures with authentication helpers
 */
type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
  pharmacistPage: Page;
};

/**
 * Extend base test with authentication fixtures
 *
 * Usage in tests:
 * - test.use({ testUser: testUsers.pharmacist })
 * - Provides loginPage, authenticatedPage, and pharmacistPage fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Login page object - available for all tests
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Authenticated page - logs in with default pharmacist user
   * before each test and logs out after
   */
  authenticatedPage: async ({ page }, use) => {
    // Login with default pharmacist user
    await login(page, testUsers.pharmacist);

    // Wait for navigation to complete
    await page.waitForURL(/.*\/(?:dashboard|prescriptions|inventory)/, {
      timeout: 10000,
    });

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Pharmacist authenticated page - specifically for pharmacist role
   */
  pharmacistPage: async ({ page }, use) => {
    // Login as pharmacist
    await login(page, testUsers.pharmacist);

    // Wait for pharmacist dashboard
    await page.waitForURL(/.*\/(?:dashboard|prescriptions|inventory)/, {
      timeout: 10000,
    });

    await use(page);

    // Logout after test
    await clearAuth(page);
  },
});

export { expect } from '@playwright/test';
