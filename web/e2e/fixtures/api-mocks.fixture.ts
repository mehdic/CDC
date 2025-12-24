/**
 * Unified API Mocking Fixture for All Roles
 *
 * Provides mock API responses for all dashboard and role-specific endpoints
 * when MOCK_AUTH mode is enabled. This prevents ECONNREFUSED errors when
 * backend is not running during E2E tests.
 *
 * Usage:
 *   import { test } from '../fixtures/api-mocks.fixture';
 *   test('some test', async ({ page }) => { ... });
 */

import { test as base, expect, Page } from '@playwright/test';

/**
 * Mock dashboard analytics data
 */
const MOCK_DASHBOARD_ANALYTICS = {
  success: true,
  data: {
    prescriptions: {
      total: 150,
      pending: 12,
      approved: 120,
      rejected: 18,
      trend: '+5%',
    },
    consultations: {
      total: 45,
      upcoming: 8,
      completed: 37,
      trend: '+12%',
    },
    revenue: {
      total: 45500.50,
      thisMonth: 12450.50,
      trend: '+8%',
    },
    inventory: {
      totalItems: 450,
      lowStock: 5,
      expiringSoon: 12,
    },
    deliveries: {
      total: 85,
      inTransit: 8,
      completed: 77,
    },
  },
};

/**
 * Mock patient metrics data
 */
const MOCK_PATIENT_METRICS = {
  success: true,
  data: {
    totalPatients: 324,
    newPatients: 12,
    activePatients: 145,
    chronicPatients: 78,
  },
};

/**
 * Mock popular medications data
 */
const MOCK_POPULAR_MEDICATIONS = {
  success: true,
  data: [
    { name: 'Aspirin 100mg', count: 45 },
    { name: 'Paracetamol 500mg', count: 38 },
    { name: 'Ibuprofen 400mg', count: 32 },
  ],
};

/**
 * Mock consultation trends data
 */
const MOCK_CONSULTATION_TRENDS = {
  success: true,
  data: {
    thisWeek: 28,
    lastWeek: 24,
    trend: '+16%',
    peakDays: ['Monday', 'Wednesday', 'Friday'],
  },
};

/**
 * Mock dashboard data for role-specific summary endpoints (legacy)
 */
const MOCK_DASHBOARDS = {
  pharmacist: {
    data: {
      pendingPrescriptions: 12,
      lowStockItems: 5,
      todayRevenue: 2450.50,
      activeDeliveries: 8,
      notifications: [
        {
          id: '1',
          type: 'alert',
          message: 'Low stock alert: Aspirin 100mg',
          timestamp: new Date().toISOString(),
          priority: 'high',
        },
      ],
    },
  },
  doctor: {
    data: {
      todayAppointments: 8,
      pendingConsultations: 3,
      activePatients: 45,
      unreadMessages: 5,
      notifications: [
        {
          id: '1',
          type: 'info',
          message: 'Appointment with Patient Martin in 30 minutes',
          timestamp: new Date().toISOString(),
          priority: 'medium',
        },
      ],
    },
  },
  nurse: {
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
      ],
    },
  },
  patient: {
    data: {
      activePrescriptions: 2,
      upcomingAppointments: 1,
      recentOrders: 3,
      vipStatus: false,
      loyaltyPoints: 120,
      notifications: [
        {
          id: '1',
          type: 'info',
          message: 'Your prescription is ready for pickup',
          timestamp: new Date().toISOString(),
          priority: 'medium',
        },
      ],
    },
  },
  delivery: {
    data: {
      activeDeliveries: 4,
      completedToday: 12,
      pendingPickups: 2,
      totalDistance: 45.5,
      notifications: [
        {
          id: '1',
          type: 'info',
          message: 'New delivery assigned - Rue de la Gare 12',
          timestamp: new Date().toISOString(),
          priority: 'medium',
        },
      ],
    },
  },
};

/**
 * Mock data for nurse-specific endpoints
 */
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
  ],
};

/**
 * Setup API route mocking for all role endpoints
 */
async function setupApiMocks(page: Page) {
  // ============================================
  // Dashboard analytics endpoints (used by pharmacist dashboard)
  // ============================================
  await page.route('**/api/dashboard/analytics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD_ANALYTICS),
    });
  });

  await page.route('**/api/dashboard/patients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PATIENT_METRICS),
    });
  });

  await page.route('**/api/dashboard/popular-medications', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_POPULAR_MEDICATIONS),
    });
  });

  await page.route('**/api/dashboard/consultation-trends', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CONSULTATION_TRENDS),
    });
  });

  // ============================================
  // Dashboard summary endpoints for ALL roles (legacy/fallback)
  // ============================================
  await page.route('**/api/pharmacist/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARDS.pharmacist),
    });
  });

  await page.route('**/api/doctor/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARDS.doctor),
    });
  });

  await page.route('**/api/nurse/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARDS.nurse),
    });
  });

  await page.route('**/api/patient/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARDS.patient),
    });
  });

  await page.route('**/api/delivery/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARDS.delivery),
    });
  });

  // ============================================
  // Nurse-specific endpoints
  // ============================================
  await page.route('**/api/nurse/patients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_PATIENTS),
    });
  });

  await page.route('**/api/nurse/orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_ORDERS),
    });
  });

  await page.route('**/api/nurse/orders?status=pending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_ORDERS),
    });
  });

  await page.route('**/api/nurse/deliveries/upcoming', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NURSE_DELIVERIES_UPCOMING),
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

  // ============================================
  // Pharmacist-specific endpoints
  // ============================================
  await page.route('**/api/pharmacist/prescriptions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/pharmacist/inventory', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/pharmacist/deliveries', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/pharmacist/analytics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { revenue: [], prescriptions: [] } }),
    });
  });

  await page.route('**/api/pharmacist/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/pharmacist/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/pharmacist/settings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  // ============================================
  // Doctor-specific endpoints
  // ============================================
  await page.route('**/api/doctor/appointments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/doctor/patients', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/doctor/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // ============================================
  // Patient-specific endpoints
  // ============================================
  await page.route('**/api/patient/prescriptions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/patient/appointments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/patient/orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/patient/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // ============================================
  // Delivery-specific endpoints
  // ============================================
  await page.route('**/api/delivery/deliveries', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/delivery/routes', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}

/**
 * Extended test fixture with unified API mocking
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Check if MOCK_AUTH mode is enabled
    if (process.env.MOCK_AUTH === 'true') {
      // Setup API mocks before each test
      await setupApiMocks(page);
    }

    // Use the page with mocks configured
    await use(page);
  },
});

export { expect };
