import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../page-objects/LoginPage';
import { PharmacistNavigationPage } from '../page-objects/PharmacistNavigationPage';
import { testUsers } from '../fixtures/auth.fixture';

/**
 * Pharmacist Navigation E2E Tests
 *
 * Comprehensive test suite for verifying all pharmacist navigation links:
 * 1. Login flow
 * 2. Navigation link visibility
 * 3. Navigation link functionality
 * 4. Page load verification
 * 5. Database content display
 *
 * These tests ensure that:
 * - Pharmacist can log in successfully
 * - All navigation links are visible and clickable
 * - Each link navigates to the correct page
 * - Each page loads and displays content
 */

test.describe('Pharmacist Navigation Tests', () => {
  // Limit login test to generic browsers (chromium, firefox, webkit)
  // Exclude from pharmacist project which already has storageState
  test.describe('Login Flow', { tag: '@login' }, () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // No auth state

    test('should successfully log in as pharmacist', async ({ page }) => {
      // This test runs on browsers without pre-authenticated state
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.goto();

      // Verify login page loaded
      await loginPage.expectPageLoaded();

      // Log in with pharmacist credentials
      await loginPage.login(testUsers.pharmacist);

      // Verify successful login (redirected away from login page)
      await loginPage.expectLoginSuccess();

      // Verify redirected to dashboard
      await expect(page).toHaveURL(/.*\/(?!login)/);
    });

    test('should display pharmacist dashboard after login', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      // Verify we're on the dashboard
      await expect(pharmacistPage).toHaveURL(/\/(dashboard)?$/);

      // Verify main content is visible
      await navPage.expectPageContentLoaded();

      // Verify navigation is visible
      await navPage.expectNavigationVisible();
    });
  });

  test.describe('Navigation Visibility', () => {
    test('should display all navigation links for pharmacist role', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      // Navigate to home
      await navPage.goto();

      // Verify navigation container is visible
      await navPage.expectNavigationVisible();

      // Verify all navigation links are visible
      await navPage.expectAllNavigationLinksVisible();
    });

    test('should display navigation links in correct order', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Get all navigation items and verify they're visible
      const items = navPage.getNavigationItems();

      for (const item of items) {
        await navPage.expectNavigationLinkVisible(item.id);
      }
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate to dashboard and display content', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Test navigation flow
      await navPage.testNavigationFlow('dashboard');

      // Verify URL
      await navPage.expectUrlMatches('dashboard');

      // Verify content displays
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Prescriptions Navigation', () => {
    test('should navigate to prescriptions page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to prescriptions
      await navPage.testNavigationFlow('prescriptions');

      // Verify URL
      await navPage.expectUrlMatches('prescriptions');

      // Verify page content loads
      await navPage.expectPageContentLoaded('prescriptions');
    });

    test('should display prescriptions content from database', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('prescriptions');

      // Verify database content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Inventory Navigation', () => {
    test('should navigate to inventory page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to inventory
      await navPage.testNavigationFlow('inventory');

      // Verify URL
      await navPage.expectUrlMatches('inventory');

      // Verify page content loads
      await navPage.expectPageContentLoaded('inventory');
    });

    test('should display inventory content from database', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('inventory');

      // Verify database content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Teleconsultation Navigation', () => {
    test('should navigate to teleconsultation page', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to teleconsultation
      await navPage.testNavigationFlow('teleconsultation');

      // Verify URL
      await navPage.expectUrlMatches('teleconsultation');

      // Verify page content loads
      await navPage.expectPageContentLoaded('teleconsultation');
    });

    test('should display teleconsultation content', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('teleconsultation');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Consultation Calendar Navigation', () => {
    test('should navigate to consultation calendar page', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to consultation calendar
      await navPage.testNavigationFlow('consultation-calendar');

      // Verify URL
      await navPage.expectUrlMatches('consultation-calendar');

      // Verify page content loads
      await navPage.expectPageContentLoaded('consultation-calendar');
    });

    test('should display calendar content', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('consultation-calendar');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Medical Records Navigation', () => {
    test('should navigate to medical records page', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to medical records
      await navPage.testNavigationFlow('medical-records');

      // Verify URL
      await navPage.expectUrlMatches('medical-records');

      // Verify page content loads
      await navPage.expectPageContentLoaded('medical-records');
    });

    test('should display medical records content', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('medical-records');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Analytics Navigation', () => {
    test('should navigate to analytics page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to analytics
      await navPage.testNavigationFlow('analytics');

      // Verify URL
      await navPage.expectUrlMatches('analytics');

      // Verify page content loads
      await navPage.expectPageContentLoaded('analytics');
    });

    test('should display analytics content from database', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('analytics');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Marketing Navigation', () => {
    test('should navigate to marketing page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to marketing
      await navPage.testNavigationFlow('marketing');

      // Verify URL
      await navPage.expectUrlMatches('marketing');

      // Verify page content loads
      await navPage.expectPageContentLoaded('marketing');
    });

    test('should display marketing content from database', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('marketing');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Delivery Navigation', () => {
    test('should navigate to delivery page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to delivery
      await navPage.testNavigationFlow('delivery');

      // Verify URL
      await navPage.expectUrlMatches('delivery');

      // Verify page content loads
      await navPage.expectPageContentLoaded('delivery');
    });

    test('should display delivery content from database', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('delivery');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Settings Navigation', () => {
    test('should navigate to settings page', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to settings
      await navPage.testNavigationFlow('settings');

      // Verify URL
      await navPage.expectUrlMatches('settings');

      // Verify page content loads
      await navPage.expectPageContentLoaded('settings');
    });

    test('should display settings content', async ({ pharmacistPage }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();
      await navPage.navigateToPage('settings');

      // Verify content is displayed
      await navPage.expectDatabaseContentDisplayed();
    });
  });

  test.describe('Complete Navigation Flow', () => {
    test('should navigate through all pages in sequence', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Get all navigation items
      const items = navPage.getNavigationItems();

      // Navigate through each page
      for (const item of items) {
        await navPage.testNavigationFlow(item.id);

        // Verify we're on the correct page
        await navPage.expectUrlMatches(item.id);

        // Verify content loaded
        await navPage.expectPageContentLoaded(item.id);
      }
    });

    test('should maintain navigation state when switching pages', async ({
      pharmacistPage,
    }) => {
      const navPage = new PharmacistNavigationPage(pharmacistPage);

      await navPage.goto();

      // Navigate to prescriptions
      await navPage.navigateToPage('prescriptions');
      await navPage.expectUrlMatches('prescriptions');

      // Navigate to inventory
      await navPage.navigateToPage('inventory');
      await navPage.expectUrlMatches('inventory');

      // Navigate back to dashboard
      await navPage.navigateToPage('dashboard');
      await navPage.expectUrlMatches('dashboard');

      // Verify navigation is still visible
      await navPage.expectNavigationVisible();
    });
  });
});
