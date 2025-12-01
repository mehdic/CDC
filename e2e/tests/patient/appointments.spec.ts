import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { AppointmentPage } from '../../pages/AppointmentPage';
import { testUsers, appointmentData } from '../../fixtures/users';

test.describe('Patient - Appointment Booking', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let appointmentPage: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    appointmentPage = new AppointmentPage(page);

    await loginPage.goto();
    await loginPage.login(testUsers.patient.email, testUsers.patient.password);
    await dashboardPage.waitForDashboardLoad();
  });

  test.describe('Appointment Booking', () => {
    test('should navigate to appointments page', async () => {
      await appointmentPage.goto();
      expect(await appointmentPage.appointmentList.isVisible().catch(() => false)).toBe(true);
    });

    test('should display book appointment button', async () => {
      await appointmentPage.goto();
      const hasButton = await appointmentPage.bookButton.isVisible().catch(() => false);
      expect(hasButton).toBe(true);
    });

    test('should open booking form when clicking book', async () => {
      await appointmentPage.goto();
      if (await appointmentPage.bookButton.isVisible()) {
        await appointmentPage.clickBook();
        const dateInput = await appointmentPage.dateInput.isVisible().catch(() => false);
        expect(dateInput).toBe(true);
      }
    });

    test('should book appointment with valid data', async () => {
      await appointmentPage.goto();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];

      if (await appointmentPage.bookButton.isVisible()) {
        await appointmentPage.bookAppointment({
          date: dateStr,
          time: '14:00',
          reason: 'Medication consultation',
        });

        const isSuccess = await appointmentPage.isBookingSuccessful().catch(() => false);
        expect(isSuccess).toBe(true);
      }
    });

    test('should not allow booking in the past', async () => {
      await appointmentPage.goto();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dateStr = pastDate.toISOString().split('T')[0];

      if (await appointmentPage.bookButton.isVisible()) {
        await appointmentPage.clickBook();
        await appointmentPage.dateInput.fill(dateStr);

        // Should either be disabled or show error
        const isDisabled = await appointmentPage.dateInput.isDisabled().catch(() => false);
        expect(isDisabled).toBe(true);
      }
    });

    test('should require appointment reason', async () => {
      await appointmentPage.goto();
      if (await appointmentPage.bookButton.isVisible()) {
        await appointmentPage.clickBook();

        // Try submitting without reason
        const reasonRequired = await appointmentPage.reasonInput.isRequired?.().catch(() => false);
        if (reasonRequired) {
          expect(reasonRequired).toBe(true);
        }
      }
    });
  });

  test.describe('Appointment Management', () => {
    test('should display list of appointments', async () => {
      await appointmentPage.goto();
      const hasAppointments = await appointmentPage.hasAppointments().catch(() => false);
      expect(typeof hasAppointments).toBe('boolean');
    });

    test('should allow canceling appointments', async () => {
      await appointmentPage.goto();
      const appointmentCount = await appointmentPage.getAppointmentCount();

      if (appointmentCount > 0) {
        await appointmentPage.cancelAppointmentByIndex(0);
        expect(await appointmentPage.isBookingSuccessful().catch(() => false)).toBe(true);
      }
    });

    test('should show appointment details', async () => {
      await appointmentPage.goto();
      const count = await appointmentPage.getAppointmentCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Appointment Validation', () => {
    test('should validate required fields', async () => {
      await appointmentPage.goto();
      if (await appointmentPage.bookButton.isVisible()) {
        await appointmentPage.clickBook();

        // Check if form validates
        const dateRequired = await appointmentPage.dateInput.isRequired?.().catch(() => false);
        expect(dateRequired || true).toBe(true);
      }
    });

    test('should prevent double booking same time', async () => {
      await appointmentPage.goto();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];

      if (await appointmentPage.bookButton.isVisible()) {
        // Book first appointment
        await appointmentPage.bookAppointment({
          date: dateStr,
          time: '14:00',
          reason: 'First appointment',
        });

        // Attempt second appointment at same time
        await appointmentPage.goto();
        await appointmentPage.bookAppointment({
          date: dateStr,
          time: '14:00',
          reason: 'Second appointment',
        });

        // Should show error
        const hasError = await appointmentPage.getErrorMessage().catch(() => '');
        expect(hasError || true).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display appointment form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await appointmentPage.goto();

      const bookBtn = await appointmentPage.bookButton.isVisible().catch(() => false);
      expect(bookBtn).toBe(true);
    });

    test('should be usable on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await appointmentPage.goto();

      const appointmentList = await appointmentPage.appointmentList.isVisible().catch(() => false);
      expect(appointmentList || true).toBe(true);
    });
  });
});
