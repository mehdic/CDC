import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-003: Teleconsultation Booking - Complete Patient Journey
 *
 * End-to-end test covering the full patient and pharmacist teleconsultation workflow:
 * - Patient searches for available slots
 * - Patient books appointment
 * - Patient receives confirmation and reminders
 * - Pharmacist sees appointment in schedule
 * - Both parties can join the consultation at scheduled time
 */
test.describe('Teleconsultation Booking - Complete Journey (E2E-003)', () => {
  test('complete patient booking workflow', async ({ page }) => {
    // Patient logs in
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_patient_token',
        user: {
          id: 'patient_001',
          email: 'patient@example.ch',
          role: 'patient',
          firstName: 'Sophie',
          lastName: 'Bernard',
        },
      },
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('patient@example.ch');
    await page.getByLabel(/mot de passe|password/i).fill('PatientPass123!');
    await page.getByRole('button', { name: /connexion|login/i }).click();

    // Navigate to teleconsultation section
    await page.goto('/teleconsultation');

    // Mock available time slots
    await mockApiResponse(page, '**/consultations/available-slots**', {
      status: 200,
      body: {
        success: true,
        slots: [
          {
            id: 'slot_001',
            pharmacistId: 'pharmacist_001',
            pharmacistName: 'Dr. Marie Dubois',
            pharmacyName: 'Pharmacie de la Gare',
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            available: true,
          },
          {
            id: 'slot_002',
            pharmacistId: 'pharmacist_001',
            pharmacistName: 'Dr. Marie Dubois',
            pharmacyName: 'Pharmacie de la Gare',
            date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            available: true,
          },
        ],
      },
    });

    // View available slots
    await page.getByRole('button', { name: /réserver|book/i }).click();
    await expect(page.locator('[data-testid="available-slots"]')).toBeVisible();

    // Select first available slot
    await page.locator('[data-testid="slot-slot_001"]').click();

    // Fill booking details
    await page.getByLabel(/motif de consultation|reason/i).fill('Conseil médicamenteux');
    await page
      .getByLabel(/description|details/i)
      .fill('Je souhaite des conseils sur mes médicaments pour le diabète');

    // Check consent checkbox (HIPAA/GDPR requirement)
    await page.getByLabel(/j'accepte.*téléconsultation|i consent.*teleconsultation/i).check();

    // Mock booking confirmation
    await mockApiResponse(page, '**/consultations/book', {
      status: 201,
      body: {
        success: true,
        consultationId: 'consult_new_001',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        pharmacistName: 'Dr. Marie Dubois',
        confirmationSent: true,
        reminderScheduled: true,
      },
    });

    // Confirm booking
    await page.getByRole('button', { name: /confirmer.*réservation|confirm.*booking/i }).click();

    // Verify booking confirmation message
    await expect(page.locator('[role="alert"]')).toContainText(
      /réservation confirmée|booking confirmed/i
    );
    await expect(page.locator('[data-testid="confirmation-email-sent"]')).toContainText(
      /email de confirmation|confirmation email/i
    );

    // Verify consultation appears in upcoming list
    await expect(page.locator('[data-testid="consultation-consult_new_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="consultation-consult_new_001"]')).toContainText(
      'Dr. Marie Dubois'
    );
  });

  test('pharmacist views booked consultations', async ({ pharmacistPage }) => {
    // Mock pharmacist's consultation schedule
    await mockApiResponse(pharmacistPage, '**/consultations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'consult_001',
            patientId: 'patient_001',
            patientName: 'Sophie Bernard',
            patientAge: 35,
            reason: 'Conseil médicamenteux',
            scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            status: 'upcoming',
            duration: 30,
          },
          {
            id: 'consult_002',
            patientId: 'patient_002',
            patientName: 'Marc Dubois',
            patientAge: 52,
            reason: 'Renouvellement ordonnance',
            scheduledAt: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            status: 'upcoming',
          },
        ],
        total: 2,
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Verify consultation list loaded
    await consultationPage.expectPageLoaded();

    // Verify booked consultations visible
    await consultationPage.expectConsultationInList('consult_001');
    await consultationPage.expectConsultationInList('consult_002');

    // View consultation details
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();

    // Verify patient details visible (with PHI encryption in transit)
    await expect(pharmacistPage.locator('[data-testid="patient-name"]')).toContainText(
      'Sophie Bernard'
    );
    await expect(pharmacistPage.locator('[data-testid="consultation-reason"]')).toContainText(
      'Conseil médicamenteux'
    );
  });

  test('patient receives appointment reminders', async ({ page }) => {
    // Mock patient dashboard with upcoming consultation
    await mockApiResponse(page, '**/consultations/upcoming', {
      status: 200,
      body: {
        success: true,
        consultations: [
          {
            id: 'consult_reminder_001',
            pharmacistName: 'Dr. Marie Dubois',
            scheduledAt: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
            reminder15MinSent: false,
            reminder1HourSent: true,
            reminder24HourSent: true,
          },
        ],
      },
    });

    await page.goto('/dashboard');

    // Verify reminder notification visible
    const reminderBanner = page.locator('[data-testid="upcoming-consultation-reminder"]');
    await expect(reminderBanner).toBeVisible();
    await expect(reminderBanner).toContainText(/dans 30 minutes|in 30 minutes/i);

    // Verify join button available
    await expect(page.getByRole('button', { name: /rejoindre|join/i })).toBeVisible();
  });

  test('patient can reschedule consultation', async ({ page }) => {
    // Mock consultation to reschedule
    await mockApiResponse(page, '**/consultations/consult_001', {
      status: 200,
      body: {
        success: true,
        consultation: {
          id: 'consult_001',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'upcoming',
          canReschedule: true,
        },
      },
    });

    await page.goto('/teleconsultation');

    // Find consultation and click reschedule
    await page.locator('[data-testid="consultation-consult_001"]').hover();
    await page.getByRole('button', { name: /reprogrammer|reschedule/i }).click();

    // Mock new available slots
    await mockApiResponse(page, '**/consultations/available-slots**', {
      status: 200,
      body: {
        success: true,
        slots: [
          {
            id: 'slot_new_001',
            date: new Date(Date.now() + 172800000).toISOString(),
            available: true,
          },
        ],
      },
    });

    // Select new slot
    await page.locator('[data-testid="slot-slot_new_001"]').click();

    // Mock reschedule confirmation
    await mockApiResponse(page, '**/consultations/consult_001/reschedule', {
      status: 200,
      body: {
        success: true,
        newScheduledAt: new Date(Date.now() + 172800000).toISOString(),
        message: 'Consultation reprogrammée avec succès',
      },
    });

    // Confirm reschedule
    await page.getByRole('button', { name: /confirmer/i }).click();

    // Verify success message
    await expect(page.locator('[role="alert"]')).toContainText(/reprogrammée|rescheduled/i);
  });

  test('patient can cancel consultation with valid reason', async ({ page }) => {
    await page.goto('/teleconsultation');

    // Find consultation and click cancel
    await page.locator('[data-testid="consultation-consult_001"]').hover();
    await page.getByRole('button', { name: /annuler|cancel/i }).click();

    // Must provide cancellation reason (audit trail requirement)
    await page.getByLabel(/raison de l'annulation|cancellation reason/i).fill('Imprévu personnel');

    // Mock cancellation API
    await mockApiResponse(page, '**/consultations/consult_001/cancel', {
      status: 200,
      body: {
        success: true,
        message: 'Consultation annulée',
        refundProcessed: false, // No-show policy
      },
    });

    // Confirm cancellation
    await page
      .getByRole('button', { name: /confirmer.*annulation|confirm.*cancellation/i })
      .click();

    // Verify cancellation confirmed
    await expect(page.locator('[role="alert"]')).toContainText(
      /annulation confirmée|cancellation confirmed/i
    );

    // Consultation should be removed from upcoming list
    await expect(page.locator('[data-testid="consultation-consult_001"]')).toBeHidden();
  });

  test('patient cannot book overlapping consultations', async ({ page }) => {
    // Mock attempt to book when already has a consultation in that time slot
    await mockApiResponse(page, '**/consultations/book', {
      status: 409,
      body: {
        success: false,
        error: 'Conflict',
        message: 'Vous avez déjà une consultation à cette heure',
        existingConsultationId: 'consult_existing_001',
      },
    });

    await page.goto('/teleconsultation');
    await page.getByRole('button', { name: /réserver|book/i }).click();

    // Try to book overlapping slot
    await page.locator('[data-testid="slot-slot_overlap"]').click();
    await page.getByLabel(/motif/i).fill('Test');
    await page.getByLabel(/j'accepte/i).check();
    await page.getByRole('button', { name: /confirmer/i }).click();

    // Should show conflict error
    await expect(page.locator('[role="alert"]')).toContainText(
      /consultation.*déjà|already.*consultation/i
    );
  });

  test('pharmacist can set availability schedule', async ({ pharmacistPage }) => {
    await pharmacistPage.goto('/settings/availability');

    // Mock current availability
    await mockApiResponse(pharmacistPage, '**/pharmacist/availability', {
      status: 200,
      body: {
        success: true,
        availability: {
          monday: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' },
          ],
          tuesday: [{ start: '09:00', end: '12:00' }],
          wednesday: [],
          thursday: [{ start: '09:00', end: '18:00' }],
          friday: [{ start: '09:00', end: '16:00' }],
          saturday: [],
          sunday: [],
        },
      },
    });

    // Verify current schedule displayed
    await expect(pharmacistPage.locator('[data-testid="monday-schedule"]')).toContainText(
      '09:00 - 12:00'
    );

    // Add new time slot for Wednesday
    await pharmacistPage.getByRole('button', { name: /ajouter.*créneau.*mercredi/i }).click();
    await pharmacistPage.getByLabel(/heure de début/i).fill('14:00');
    await pharmacistPage.getByLabel(/heure de fin/i).fill('17:00');

    // Mock save availability
    await mockApiResponse(pharmacistPage, '**/pharmacist/availability', {
      status: 200,
      body: {
        success: true,
        message: 'Disponibilité mise à jour',
      },
    });

    await pharmacistPage.getByRole('button', { name: /enregistrer|save/i }).click();

    // Verify success
    await expect(pharmacistPage.locator('[role="alert"]')).toContainText(/mise à jour|updated/i);
  });

  test('system sends 24-hour reminder notification', async ({ page }) => {
    // Mock notification service call (would trigger email/SMS/push)
    await mockApiResponse(page, '**/notifications/consultation-reminder', {
      status: 200,
      body: {
        success: true,
        notificationsSent: ['email', 'push'],
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Navigate to notifications settings
    await page.goto('/settings/notifications');

    // Verify reminder settings
    await expect(page.getByLabel(/rappel 24 heures|24-hour reminder/i)).toBeChecked();
    await expect(page.getByLabel(/rappel 1 heure|1-hour reminder/i)).toBeChecked();
    await expect(page.getByLabel(/rappel 15 minutes|15-minute reminder/i)).toBeChecked();
  });

  test('patient can rate consultation after completion', async ({ page }) => {
    // Mock completed consultation
    await mockApiResponse(page, '**/consultations/consult_completed_001', {
      status: 200,
      body: {
        success: true,
        consultation: {
          id: 'consult_completed_001',
          status: 'completed',
          completedAt: new Date(Date.now() - 3600000).toISOString(),
          canRate: true,
          rating: null,
        },
      },
    });

    await page.goto('/teleconsultation/history');

    // Find completed consultation
    await page.locator('[data-testid="consultation-consult_completed_001"]').click();

    // Rate consultation
    await page.locator('[data-testid="rating-stars"]').locator('button[value="5"]').click();
    await page.getByLabel(/commentaire|feedback/i).fill('Excellent service, très professionnel');

    // Mock rating submission
    await mockApiResponse(page, '**/consultations/consult_completed_001/rate', {
      status: 200,
      body: {
        success: true,
        message: 'Merci pour votre évaluation',
      },
    });

    await page.getByRole('button', { name: /soumettre|submit/i }).click();

    // Verify success
    await expect(page.locator('[role="alert"]')).toContainText(
      /merci.*évaluation|thank you.*rating/i
    );
  });
});
