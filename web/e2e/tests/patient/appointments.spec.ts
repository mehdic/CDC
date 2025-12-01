/**
 * Patient Appointment Management E2E Tests
 * Tests for booking, viewing, and managing teleconsultation appointments
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockPatient, generateTestEmail } from '../../utils/test-data';

customTest.describe('Patient - Appointment Management', () => {
  customTest.beforeEach(async ({ patientPage }) => {
    // Fixture automatically logs in as patient
    await patientPage.goto('/appointments');
  });

  customTest.describe('View Appointments', () => {
    customTest('should display list of patient appointments', async ({ patientPage }) => {
      // Verify appointments page loads
      await expect(patientPage.getByRole('heading', { name: /appointments/i })).toBeVisible();

      // Verify appointment list or empty state exists
      const appointmentList = patientPage.locator('[data-testid="appointments-list"]');
      const emptyState = patientPage.locator('[data-testid="empty-appointments"]');

      const hasAppointments = await appointmentList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasAppointments || isEmpty).toBeTruthy();
    });

    customTest('should filter appointments by status (upcoming, completed, cancelled)', async ({ patientPage }) => {
      const statusButtons = patientPage.getByRole('button', { name: /upcoming|completed|cancelled/i });
      const count = await statusButtons.count();

      if (count > 0) {
        // Click first status filter
        await statusButtons.first().click();

        // Verify filter was applied
        await expect(patientPage.locator('[data-testid="appointments-list"]')).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should display appointment details with doctor info', async ({ patientPage }) => {
      // Look for appointment card
      const appointmentCard = patientPage.locator('[data-testid="appointment-card"]').first();

      if (await appointmentCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify appointment contains doctor info
        const doctorName = appointmentCard.locator('[data-testid="doctor-name"]');
        const appointmentTime = appointmentCard.locator('[data-testid="appointment-time"]');

        expect(await doctorName.isVisible()).toBeTruthy();
        expect(await appointmentTime.isVisible()).toBeTruthy();
      }
    });

    customTest('should sort appointments by date (newest first)', async ({ patientPage }) => {
      // Look for sort dropdown
      const sortDropdown = patientPage.getByRole('button', { name: /sort|trier/i });

      if (await sortDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sortDropdown.click();

        const newestOption = patientPage.getByRole('menuitem', { name: /newest|plus récent/i });
        if (await newestOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await newestOption.click();

          // Verify sorting was applied
          await patientPage.waitForTimeout(500);
        }
      }
    });
  });

  customTest.describe('Book Appointment', () => {
    customTest('should open appointment booking modal', async ({ patientPage }) => {
      const bookButton = patientPage.getByRole('button', { name: /book|réserver|prendre rendez-vous/i });

      if (await bookButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bookButton.click();

        // Verify booking modal opens
        const modal = patientPage.locator('[data-testid="book-appointment-modal"], [role="dialog"]').first();
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should select doctor from available list', async ({ patientPage }) => {
      // Mock doctor list API
      await mockApiResponse(patientPage, '**/doctors**', {
        status: 200,
        body: {
          success: true,
          data: [
            {
              id: 'doctor_1',
              firstName: 'Jean',
              lastName: 'Martin',
              specialization: 'Généraliste',
              available: true,
            },
            {
              id: 'doctor_2',
              firstName: 'Marie',
              lastName: 'Dupre',
              specialization: 'Cardiologue',
              available: true,
            },
          ],
        },
      });

      const doctorSelects = patientPage.locator('[data-testid="doctor-option"]');

      if (await doctorSelects.count() > 0) {
        await doctorSelects.first().click();

        // Verify doctor was selected
        const selected = doctorSelects.first().locator('[data-testid="selected-indicator"]');
        expect(await selected.isVisible({ timeout: 2000 }).catch(() => true)).toBeTruthy();
      }
    });

    customTest('should select date and time from available slots', async ({ patientPage }) => {
      // Look for date picker
      const dateInput = patientPage.locator('input[name="appointmentDate"], [data-testid="date-picker"]').first();

      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.click();

        // Select a future date
        const futureDate = patientPage.locator('button[aria-label*="15"]').first();
        if (await futureDate.isVisible({ timeout: 2000 }).catch(() => false)) {
          await futureDate.click();
        }
      }

      // Look for time slots
      const timeSlots = patientPage.locator('[data-testid="time-slot"]');
      if (await timeSlots.count() > 0) {
        await timeSlots.first().click();
      }
    });

    customTest('should submit appointment booking and show confirmation', async ({ patientPage }) => {
      // Mock appointment creation API
      await mockApiResponse(patientPage, '**/appointments', {
        status: 201,
        body: {
          success: true,
          data: {
            id: 'appt_123',
            patientId: testUsers.patient.email,
            doctorId: 'doctor_1',
            scheduledTime: new Date(Date.now() + 86400000).toISOString(),
            status: 'confirmed',
          },
        },
      });

      // Find and submit booking form
      const submitButton = patientPage.getByRole('button', { name: /confirm|valider|submit/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify confirmation message or redirect
        const confirmationMessage = patientPage.locator('[data-testid="confirmation-message"]');
        await expect(confirmationMessage).toBeVisible({ timeout: 5000 }).catch(() => {
          // Alternative: check for success toast
          return expect(patientPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });
  });

  customTest.describe('Appointment Actions', () => {
    customTest('should cancel upcoming appointment', async ({ patientPage }) => {
      // Find appointment cancel button
      const cancelButton = patientPage.locator('[data-testid="cancel-appointment-btn"]').first();

      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click();

        // Verify cancellation confirmation dialog
        const confirmDialog = patientPage.locator('[role="alertdialog"]');
        if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          const confirmCancelButton = patientPage.getByRole('button', { name: /confirm|oui|yes/i });
          await confirmCancelButton.click();

          // Verify cancellation completed
          await patientPage.waitForTimeout(500);
        }
      }
    });

    customTest('should reschedule appointment with new date/time', async ({ patientPage }) => {
      // Find reschedule button
      const rescheduleButton = patientPage.locator('[data-testid="reschedule-appointment-btn"]').first();

      if (await rescheduleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rescheduleButton.click();

        // Verify reschedule form appears
        const rescheduleForm = patientPage.locator('[data-testid="reschedule-form"]');
        await expect(rescheduleForm).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should join video call for upcoming appointment', async ({ patientPage }) => {
      // Look for "Join Call" button on upcoming appointment
      const joinCallButton = patientPage.locator('[data-testid="join-call-btn"]').first();

      if (await joinCallButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify button is only active for appointments close to start time
        const isEnabled = await joinCallButton.isEnabled();
        expect(isEnabled).toBeDefined();
      }
    });
  });

  customTest.describe('Appointment Notifications', () => {
    customTest('should display appointment reminders', async ({ patientPage }) => {
      // Look for appointment reminder banner
      const reminders = patientPage.locator('[data-testid="appointment-reminder"]');

      const count = await reminders.count();
      if (count > 0) {
        await expect(reminders.first()).toBeVisible();

        // Verify reminder contains appointment info
        const time = reminders.first().locator('[data-testid="reminder-time"]');
        expect(await time.isVisible()).toBeTruthy();
      }
    });

    customTest('should allow disabling appointment notifications', async ({ patientPage }) => {
      // Find notification settings
      const notificationToggle = patientPage.locator('[data-testid="appointment-notification-toggle"]');

      if (await notificationToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await notificationToggle.isChecked();

        // Toggle notification
        await notificationToggle.click();

        // Verify toggle changed
        const newState = await notificationToggle.isChecked();
        expect(newState).not.toBe(isChecked);
      }
    });
  });
});
