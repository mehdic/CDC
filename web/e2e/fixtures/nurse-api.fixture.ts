/**
 * Nurse API Mocking Fixture
 *
 * Provides mock API responses for nurse endpoints when MOCK_AUTH mode is enabled.
 * This prevents ECONNREFUSED errors when backend is not running during E2E tests.
 *
 * Usage:
 *   import { test } from '../fixtures/nurse-api.fixture';
 *   test('some test', async ({ page }) => { ... });
 */

import { test as base, expect, Page } from '@playwright/test';

/**
 * Mock data for nurse API responses
 */
const MOCK_NURSE_DASHBOARD_SUMMARY = {
  data: {
    totalPatients: 24,
    activeTreatments: 12,
    pendingOrders: 5,
    upcomingDeliveries: 3,
    criticalAlerts: 1,
    notifications: [
      {
        id: '1',
        type: 'alert',
        message: 'Patient Marie Dubois - Medication due in 30 minutes',
        timestamp: new Date().toISOString(),
        priority: 'high',
      },
      {
        id: '2',
        type: 'info',
        message: 'Delivery scheduled for 14:30 - Room 204',
        timestamp: new Date().toISOString(),
        priority: 'medium',
      },
    ],
  },
};

const MOCK_NURSE_PATIENTS = {
  data: [
    {
      id: 'patient-1',
      firstName: 'Marie',
      lastName: 'Dubois',
      room: '204',
      ward: 'Cardiology',
      status: 'stable',
      medications: 3,
      nextMedication: new Date(Date.now() + 30 * 60000).toISOString(),
    },
    {
      id: 'patient-2',
      firstName: 'Jean',
      lastName: 'Martin',
      room: '305',
      ward: 'Orthopedics',
      status: 'critical',
      medications: 5,
      nextMedication: new Date(Date.now() + 60 * 60000).toISOString(),
    },
    {
      id: 'patient-3',
      firstName: 'Sophie',
      lastName: 'Bernard',
      room: '102',
      ward: 'Neurology',
      status: 'stable',
      medications: 2,
      nextMedication: new Date(Date.now() + 120 * 60000).toISOString(),
    },
  ],
};

const MOCK_NURSE_DELIVERIES_UPCOMING = {
  data: [
    {
      id: 'delivery-1',
      patientId: 'patient-1',
      patientName: 'Marie Dubois',
      room: '204',
      medication: 'Aspirin 100mg',
      scheduledTime: new Date(Date.now() + 90 * 60000).toISOString(),
      status: 'scheduled',
    },
    {
      id: 'delivery-2',
      patientId: 'patient-2',
      patientName: 'Jean Martin',
      room: '305',
      medication: 'Morphine 10mg',
      scheduledTime: new Date(Date.now() + 150 * 60000).toISOString(),
      status: 'in_transit',
    },
    {
      id: 'delivery-3',
      patientId: 'patient-3',
      patientName: 'Sophie Bernard',
      room: '102',
      medication: 'Paracetamol 500mg',
      scheduledTime: new Date(Date.now() + 180 * 60000).toISOString(),
      status: 'scheduled',
    },
  ],
};

const MOCK_NURSE_ORDERS = {
  data: [
    {
      id: 'order-1',
      patientId: 'patient-1',
      patientName: 'Marie Dubois',
      medication: 'Aspirin 100mg',
      status: 'pending',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'order-2',
      patientId: 'patient-2',
      patientName: 'Jean Martin',
      medication: 'Morphine 10mg',
      status: 'pending',
      createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
  ],
};

/**
 * Setup API route mocking for nurse endpoints
 */
async function setupNurseApiMocks(page: Page) {
  // Mock dashboard summary endpoint
  await page.route('**/api/nurse/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_DASHBOARD_SUMMARY),
    });
  });

  // Mock patients list endpoint
  await page.route('**/api/nurse/patients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_PATIENTS),
    });
  });

  // Mock upcoming deliveries endpoint
  await page.route('**/api/nurse/deliveries/upcoming', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_DELIVERIES_UPCOMING),
    });
  });

  // Mock orders endpoint (for pending orders)
  await page.route('**/api/nurse/orders?status=pending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_ORDERS),
    });
  });

  // Mock generic orders endpoint
  await page.route('**/api/nurse/orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_ORDERS),
    });
  });

  // Mock patient detail endpoint (dynamic ID)
  await page.route('**/api/nurse/patients/*', async (route) => {
    const patientId = route.request().url().split('/').pop();
    const patient = MOCK_NURSE_PATIENTS.data.find((p) => p.id === patientId);

    if (patient) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: patient }),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Patient not found' }),
      });
    }
  });

  // Mock order detail endpoint (dynamic ID)
  await page.route('**/api/nurse/orders/*', async (route) => {
    const orderId = route.request().url().split('/').pop();
    const order = MOCK_NURSE_ORDERS.data.find((o) => o.id === orderId);

    if (order) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: order }),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Order not found' }),
      });
    }
  });
}

/**
 * Extended test fixture with nurse API mocking
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Check if MOCK_AUTH mode is enabled
    if (process.env.MOCK_AUTH === 'true') {
      // Setup nurse API mocks before each test
      await setupNurseApiMocks(page);
    }

    // Use the page with mocks configured
    await use(page);
  },
});

export { expect };
