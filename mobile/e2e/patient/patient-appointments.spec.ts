/**
 * Patient Appointment Booking E2E Tests
 *
 * Tests appointment functionality for patients:
 * - Browse available slots
 * - Book pharmacy visit
 * - Reschedule appointment
 * - Cancel appointment
 * - View appointment history
 * - Receive reminders
 */

describe('Patient Appointment Booking', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsPatient();
  });

  beforeEach(async () => {
    await element(by.id('appointments-tab')).tap();
    await expect(element(by.id('appointments-screen'))).toBeVisible();
  });

  describe('Browse Available Slots', () => {
    it('should display calendar view', async () => {
      await expect(element(by.id('calendar-view'))).toBeVisible();
      await expect(element(by.id('current-month'))).toBeVisible();
    });

    it('should view available slots for selected date', async () => {
      await element(by.id('calendar-day-tomorrow')).tap();
      await expect(element(by.id('time-slots-list'))).toBeVisible();
      await expect(element(by.id('slot-09:00'))).toBeVisible();
      await expect(element(by.id('slot-10:00'))).toBeVisible();
    });

    it('should show unavailable slots as disabled', async () => {
      await element(by.id('calendar-day-tomorrow')).tap();
      await expect(element(by.id('slot-booked-14:00'))).not.toBeEnabled();
      await expect(element(by.id('slot-booked-14:00'))).toHaveClass('unavailable');
    });

    it('should navigate between months', async () => {
      await element(by.id('calendar-next-month')).tap();
      await expect(element(by.id('current-month'))).toContain('December');
    });
  });

  describe('Book Pharmacy Visit', () => {
    it('should select pharmacy', async () => {
      await element(by.id('select-pharmacy-button')).tap();
      await expect(element(by.id('pharmacy-selection-modal'))).toBeVisible();
      await element(by.id('pharmacy-0')).tap();
      await expect(element(by.id('selected-pharmacy'))).toHaveText('Central Pharmacy');
    });

    it('should select appointment type', async () => {
      await selectPharmacy();
      await element(by.id('appointment-type-picker')).tap();
      await expect(element(by.id('type-consultation'))).toBeVisible();
      await expect(element(by.id('type-vaccination'))).toBeVisible();
      await expect(element(by.id('type-blood-pressure'))).toBeVisible();
      await element(by.id('type-consultation')).tap();
    });

    it('should select time slot', async () => {
      await selectPharmacy();
      await element(by.id('calendar-day-tomorrow')).tap();
      await element(by.id('slot-10:00')).tap();
      await expect(element(by.id('selected-slot'))).toHaveText('Tomorrow at 10:00');
    });

    it('should add appointment notes', async () => {
      await selectPharmacy();
      await element(by.id('calendar-day-tomorrow')).tap();
      await element(by.id('slot-10:00')).tap();
      await element(by.id('appointment-notes-input')).typeText('Need flu vaccination');
      await expect(element(by.id('appointment-notes-input'))).toHaveText('Need flu vaccination');
    });

    it('should confirm appointment booking', async () => {
      await selectPharmacy();
      await element(by.id('calendar-day-tomorrow')).tap();
      await element(by.id('slot-10:00')).tap();
      await element(by.id('confirm-booking-button')).tap();

      await expect(element(by.id('booking-confirmation-screen'))).toBeVisible();
      await expect(element(by.id('confirmation-number'))).toBeVisible();
      await expect(element(by.id('appointment-details'))).toBeVisible();
    });

    it('should receive booking confirmation', async () => {
      await bookAppointment();

      await expect(element(by.id('confirmation-message'))).toHaveText('Appointment booked successfully');
      await expect(element(by.id('confirmation-email-sent'))).toBeVisible();
    });
  });

  describe('Reschedule Appointment', () => {
    beforeEach(async () => {
      await bookAppointment();
      await element(by.id('back-to-appointments')).tap();
    });

    it('should view upcoming appointment', async () => {
      await expect(element(by.id('upcoming-appointments-section'))).toBeVisible();
      await expect(element(by.id('appointment-0'))).toBeVisible();
      await expect(element(by.id('appointment-0-date'))).toBeVisible();
    });

    it('should open reschedule dialog', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('reschedule-button')).tap();
      await expect(element(by.id('reschedule-modal'))).toBeVisible();
    });

    it('should select new time slot', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('reschedule-button')).tap();
      await element(by.id('calendar-day-next-week')).tap();
      await element(by.id('slot-15:00')).tap();
      await element(by.id('confirm-reschedule-button')).tap();

      await expect(element(by.id('reschedule-success'))).toBeVisible();
      await expect(element(by.id('appointment-0-date'))).toContain('next week at 15:00');
    });

    it('should add reason for rescheduling', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('reschedule-button')).tap();
      await element(by.id('reschedule-reason-input')).typeText('Schedule conflict');
      await element(by.id('calendar-day-next-week')).tap();
      await element(by.id('slot-11:00')).tap();
      await element(by.id('confirm-reschedule-button')).tap();

      await expect(element(by.id('reschedule-success'))).toBeVisible();
    });
  });

  describe('Cancel Appointment', () => {
    beforeEach(async () => {
      await bookAppointment();
      await element(by.id('back-to-appointments')).tap();
    });

    it('should open cancellation dialog', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('cancel-button')).tap();
      await expect(element(by.id('cancel-confirmation-dialog'))).toBeVisible();
    });

    it('should confirm cancellation', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('cancel-button')).tap();
      await element(by.id('confirm-cancel-button')).tap();

      await expect(element(by.id('cancellation-success'))).toBeVisible();
      await expect(element(by.id('appointment-0'))).not.toBeVisible();
    });

    it('should show cancellation policy', async () => {
      await element(by.id('appointment-0')).tap();
      await element(by.id('cancel-button')).tap();
      await expect(element(by.id('cancellation-policy-text'))).toBeVisible();
      await expect(element(by.id('cancellation-policy-text'))).toContain('24 hours');
    });
  });

  describe('View Appointment History', () => {
    it('should display past appointments', async () => {
      await element(by.id('history-tab')).tap();
      await expect(element(by.id('appointment-history-list'))).toBeVisible();
      await expect(element(by.id('history-item-0'))).toBeVisible();
    });

    it('should view appointment details', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();

      await expect(element(by.id('appointment-detail-modal'))).toBeVisible();
      await expect(element(by.id('detail-pharmacy'))).toBeVisible();
      await expect(element(by.id('detail-date'))).toBeVisible();
      await expect(element(by.id('detail-type'))).toBeVisible();
    });

    it('should filter history by date range', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('filter-history-button')).tap();
      await element(by.id('filter-last-3-months')).tap();
      await element(by.id('apply-filter')).tap();

      await expect(element(by.id('active-filter-badge'))).toHaveText('Last 3 months');
    });

    it('should rebook from history', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();
      await element(by.id('rebook-button')).tap();

      await expect(element(by.id('appointments-screen'))).toBeVisible();
      await expect(element(by.id('selected-pharmacy'))).toBeVisible();
    });
  });

  describe('Receive Reminders', () => {
    beforeEach(async () => {
      await bookAppointment();
    });

    it('should set reminder preferences', async () => {
      await element(by.id('back-to-appointments')).tap();
      await element(by.id('appointment-0')).tap();
      await element(by.id('reminder-settings-button')).tap();

      await expect(element(by.id('reminder-1-day')).atIndex(0)).toBeVisible();
      await expect(element(by.id('reminder-1-hour')).atIndex(0)).toBeVisible();
    });

    it('should enable appointment reminders', async () => {
      await element(by.id('back-to-appointments')).tap();
      await element(by.id('appointment-0')).tap();
      await element(by.id('reminder-settings-button')).tap();
      await element(by.id('reminder-1-day')).tap();
      await element(by.id('reminder-1-hour')).tap();
      await element(by.id('save-reminders-button')).tap();

      await expect(element(by.id('reminders-saved-success'))).toBeVisible();
    });

    it('should receive push notification reminder', async () => {
      // Simulate time passing and reminder notification
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check notification appears (would be actual push in production)
      await device.launchApp({ newInstance: false });

      await expect(element(by.id('notification-banner'))).toBeVisible();
      await expect(element(by.id('notification-banner-text'))).toContain('appointment in 1 hour');
    });
  });

  describe('Check-in for Appointment', () => {
    beforeEach(async () => {
      await bookAppointment();
      await waitForAppointmentTime();
    });

    it('should display check-in button', async () => {
      await element(by.id('back-to-appointments')).tap();
      await expect(element(by.id('appointment-0-checkin-button'))).toBeVisible();
    });

    it('should check in for appointment', async () => {
      await element(by.id('back-to-appointments')).tap();
      await element(by.id('appointment-0-checkin-button')).tap();

      await expect(element(by.id('checkin-success'))).toBeVisible();
      await expect(element(by.id('appointment-0-status'))).toHaveText('Checked in');
    });

    it('should show QR code for check-in', async () => {
      await element(by.id('back-to-appointments')).tap();
      await element(by.id('appointment-0')).tap();
      await element(by.id('show-qr-code-button')).tap();

      await expect(element(by.id('qr-code-modal'))).toBeVisible();
      await expect(element(by.id('qr-code-image'))).toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function loginAsPatient() {
  await element(by.id('login-button')).tap();
  await element(by.id('login-email-input')).typeText('patient@example.com');
  await element(by.id('login-password-input')).typeText('ValidPassword123!');
  await element(by.id('login-submit-button')).tap();
  await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
}

async function selectPharmacy() {
  await element(by.id('select-pharmacy-button')).tap();
  await element(by.id('pharmacy-0')).tap();
}

async function bookAppointment() {
  await selectPharmacy();
  await element(by.id('calendar-day-tomorrow')).tap();
  await element(by.id('slot-10:00')).tap();
  await element(by.id('confirm-booking-button')).tap();
  await waitFor(element(by.id('booking-confirmation-screen'))).toBeVisible().withTimeout(5000);
}

async function waitForAppointmentTime() {
  // Mock time progression to appointment time
  await new Promise(resolve => setTimeout(resolve, 1000));
}
