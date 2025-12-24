import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { login, clearAuth, loginWithStoredAuth } from '../utils/auth-helpers';
import { mockLoginSuccess } from '../utils/api-mock';

/**
 * Test user credentials for authentication testing
 */
export interface TestUser {
  email: string;
  password: string;
  role: 'pharmacist' | 'doctor' | 'patient' | 'nurse' | 'delivery';
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
  nurse: {
    email: 'nurse@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'nurse',
    firstName: 'Caroline',
    lastName: 'Leclerc',
  },
  delivery: {
    email: 'delivery@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'delivery',
    firstName: 'Marc',
    lastName: 'Rousseau',
  },
};

/**
 * Extended test fixtures with authentication helpers
 */
type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
  pharmacistPage: Page;
  nursePage: Page;
  patientPage: Page;
  doctorPage: Page;
  deliveryPage: Page;
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
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  authenticatedPage: async ({ page }, use) => {
    // Mock successful login BEFORE navigating
    await mockLoginSuccess(page, {
      email: testUsers.pharmacist.email,
      role: testUsers.pharmacist.role,
      firstName: testUsers.pharmacist.firstName,
      lastName: testUsers.pharmacist.lastName,
      pharmacyId: testUsers.pharmacist.pharmacyId,
    });

    // Navigate to app
    await page.goto('/');

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Pharmacist authenticated page - specifically for pharmacist role
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  pharmacistPage: async ({ page }, use) => {
    // Mock successful login BEFORE navigating
    await mockLoginSuccess(page, {
      email: testUsers.pharmacist.email,
      role: testUsers.pharmacist.role,
      firstName: testUsers.pharmacist.firstName,
      lastName: testUsers.pharmacist.lastName,
      pharmacyId: testUsers.pharmacist.pharmacyId,
    });

    // Navigate to app
    await page.goto('/');

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Nurse authenticated page - specifically for nurse role
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  nursePage: async ({ page }, use) => {
    // Set authentication tokens directly in localStorage
    await loginWithStoredAuth(page, {
      accessToken: 'mock_access_token_nurse',
      refreshToken: 'mock_refresh_token_nurse',
      user: {
        id: testUsers.nurse.email,
        email: testUsers.nurse.email,
        role: testUsers.nurse.role,
        firstName: testUsers.nurse.firstName,
        lastName: testUsers.nurse.lastName,
      },
    });

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Patient authenticated page - specifically for patient role
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  patientPage: async ({ page }, use) => {
    // Set authentication tokens directly in localStorage
    await loginWithStoredAuth(page, {
      accessToken: 'mock_access_token_patient',
      refreshToken: 'mock_refresh_token_patient',
      user: {
        id: testUsers.patient.email,
        email: testUsers.patient.email,
        role: testUsers.patient.role,
        firstName: testUsers.patient.firstName,
        lastName: testUsers.patient.lastName,
      },
    });

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Doctor authenticated page - specifically for doctor role
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  doctorPage: async ({ page }, use) => {
    // Mock successful login BEFORE navigating
    await mockLoginSuccess(page, {
      email: testUsers.doctor.email,
      role: testUsers.doctor.role,
      firstName: testUsers.doctor.firstName,
      lastName: testUsers.doctor.lastName,
    });

    // Navigate to app
    await page.goto('/');

    await use(page);

    // Logout after test
    await clearAuth(page);
  },

  /**
   * Delivery authenticated page - specifically for delivery personnel role
   *
   * Uses storageState if available, otherwise falls back to manual login
   */
  deliveryPage: async ({ page }, use) => {
    // Mock successful login BEFORE navigating
    await mockLoginSuccess(page, {
      email: testUsers.delivery.email,
      role: testUsers.delivery.role,
      firstName: testUsers.delivery.firstName,
      lastName: testUsers.delivery.lastName,
    });

    // Navigate to app
    await page.goto('/');

    await use(page);

    // Logout after test
    await clearAuth(page);
  },
});

export { expect } from '@playwright/test';
