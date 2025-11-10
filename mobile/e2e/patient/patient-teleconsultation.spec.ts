/**
 * Patient Teleconsultation Booking E2E Tests
 *
 * Tests teleconsultation functionality for patients:
 * - Browse available pharmacists
 * - Book teleconsultation appointment
 * - Join video call
 * - Rate consultation
 * - View consultation history
 */

describe('Patient Teleconsultation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsPatient();
  });

  beforeEach(async () => {
    await element(by.id('teleconsultation-tab')).tap();
    await expect(element(by.id('teleconsultation-screen'))).toBeVisible();
  });

  describe('Browse Available Pharmacists', () => {
    it('should display list of available pharmacists', async () => {
      await expect(element(by.id('pharmacists-list'))).toBeVisible();
      await expect(element(by.id('pharmacist-0'))).toBeVisible();
      await expect(element(by.id('pharmacist-0-name'))).toBeVisible();
      await expect(element(by.id('pharmacist-0-rating'))).toBeVisible();
    });

    it('should filter pharmacists by availability', async () => {
      await element(by.id('filter-button')).tap();
      await element(by.id('filter-available-now')).tap();
      await element(by.id('apply-filter-button')).tap();

      await expect(element(by.id('pharmacist-0-availability'))).toHaveText('Available now');
    });

    it('should view pharmacist profile', async () => {
      await element(by.id('pharmacist-0')).tap();
      await expect(element(by.id('pharmacist-profile-modal'))).toBeVisible();
      await expect(element(by.id('pharmacist-bio'))).toBeVisible();
      await expect(element(by.id('pharmacist-specialties'))).toBeVisible();
      await expect(element(by.id('pharmacist-reviews'))).toBeVisible();
    });

    it('should search pharmacists by name or specialty', async () => {
      await element(by.id('search-input')).typeText('pediatric');
      await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('search-result-0-specialty'))).toContain('Pediatric');
    });
  });

  describe('Book Teleconsultation Appointment', () => {
    it('should open booking form', async () => {
      await element(by.id('pharmacist-0')).tap();
      await element(by.id('book-consultation-button')).tap();
      await expect(element(by.id('booking-form-screen'))).toBeVisible();
    });

    it('should select appointment date and time', async () => {
      await element(by.id('pharmacist-0')).tap();
      await element(by.id('book-consultation-button')).tap();

      await element(by.id('date-picker-button')).tap();
      await element(by.id('date-tomorrow')).tap();
      await element(by.id('time-slot-14:00')).tap();

      await expect(element(by.id('selected-datetime'))).toContain('Tomorrow at 14:00');
    });

    it('should describe reason for consultation', async () => {
      await startBooking();

      await element(by.id('reason-input')).typeText('Need advice on medication side effects');
      await element(by.id('symptoms-input')).typeText('Experiencing headaches and dizziness');

      await expect(element(by.id('reason-input'))).toHaveText('Need advice on medication side effects');
    });

    it('should mark consultation as urgent', async () => {
      await startBooking();

      await element(by.id('urgent-checkbox')).tap();
      await expect(element(by.id('urgent-notice'))).toBeVisible();
      await expect(element(by.id('urgent-notice'))).toContain('will be contacted shortly');
    });

    it('should confirm and submit booking', async () => {
      await startBooking();
      await element(by.id('reason-input')).typeText('General medication consultation');
      await element(by.id('confirm-booking-button')).tap();

      await expect(element(by.id('booking-success-screen'))).toBeVisible();
      await expect(element(by.id('confirmation-number'))).toBeVisible();
      await expect(element(by.id('appointment-details'))).toBeVisible();
    });

    it('should add to calendar', async () => {
      await completeBooking();

      await element(by.id('add-to-calendar-button')).tap();
      // System calendar permission
      await waitFor(element(by.text('Add to Calendar'))).toBeVisible().withTimeout(3000);
      await element(by.text('Allow')).tap();

      await expect(element(by.id('calendar-added-success'))).toBeVisible();
    });
  });

  describe('Join Video Call', () => {
    beforeEach(async () => {
      await completeBooking();
      await waitForAppointmentTime();
    });

    it('should show join button when appointment time arrives', async () => {
      await element(by.id('upcoming-consultations-tab')).tap();
      await expect(element(by.id('consultation-0'))).toBeVisible();
      await expect(element(by.id('join-call-button-0'))).toBeVisible();
    });

    it('should join video call', async () => {
      await element(by.id('upcoming-consultations-tab')).tap();
      await element(by.id('join-call-button-0')).tap();

      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('local-video'))).toBeVisible();
      await expect(element(by.id('remote-video'))).toBeVisible();
    });

    it('should toggle video during call', async () => {
      await joinCall();

      await element(by.id('toggle-video-button')).tap();
      await expect(element(by.id('video-off-indicator'))).toBeVisible();

      await element(by.id('toggle-video-button')).tap();
      await expect(element(by.id('local-video'))).toBeVisible();
    });

    it('should use chat during call', async () => {
      await joinCall();

      await element(by.id('chat-button')).tap();
      await expect(element(by.id('chat-panel'))).toBeVisible();

      await element(by.id('chat-input')).typeText('Can you repeat the dosage?');
      await element(by.id('send-chat-button')).tap();

      await expect(element(by.id('chat-message-0'))).toHaveText('Can you repeat the dosage?');
    });

    it('should end call', async () => {
      await joinCall();

      await element(by.id('end-call-button')).tap();
      await expect(element(by.id('end-call-confirmation'))).toBeVisible();
      await element(by.id('confirm-end-button')).tap();

      await waitFor(element(by.id('call-ended-screen'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Rate Consultation', () => {
    beforeEach(async () => {
      await completeConsultation();
    });

    it('should display rating screen after consultation', async () => {
      await expect(element(by.id('rate-consultation-screen'))).toBeVisible();
      await expect(element(by.id('rating-stars'))).toBeVisible();
    });

    it('should rate consultation with stars', async () => {
      await element(by.id('star-5')).tap();
      await expect(element(by.id('selected-rating'))).toHaveText('5');
    });

    it('should add written review', async () => {
      await element(by.id('star-5')).tap();
      await element(by.id('review-input')).typeText('Excellent consultation, very helpful pharmacist');
      await element(by.id('submit-rating-button')).tap();

      await expect(element(by.id('rating-submitted-success'))).toBeVisible();
    });

    it('should skip rating', async () => {
      await element(by.id('skip-rating-button')).tap();
      await expect(element(by.id('patient-dashboard'))).toBeVisible();
    });
  });

  describe('View Consultation History', () => {
    it('should display past consultations', async () => {
      await element(by.id('history-tab')).tap();
      await expect(element(by.id('consultation-history-list'))).toBeVisible();
      await expect(element(by.id('history-item-0'))).toBeVisible();
    });

    it('should view consultation details', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();

      await expect(element(by.id('consultation-detail-modal'))).toBeVisible();
      await expect(element(by.id('consultation-date'))).toBeVisible();
      await expect(element(by.id('pharmacist-name'))).toBeVisible();
      await expect(element(by.id('consultation-notes'))).toBeVisible();
    });

    it('should download consultation report', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();
      await element(by.id('download-report-button')).tap();

      await expect(element(by.id('download-success'))).toBeVisible();
    });

    it('should book follow-up consultation', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();
      await element(by.id('book-followup-button')).tap();

      await expect(element(by.id('booking-form-screen'))).toBeVisible();
      await expect(element(by.id('followup-notice'))).toBeVisible();
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

async function startBooking() {
  await element(by.id('pharmacist-0')).tap();
  await element(by.id('book-consultation-button')).tap();
  await element(by.id('date-picker-button')).tap();
  await element(by.id('date-tomorrow')).tap();
  await element(by.id('time-slot-14:00')).tap();
}

async function completeBooking() {
  await startBooking();
  await element(by.id('reason-input')).typeText('General consultation');
  await element(by.id('confirm-booking-button')).tap();
  await waitFor(element(by.id('booking-success-screen'))).toBeVisible().withTimeout(5000);
}

async function waitForAppointmentTime() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function joinCall() {
  await element(by.id('upcoming-consultations-tab')).tap();
  await element(by.id('join-call-button-0')).tap();
  await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);
}

async function completeConsultation() {
  await joinCall();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await element(by.id('end-call-button')).tap();
  await element(by.id('confirm-end-button')).tap();
  await waitFor(element(by.id('rate-consultation-screen'))).toBeVisible().withTimeout(5000);
}
