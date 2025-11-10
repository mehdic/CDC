import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Dashboard Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Mock dashboard analytics data
    await mockApiResponse(page, '**/dashboard/analytics', {
      status: 200,
      body: {
        success: true,
        data: {
          prescriptions: {
            total: 156,
            pending: 12,
            approved: 140,
            rejected: 4,
            trend: '+8%',
          },
          consultations: {
            total: 45,
            upcoming: 8,
            completed: 37,
            trend: '+12%',
          },
          revenue: {
            total: 125000,
            thisMonth: 32000,
            trend: '+15%',
          },
          inventory: {
            totalItems: 450,
            lowStock: 15,
            expiringSoon: 8,
          },
          deliveries: {
            total: 89,
            inTransit: 12,
            completed: 77,
          },
        },
      },
    });
  });

  test('should display dashboard with all metrics', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.expectPageLoaded();
    await dashboardPage.expectDashboardCardsVisible();
  });

  test('should show prescription statistics', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    const prescriptionCount = await dashboardPage.getPrescriptionsCount();
    expect(prescriptionCount).toBeTruthy();
  });

  test('should show revenue analytics', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    const revenue = await dashboardPage.getRevenueValue();
    expect(revenue).toBeTruthy();
  });

  test('should display patient metrics', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/dashboard/patients', {
      status: 200,
      body: {
        success: true,
        data: {
          totalPatients: 342,
          newPatients: 23,
          activePatients: 156,
          chronicPatients: 67,
        },
      },
    });

    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await expect(pharmacistPage.locator('[data-testid="patient-metrics"]')).toBeVisible();
  });

  test('should show popular medications chart', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/dashboard/popular-medications', {
      status: 200,
      body: {
        success: true,
        data: [
          { name: 'Paracétamol 500mg', count: 89 },
          { name: 'Ibuprofène 400mg', count: 67 },
          { name: 'Amoxicilline 500mg', count: 45 },
        ],
      },
    });

    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await expect(pharmacistPage.locator('[data-testid="popular-medications-chart"]')).toBeVisible();
  });

  test('should display consultation booking trends', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/dashboard/consultation-trends', {
      status: 200,
      body: {
        success: true,
        data: {
          thisWeek: 12,
          lastWeek: 8,
          trend: '+50%',
          peakDays: ['Monday', 'Wednesday'],
        },
      },
    });

    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await expect(pharmacistPage.locator('[data-testid="consultation-trends"]')).toBeVisible();
  });

  test('should filter analytics by date range', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/dashboard/analytics?start=**&end=**', {
      status: 200,
      body: {
        success: true,
        data: {
          prescriptions: { total: 45 },
          revenue: { total: 15000 },
        },
      },
    });

    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await dashboardPage.filterByDateRange(weekAgo, today);
  });

  test('should refresh dashboard data', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.refreshDashboard();
    await dashboardPage.expectPageLoaded();
  });

  test('should navigate to prescriptions from dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.navigateToPrescriptions();
    await expect(pharmacistPage).toHaveURL(/prescriptions/);
  });

  test('should navigate to inventory from dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.navigateToInventory();
    await expect(pharmacistPage).toHaveURL(/inventory/);
  });

  test('should navigate to teleconsultation from dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.navigateToTeleconsultation();
    await expect(pharmacistPage).toHaveURL(/teleconsultation/);
  });

  test('should navigate to messaging from dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.navigateToMessaging();
    await expect(pharmacistPage).toHaveURL(/messages/);
  });

  test('should navigate to delivery from dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await dashboardPage.navigateToDelivery();
    await expect(pharmacistPage).toHaveURL(/deliveries/);
  });

  test('should display real-time notifications', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await expect(pharmacistPage.locator('[data-testid="notifications-panel"]')).toBeVisible();
  });

  test('should show low inventory alerts on dashboard', async ({ pharmacistPage }) => {
    const dashboardPage = new DashboardPage(pharmacistPage);
    await dashboardPage.goto();

    await expect(dashboardPage.inventoryCard).toContainText(/15/); // 15 low stock items
  });
});
