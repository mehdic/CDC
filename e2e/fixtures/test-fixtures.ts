import { test as base, Page } from '@playwright/test';
import { APIMocks } from '../utils/api-mocks';

/**
 * Custom Playwright Fixtures
 * Extends base test with automatic API mocking
 */

type TestFixtures = {
  authenticatedPage: Page;
  nurseAuthenticatedPage: Page;
  pharmacistAuthenticatedPage: Page;
  doctorAuthenticatedPage: Page;
  patientAuthenticatedPage: Page;
};

/**
 * Extended test with fixtures for authenticated pages
 */
export const test = base.extend<TestFixtures>({
  /**
   * Generic authenticated page with login mocking
   */
  authenticatedPage: async ({ page }, use) => {
    // Mock login endpoint to always succeed
    await APIMocks.mockLoginEndpoint(page, true);

    // Mock user profile endpoint
    await APIMocks.mockUserProfileEndpoint(page);

    await use(page);
  },

  /**
   * Nurse-specific authenticated page
   */
  nurseAuthenticatedPage: async ({ page }, use) => {
    // Mock login endpoint
    await APIMocks.mockLoginEndpoint(page, true);

    // Mock user profile as nurse
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'nurse-001',
            email: 'nurse@test.metapharm.ch',
            firstName: 'Sophie',
            lastName: 'Richard',
            role: 'NURSE',
            phone: '+41794234567',
            institutionId: 'institution-001',
          },
        }),
      });
    });

    // Mock all nurse-specific endpoints
    await APIMocks.mockAllNurseEndpoints(page);

    await use(page);
  },

  /**
   * Pharmacist-specific authenticated page
   */
  pharmacistAuthenticatedPage: async ({ page }, use) => {
    // Mock login endpoint
    await APIMocks.mockLoginEndpoint(page, true);

    // Mock user profile as pharmacist
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'pharmacist-001',
            email: 'pharmacist@test.metapharm.ch',
            firstName: 'Marie',
            lastName: 'Martin',
            role: 'PHARMACIST',
            phone: '+41792234567',
            pharmacyId: 'pharmacy-001',
            pharmacyName: 'Pharmacie du Centre',
          },
        }),
      });
    });

    // Mock pharmacist-specific endpoints
    await APIMocks.mockInventoryEndpoint(page);
    await APIMocks.mockPrescriptionsEndpoint(page);
    await APIMocks.mockMessagesEndpoint(page);

    await use(page);
  },

  /**
   * Doctor-specific authenticated page
   */
  doctorAuthenticatedPage: async ({ page }, use) => {
    // Mock login endpoint
    await APIMocks.mockLoginEndpoint(page, true);

    // Mock user profile as doctor
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'doctor-001',
            email: 'doctor@test.metapharm.ch',
            firstName: 'Pierre',
            lastName: 'Bernard',
            role: 'DOCTOR',
            phone: '+41793234567',
            licensingNumber: 'MED123456',
          },
        }),
      });
    });

    // Mock doctor-specific endpoints
    await APIMocks.mockPrescriptionsEndpoint(page);

    await use(page);
  },

  /**
   * Patient-specific authenticated page
   */
  patientAuthenticatedPage: async ({ page }, use) => {
    // Mock login endpoint
    await APIMocks.mockLoginEndpoint(page, true);

    // Mock user profile as patient
    await APIMocks.mockUserProfileEndpoint(page);

    // Mock patient-specific endpoints
    await APIMocks.mockAppointmentsEndpoint(page);
    await APIMocks.mockPrescriptionsEndpoint(page);
    await APIMocks.mockMessagesEndpoint(page);

    await use(page);
  },
});

export { expect } from '@playwright/test';
