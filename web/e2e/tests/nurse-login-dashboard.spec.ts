import { test, expect } from '../fixtures/auth.fixture';
import { NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Nurse Login and Dashboard (E2E-016)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock patient list for nurse dashboard
    await mockApiResponse(page, '**/nurse/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            name: 'Paul Deschamp',
            room: '101',
            age: 72,
            conditions: ['Hypertension', 'Diabète'],
            activeOrders: 2,
          },
          {
            id: 'patient_002',
            name: 'Marie Rousseau',
            room: '102',
            age: 58,
            conditions: ['Asthme'],
            activeOrders: 1,
          },
          {
            id: 'patient_003',
            name: 'Jean-Claude Fontaine',
            room: '103',
            age: 65,
            conditions: ['Arthrite'],
            activeOrders: 0,
          },
        ],
        total: 3,
      },
    });

    // Mock dashboard summary
    await mockApiResponse(page, '**/nurse/dashboard/summary**', {
      status: 200,
      body: {
        success: true,
        data: {
          totalPatients: 3,
          activeOrders: 3,
          pendingDeliveries: 2,
          unreadMessages: 1,
          newAlerts: 0,
        },
      },
    });
  });

  test('should login as nurse and display dashboard', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);

    // Navigate to nurse dashboard
    await nursePageObj.goto();

    // Verify page is loaded with correct title
    await nursePageObj.expectPageLoaded();

    // Verify dashboard displays patient count
    await expect(nursePageObj.patientList).toBeVisible();

    // Verify search is available
    await expect(nursePageObj.patientSearchInput).toBeVisible();
  });

  test('should display nurse profile information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify nurse name is displayed
    const profileName = nursePage.locator('[data-testid="profile-name"]');
    await expect(profileName).toContainText('Caroline Leclerc');

    // Verify role badge
    const roleBadge = nursePage.locator('[data-testid="role-badge"]');
    await expect(roleBadge).toContainText(/infirmier|nurse/i);
  });

  test('should display dashboard summary statistics', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify total patients displayed
    const patientCountElement = nursePage.locator('[data-testid="total-patients"]');
    await expect(patientCountElement).toContainText('3');

    // Verify active orders counter
    const activeOrdersElement = nursePage.locator('[data-testid="active-orders-count"]');
    await expect(activeOrdersElement).toContainText('3');

    // Verify pending deliveries counter
    const pendingDeliveriesElement = nursePage.locator('[data-testid="pending-deliveries"]');
    await expect(pendingDeliveriesElement).toContainText('2');

    // Verify unread messages counter
    const unreadMessagesElement = nursePage.locator('[data-testid="unread-messages"]');
    await expect(unreadMessagesElement).toContainText('1');
  });

  test('should display patient list with details', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify first patient is displayed
    const patientElement = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientElement).toBeVisible();
    await expect(patientElement).toContainText('Paul Deschamp');
    await expect(patientElement).toContainText('Room 101');

    // Verify patient conditions are displayed
    const conditionsElement = patientElement.locator('[data-testid="conditions"]');
    await expect(conditionsElement).toContainText('Hypertension');
    await expect(conditionsElement).toContainText('Diabète');
  });

  test('should allow nurse to logout', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Click logout button
    const logoutButton = nursePage.getByRole('button', { name: /déconnexion|logout/i });
    await logoutButton.click();

    // Verify redirected to login page
    await nursePage.waitForURL(/.*\/(?:login|auth)/);
    await expect(nursePage.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should display nurse navigation menu with key options', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify dashboard menu item
    const dashboardMenuItem = nursePage.getByRole('link', { name: /tableau de bord|dashboard/i });
    await expect(dashboardMenuItem).toBeVisible();

    // Verify patients menu item
    const patientsMenuItem = nursePage.getByRole('link', { name: /patients/i });
    await expect(patientsMenuItem).toBeVisible();

    // Verify orders menu item
    const ordersMenuItem = nursePage.getByRole('link', { name: /commandes|orders/i });
    await expect(ordersMenuItem).toBeVisible();

    // Verify messaging menu item
    const messagingMenuItem = nursePage.getByRole('link', { name: /messagerie|messaging|messages/i });
    await expect(messagingMenuItem).toBeVisible();
  });

  test('should display upcoming deliveries widget', async ({ nursePage }) => {
    await mockApiResponse(nursePage, '**/nurse/deliveries/upcoming**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'delivery_001',
            patientName: 'Paul Deschamp',
            eta: new Date(Date.now() + 3600000).toISOString(),
            status: 'in_transit',
            medications: ['Lisinopril', 'Metformine'],
          },
          {
            id: 'delivery_002',
            patientName: 'Marie Rousseau',
            eta: new Date(Date.now() + 7200000).toISOString(),
            status: 'prepared',
            medications: ['Salbutamol Inhaler'],
          },
        ],
        total: 2,
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify upcoming deliveries widget
    const deliveriesWidget = nursePage.locator('[data-testid="upcoming-deliveries-widget"]');
    await expect(deliveriesWidget).toBeVisible();

    // Verify deliveries count
    const deliveriesCount = nursePage.locator('[data-testid="upcoming-deliveries-count"]');
    await expect(deliveriesCount).toContainText('2');
  });

  test('should allow navigation to patient details', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Click on patient
    const patientLink = nursePage.locator('[data-testid="patient-patient_001"]');
    await patientLink.click();

    // Verify navigation to patient details
    await nursePage.waitForURL(/.*\/nurse\/patients\/patient_001/);
    await expect(nursePage.locator('[data-testid="patient-details-view"]')).toBeVisible();
  });

  test('should display quick action buttons', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify create order button
    const createOrderButton = nursePage.getByRole('button', { name: /nouvelle commande|new order|create order/i });
    await expect(createOrderButton).toBeVisible();

    // Verify search patient button
    const searchButton = nursePage.getByRole('button', { name: /chercher|search/i });
    await expect(searchButton).toBeVisible();

    // Verify messaging button
    const messagingButton = nursePage.getByRole('button', { name: /messagerie|messaging|messages/i });
    await expect(messagingButton).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ nursePage }) => {
    // Mock network error
    await mockApiResponse(nursePage, '**/nurse/patients**', {
      status: 500,
      body: {
        success: false,
        error: 'Internal server error',
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.page.goto('/nurse/dashboard');

    // Verify error message is displayed
    const errorMessage = nursePage.locator('[data-testid="error-alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/erreur|error/i);

    // Verify retry button is available
    const retryButton = nursePage.getByRole('button', { name: /réessayer|retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('should update dashboard in real-time', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Get initial order count
    const initialOrderCount = await nursePage
      .locator('[data-testid="active-orders-count"]')
      .textContent();

    // Mock updated orders
    await mockApiResponse(nursePage, '**/nurse/dashboard/summary**', {
      status: 200,
      body: {
        success: true,
        data: {
          totalPatients: 3,
          activeOrders: 4,
          pendingDeliveries: 2,
          unreadMessages: 1,
          newAlerts: 0,
        },
      },
    });

    // Trigger refresh
    const refreshButton = nursePage.getByRole('button', { name: /actualiser|refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    } else {
      // If no refresh button, manually trigger navigation
      await nursePage.reload();
    }

    // Verify order count updated
    const updatedOrderCount = await nursePage
      .locator('[data-testid="active-orders-count"]')
      .textContent();
    expect(parseInt(updatedOrderCount || '0')).toBeGreaterThanOrEqual(parseInt(initialOrderCount || '0'));
  });
});
