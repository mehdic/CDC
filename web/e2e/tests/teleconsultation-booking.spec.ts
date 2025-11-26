import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-001: Patient Teleconsultation Booking Workflow
 *
 * Tests the complete booking workflow including:
 * - Browsing available pharmacist slots
 * - Booking appointments with date/time selection
 * - Confirmation emails and notifications
 * - Reminder notifications before appointments
 * - Rescheduling and cancellation workflows
 */

test.describe('E2E-001: Patient Teleconsultation Booking', () => {
  test.beforeEach(async ({ page }) => {
    // Mock available pharmacist slots
    await mockApiResponse(page, '**/teleconsultation/slots**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'slot_001',
            pharmacistId: 'pharm_001',
            pharmacistName: 'Dr. Claire Martin',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            startTime: '09:00',
            endTime: '09:30',
            available: true,
          },
          {
            id: 'slot_002',
            pharmacistId: 'pharm_001',
            pharmacistName: 'Dr. Claire Martin',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '10:30',
            available: true,
          },
          {
            id: 'slot_003',
            pharmacistId: 'pharm_002',
            pharmacistName: 'Dr. Marc Dubois',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '14:30',
            available: false, // Booked
          },
          {
            id: 'slot_004',
            pharmacistId: 'pharm_001',
            pharmacistName: 'Dr. Claire Martin',
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
            startTime: '11:00',
            endTime: '11:30',
            available: true,
          },
        ],
        total: 4,
      },
    });

    // Mock booking creation
    await mockApiResponse(page, '**/teleconsultation/book', {
      status: 201,
      body: {
        success: true,
        consultationId: 'consult_new_001',
        confirmationSent: true,
        reminderScheduled: true,
      },
    });
  });

  /**
   * Test: Browse available pharmacist slots
   */
  test('should display available pharmacist slots for booking', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Navigate to booking section
    await consultationPage.bookButton.click();

    // Verify available slots are displayed
    await expect(patientPage.locator('[data-testid="slot-slot_001"]')).toBeVisible();
    await expect(patientPage.getByText('Dr. Claire Martin')).toBeVisible();
    await expect(patientPage.getByText('09:00')).toBeVisible();

    // Verify unavailable slots are marked as booked
    await expect(patientPage.locator('[data-testid="slot-slot_003"]')).toHaveAttribute('data-available', 'false');
  });

  /**
   * Test: Filter slots by date
   */
  test('should filter available slots by date', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.bookButton.click();

    // Select tomorrow's date
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await patientPage.getByLabel(/date|jour/i).fill(tomorrow);

    // Verify filtered slots
    await expect(patientPage.locator('[data-testid="slot-slot_001"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="slot-slot_002"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="slot-slot_004"]')).not.toBeVisible(); // Different date
  });

  /**
   * Test: Filter slots by pharmacist
   */
  test('should filter available slots by pharmacist', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.bookButton.click();

    // Select specific pharmacist
    await patientPage.getByLabel(/pharmacien|pharmacist/i).selectOption('pharm_001');

    // Verify only selected pharmacist's slots shown
    await expect(patientPage.getByText('Dr. Claire Martin')).toBeVisible();
    await expect(patientPage.getByText('Dr. Marc Dubois')).not.toBeVisible();
  });

  /**
   * Test: Book teleconsultation appointment
   */
  test('should book teleconsultation appointment successfully', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.bookButton.click();

    // Select available slot
    await patientPage.locator('[data-testid="slot-slot_001"]').click();

    // Add reason for consultation (optional)
    await patientPage.getByLabel(/raison|reason/i).fill('Renouvellement ordonnance pour hypertension');

    // Confirm booking
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify booking confirmation
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toContainText(/réservé|booked/i);
  });

  /**
   * Test: Receive confirmation email/notification
   */
  test('should send confirmation email after booking', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.bookButton.click();

    // Book appointment
    await patientPage.locator('[data-testid="slot-slot_001"]').click();
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify confirmation notification displayed
    await expect(patientPage.locator('[data-testid="confirmation-sent"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="confirmation-sent"]')).toContainText(/confirmation.*envoyée|confirmation.*sent/i);

    // Verify confirmation details shown
    await expect(patientPage.getByText(/demain|tomorrow/i)).toBeVisible();
    await expect(patientPage.getByText('09:00')).toBeVisible();
    await expect(patientPage.getByText('Dr. Claire Martin')).toBeVisible();
  });

  /**
   * Test: Schedule reminder notifications
   */
  test('should schedule reminder notification before appointment', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/teleconsultation/*/reminders', {
      status: 200,
      body: {
        success: true,
        reminders: [
          {
            type: 'email',
            scheduledFor: new Date(Date.now() + 82800000).toISOString(), // 23 hours from now
          },
          {
            type: 'push',
            scheduledFor: new Date(Date.now() + 84600000).toISOString(), // 23.5 hours from now
          },
        ],
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // View booked consultation details
    await patientPage.locator('[data-testid="consultation-consult_new_001"]').click();

    // Verify reminders are scheduled
    await expect(patientPage.locator('[data-testid="reminder-scheduled"]')).toBeVisible();
    await expect(patientPage.getByText(/rappel.*1 heure|reminder.*1 hour/i)).toBeVisible();
  });

  /**
   * Test: Reschedule appointment
   */
  test('should reschedule teleconsultation appointment', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/teleconsultation/consult_new_001/reschedule', {
      status: 200,
      body: {
        success: true,
        consultationId: 'consult_new_001',
        newSlot: 'slot_002',
        notificationSent: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Open existing consultation
    await patientPage.locator('[data-testid="consultation-consult_new_001"]').click();

    // Click reschedule button
    await patientPage.getByRole('button', { name: /reprogrammer|reschedule/i }).click();

    // Select new slot
    await patientPage.locator('[data-testid="slot-slot_002"]').click();

    // Confirm reschedule
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify reschedule confirmation
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toContainText(/reprogrammé|rescheduled/i);
  });

  /**
   * Test: Reschedule notification sent to pharmacist
   */
  test('should notify pharmacist when patient reschedules', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/teleconsultation/consult_new_001/reschedule', {
      status: 200,
      body: {
        success: true,
        consultationId: 'consult_new_001',
        pharmacistNotified: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Reschedule appointment
    await patientPage.locator('[data-testid="consultation-consult_new_001"]').click();
    await patientPage.getByRole('button', { name: /reprogrammer|reschedule/i }).click();
    await patientPage.locator('[data-testid="slot-slot_002"]').click();
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify pharmacist notification confirmed
    await expect(patientPage.locator('[data-testid="pharmacist-notified"]')).toBeVisible();
  });

  /**
   * Test: Cancel appointment with reason
   */
  test('should cancel teleconsultation appointment with reason', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/teleconsultation/consult_new_001/cancel', {
      status: 200,
      body: {
        success: true,
        consultationId: 'consult_new_001',
        status: 'cancelled',
        refundProcessed: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Open consultation details
    await patientPage.locator('[data-testid="consultation-consult_new_001"]').click();

    // Click cancel button
    await patientPage.getByRole('button', { name: /annuler|cancel/i }).click();

    // Provide cancellation reason
    await patientPage.getByLabel(/raison|reason/i).selectOption('schedule_conflict');
    await patientPage.getByLabel(/commentaire|comment/i).fill('Conflit avec rendez-vous médical urgent');

    // Confirm cancellation
    await patientPage.getByRole('button', { name: /confirmer annulation|confirm cancellation/i }).click();

    // Verify cancellation confirmation
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toContainText(/annulé|cancelled/i);
  });

  /**
   * Test: Cancellation policy enforcement
   */
  test('should enforce cancellation policy (24 hours notice)', async ({ patientPage }) => {
    // Mock consultation scheduled in 12 hours (less than 24 hours notice)
    await mockApiResponse(patientPage, '**/teleconsultation/consult_soon/cancel', {
      status: 400,
      body: {
        success: false,
        error: 'Cancellation must be at least 24 hours in advance',
        penaltyApplied: false,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Try to cancel consultation scheduled soon
    await patientPage.locator('[data-testid="consultation-consult_soon"]').click();
    await patientPage.getByRole('button', { name: /annuler|cancel/i }).click();
    await patientPage.getByLabel(/raison|reason/i).selectOption('schedule_conflict');
    await patientPage.getByRole('button', { name: /confirmer annulation|confirm cancellation/i }).click();

    // Verify cancellation policy warning
    await expect(patientPage.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="error-toast"]')).toContainText(/24 heures|24 hours/i);
  });

  /**
   * Test: View booking history
   */
  test('should display booking history for patient', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/teleconsultation/history**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'consult_past_001',
            pharmacistName: 'Dr. Sophie Bernard',
            date: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
            status: 'completed',
            notes: 'Ordonnance renouvelée',
          },
          {
            id: 'consult_past_002',
            pharmacistName: 'Dr. Claire Martin',
            date: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
            status: 'cancelled',
            cancellationReason: 'Patient unavailable',
          },
        ],
        total: 2,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // View past consultations
    await consultationPage.viewPastConsultations();

    // Verify past consultations displayed
    await expect(patientPage.locator('[data-testid="consultation-consult_past_001"]')).toBeVisible();
    await expect(patientPage.getByText('Dr. Sophie Bernard')).toBeVisible();
    await expect(patientPage.getByText(/complété|completed/i)).toBeVisible();

    // Verify cancelled consultation shown
    await expect(patientPage.locator('[data-testid="consultation-consult_past_002"]')).toBeVisible();
    await expect(patientPage.getByText(/annulé|cancelled/i)).toBeVisible();
  });

  /**
   * Test: Waiting room functionality
   */
  test('should display waiting room before scheduled time', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Try to join consultation 10 minutes early
    await patientPage.locator('[data-testid="consultation-consult_new_001"]').click();
    await consultationPage.joinButton.click();

    // Verify waiting room is shown
    await expect(patientPage.locator('[data-testid="waiting-room"]')).toBeVisible();
    await expect(patientPage.getByText(/salle d'attente|waiting room/i)).toBeVisible();
    await expect(patientPage.getByText(/commence dans|starts in/i)).toBeVisible();
  });

  /**
   * Test: Consultation becomes available at scheduled time
   */
  test('should allow joining consultation at scheduled time', async ({ patientPage }) => {
    // Mock consultation starting now
    await mockApiResponse(patientPage, '**/consultations/*/join', {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token',
        roomName: 'consult_now_room',
        canJoin: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Join consultation at scheduled time
    await patientPage.locator('[data-testid="consultation-consult_now"]').click();
    await consultationPage.joinButton.click();

    // Verify video room opens
    await expect(consultationPage.videoContainer).toBeVisible();
  });

  /**
   * Test: Late join warning
   */
  test('should show warning when joining consultation late', async ({ patientPage }) => {
    // Mock consultation that started 10 minutes ago
    await mockApiResponse(patientPage, '**/consultations/*/join', {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token',
        roomName: 'consult_late_room',
        minutesLate: 10,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Join consultation late
    await patientPage.locator('[data-testid="consultation-consult_late"]').click();
    await consultationPage.joinButton.click();

    // Verify late join warning
    await expect(patientPage.locator('[data-testid="late-join-warning"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="late-join-warning"]')).toContainText(/10 minutes/i);
  });
});
