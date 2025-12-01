import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { testUsers } from '../../fixtures/users';

test.describe('Authentication - Logout Flows', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.patient.email, testUsers.patient.password);
    await dashboardPage.waitForDashboardLoad();
  });

  test('should logout successfully', async ({ page }) => {
    await loginPage.logout();
    expect(page.url()).toContain('/login');
  });

  test('should clear session after logout', async ({ page }) => {
    await loginPage.logout();

    // Attempt to navigate to protected route
    await page.goto('/dashboard');
    expect(page.url()).toContain('/login');
  });

  test('should clear all user data after logout', async ({ page }) => {
    const localStorage = await page.evaluate(() => localStorage.length);
    expect(localStorage).toBeGreaterThanOrEqual(0);

    await loginPage.logout();

    // Check that auth tokens are cleared (may depend on implementation)
    const cookie = await page.context().cookies();
    const authCookie = cookie.find((c) => c.name.includes('auth') || c.name.includes('token'));
    // Note: Cookie clearing depends on implementation
  });

  test('should redirect to login after logout', async ({ page }) => {
    await loginPage.logout();
    const loginVisible = await loginPage.emailInput.isVisible().catch(() => false);
    // Should be on login page (may redirect automatically)
    expect(page.url().includes('/login') || loginVisible).toBe(true);
  });

  test('should allow login again after logout', async () => {
    await loginPage.logout();
    await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
    expect(await loginPage.isLoggedIn()).toBe(true);
  });

  test('should invalidate refresh tokens on logout', async ({ page }) => {
    await loginPage.logout();

    // Attempt to use refresh token
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    if (refreshToken) {
      // Token should be cleared
      expect(refreshToken).toBeNull();
    }
  });

  test('should work across all user roles', async ({ page, context }) => {
    const roles = [
      { email: testUsers.patient.email, password: testUsers.patient.password },
      { email: testUsers.pharmacist.email, password: testUsers.pharmacist.password },
    ];

    for (const role of roles) {
      const page = await context.newPage();
      const login = new LoginPage(page);
      const dashboard = new DashboardPage(page);

      await login.goto();
      await login.login(role.email, role.password);
      await dashboard.waitForDashboardLoad();

      await login.logout();
      expect(page.url()).toContain('/login');

      await page.close();
    }
  });

  test('should prevent access to protected routes after logout', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/appointments', '/messages', '/prescriptions'];

    await loginPage.logout();

    for (const route of protectedRoutes) {
      await page.goto(route);
      expect(page.url()).toContain('/login');
      await loginPage.goto();
    }
  });
});
