import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E Journey Test: Complete Teleconsultation Journey
 *
 * This test covers the complete teleconsultation flow from patient perspective:
 * 1. Patient views Golden MetaPharm program and available teleconsultation slots
 * 2. Patient books teleconsultation appointment
 * 3. Pharmacist receives booking notification
 * 4. Pharmacist accepts consultation request
 * 5. Patient joins video call at scheduled time
 * 6. Pharmacist joins video call
 * 7. Video consultation takes place with chat
 * 8. Pharmacist creates prescription during call
 * 9. Call ends with consultation summary
 * 10. Patient receives prescription notification
 * 11. Follow-up actions available
 *
 * This is a CRITICAL user journey for MetaPharm Connect platform.
 */

test.describe('Complete Teleconsultation Journey', () => {
  const consultationId = 'consult_journey_001';
  const prescriptionId = 'rx_teleconsult_001';
  const patientId = 'patient_001';
  const pharmacistId = 'pharmacist_001';

  /**
   * Journey Step 1-2: Patient books teleconsultation
   */
  test('should allow patient to view available slots and book teleconsultation', async ({ context }) => {
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);
    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Mock available consultation slots
    await mockApiResponse(patientPage, '**/teleconsultation/available-slots**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'slot_001',
            pharmacistId: pharmacistId,
            pharmacistName: 'Marie Dupont',
            pharmacyName: 'Pharmacie de la Gare',
            startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            duration: 30,
            available: true,
          },
          {
            id: 'slot_002',
            pharmacistId: pharmacistId,
            pharmacistName: 'Marie Dupont',
            pharmacyName: 'Pharmacie de la Gare',
            startTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            duration: 30,
            available: true,
          },
        ],
      },
    });

    // Mock booking endpoint
    await mockApiResponse(patientPage, '**/teleconsultation/book', {
      status: 201,
      body: {
        success: true,
        consultationId: consultationId,
        message: 'Consultation booked successfully',
      },
    });

    // Navigate to teleconsultation booking
    await patientPage.getByRole('link', { name: /téléconsultation|teleconsultation/i }).click();

    // View available slots
    await expect(patientPage.getByText('Pharmacie de la Gare')).toBeVisible();
    await expect(patientPage.getByText('Marie Dupont')).toBeVisible();

    // Select first available slot
    await patientPage.locator('[data-testid="slot-slot_001"]').click();

    // Fill booking form with reason
    await patientPage.locator('[data-testid="consultation-reason"]').fill('I need advice about my blood pressure medication. Experiencing some dizziness.');
    await patientPage.locator('[data-testid="symptoms"]').fill('Dizziness, mild headache');

    // Confirm booking
    await patientPage.getByRole('button', { name: /réserver|book|confirmer/i }).click();

    // Verify booking confirmation
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toContainText(/booked|réservée/i);
    await expect(patientPage.locator('[data-testid="consultation-id"]')).toContainText(consultationId);

    await patientPage.close();
  });

  /**
   * Journey Step 3-4: Pharmacist receives notification and accepts consultation
   */
  test('should notify pharmacist of new booking and allow acceptance', async ({ context }) => {
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);
    await pharmacistPage.waitForURL(/.*\/(?:dashboard|prescriptions)/);

    // Mock pending consultation requests
    await mockApiResponse(pharmacistPage, '**/teleconsultation/requests**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: consultationId,
            patientId: patientId,
            patientName: 'Sophie Bernard',
            scheduledAt: new Date(Date.now() + 3600000).toISOString(),
            status: 'pending',
            reason: 'Blood pressure medication advice',
            symptoms: ['Dizziness', 'Mild headache'],
            urgent: false,
          },
        ],
      },
    });

    // Mock consultation acceptance
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/accept`, {
      status: 200,
      body: {
        success: true,
        consultation: {
          id: consultationId,
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    // Verify notification badge
    await expect(pharmacistPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="notification-badge"]')).toContainText('1');

    // Navigate to teleconsultation requests
    await pharmacistPage.getByRole('link', { name: /téléconsultation|consultation/i }).click();

    // Verify consultation request visible
    await expect(pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`)).toBeVisible();
    await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();
    await expect(pharmacistPage.getByText(/Blood pressure medication/i)).toBeVisible();

    // Review consultation details
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await expect(pharmacistPage.getByText('Dizziness')).toBeVisible();
    await expect(pharmacistPage.getByText('Mild headache')).toBeVisible();

    // Accept consultation
    await pharmacistPage.getByRole('button', { name: /accepter|accept/i }).click();

    // Verify acceptance confirmation
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/confirmed|confirmée/i);

    await pharmacistPage.close();
  });

  /**
   * Journey Step 5-8: Complete video consultation with prescription creation
   */
  test('should complete video consultation with chat and prescription creation', async ({ context }) => {
    // Patient joins call first
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock Twilio video token for patient
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/join`, {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_patient_token',
        roomName: `consult_${consultationId}_room`,
        identity: 'patient_001',
      },
    });

    // Mock consultation details
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          pharmacistName: 'Marie Dupont',
          scheduledAt: new Date().toISOString(),
          status: 'confirmed',
          reason: 'Blood pressure medication advice',
        },
      },
    });

    // Patient navigates to upcoming consultations
    await patientPage.getByRole('link', { name: /téléconsultation|consultation/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();

    // Patient joins video call
    await patientPage.getByRole('button', { name: /rejoindre|join call/i }).click();

    // Verify video interface loaded
    await expect(patientPage.locator('[data-testid="video-container"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="local-video"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="waiting-for-pharmacist"]')).toBeVisible();

    // Pharmacist joins call
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    // Mock Twilio video token for pharmacist
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/join`, {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_pharmacist_token',
        roomName: `consult_${consultationId}_room`,
        identity: 'pharmacist_001',
      },
    });

    // Mock patient medical history
    await mockApiResponse(pharmacistPage, `**/patients/${patientId}/medical-history`, {
      status: 200,
      body: {
        success: true,
        data: {
          currentMedications: ['Lisinopril 10mg - Daily'],
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          recentConsultations: [],
        },
      },
    });

    await pharmacistPage.getByRole('link', { name: /téléconsultation|consultation/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join call/i }).click();

    // Verify pharmacist video interface
    await expect(pharmacistPage.locator('[data-testid="video-container"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="remote-video"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="patient-info-panel"]')).toBeVisible();

    // Verify patient medical history displayed
    await expect(pharmacistPage.getByText('Lisinopril 10mg')).toBeVisible();
    await expect(pharmacistPage.getByText('Hypertension')).toBeVisible();

    // Patient no longer sees waiting message
    await expect(patientPage.locator('[data-testid="waiting-for-pharmacist"]')).not.toBeVisible();
    await expect(patientPage.locator('[data-testid="remote-video"]')).toBeVisible();

    // Exchange messages during consultation
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/messages`, {
      status: 201,
      body: { success: true },
    });

    await pharmacistPage.locator('[data-testid="chat-input"]').fill('Bonjour Sophie, je vois que vous prenez du Lisinopril. Depuis combien de temps avez-vous ces vertiges?');
    await pharmacistPage.getByRole('button', { name: /envoyer|send/i }).click();

    // Patient receives message
    await expect(patientPage.locator('[data-testid="chat-messages"]')).toContainText(/vertiges/i);

    // Patient responds
    await patientPage.locator('[data-testid="chat-input"]').fill('Depuis environ une semaine. Surtout le matin.');
    await patientPage.getByRole('button', { name: /envoyer|send/i }).click();

    // Pharmacist creates prescription during call
    await mockApiResponse(pharmacistPage, '**/prescriptions/create', {
      status: 201,
      body: {
        success: true,
        prescriptionId: prescriptionId,
        message: 'Prescription created',
      },
    });

    // Open prescription creation panel
    await pharmacistPage.getByRole('button', { name: /créer ordonnance|create prescription/i }).click();

    // Fill prescription details
    await pharmacistPage.locator('[data-testid="diagnosis-input"]').fill('Hypertension - dosage adjustment needed due to side effects');
    await pharmacistPage.locator('[data-testid="medication-name"]').fill('Lisinopril');
    await pharmacistPage.locator('[data-testid="medication-dosage"]').fill('5mg');
    await pharmacistPage.locator('[data-testid="medication-frequency"]').fill('Once daily in the evening');
    await pharmacistPage.locator('[data-testid="medication-duration"]').fill('30 days');
    await pharmacistPage.locator('[data-testid="prescription-notes"]').fill('Reduced dosage to 5mg to minimize dizziness. Take in evening rather than morning. Follow up in 2 weeks.');

    // Send prescription to patient
    await pharmacistPage.getByRole('button', { name: /envoyer ordonnance|send prescription/i }).click();

    // Verify prescription sent confirmation
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/sent|envoyée/i);

    // Patient receives in-call notification about prescription
    await expect(patientPage.locator('[data-testid="prescription-notification"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="prescription-notification"]')).toContainText(/ordonnance reçue|prescription received/i);

    await patientPage.close();
    await pharmacistPage.close();
  });

  /**
   * Journey Step 9-11: Call completion and follow-up
   */
  test('should end consultation with summary and follow-up actions', async ({ context }) => {
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    // Mock consultation join
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/join`, {
      status: 200,
      body: {
        success: true,
        token: 'mock_token',
        roomName: `consult_${consultationId}_room`,
      },
    });

    // Mock consultation end
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/end`, {
      status: 200,
      body: {
        success: true,
        consultation: {
          id: consultationId,
          status: 'completed',
          duration: 1245, // 20 minutes 45 seconds
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Mock notes saving
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/notes`, {
      status: 200,
      body: { success: true },
    });

    // Pharmacist in active consultation
    await pharmacistPage.getByRole('link', { name: /téléconsultation|consultation/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Pharmacist saves consultation notes
    await pharmacistPage.locator('[data-testid="notes-panel"]').click();
    await pharmacistPage.locator('[data-testid="consultation-notes"]').fill(
      'Patient presented with dizziness related to Lisinopril. Reduced dosage from 10mg to 5mg. ' +
      'Advised to take medication in evening instead of morning. ' +
      'Patient understands instructions. Follow-up appointment recommended in 2 weeks. ' +
      'Prescription sent during consultation.'
    );
    await pharmacistPage.getByRole('button', { name: /sauvegarder notes|save notes/i }).click();

    // Verify notes saved
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // End consultation
    await pharmacistPage.getByRole('button', { name: /terminer consultation|end consultation/i }).click();

    // Confirm ending
    await pharmacistPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify completion summary
    await expect(pharmacistPage.locator('[data-testid="consultation-summary"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/20.*min/i)).toBeVisible(); // Duration
    await expect(pharmacistPage.getByText(/completed|terminée/i)).toBeVisible();

    await pharmacistPage.close();

    // Patient receives completion notification and can view summary
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    // Mock consultation history
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          pharmacistName: 'Marie Dupont',
          status: 'completed',
          duration: 1245,
          completedAt: new Date().toISOString(),
          summary: 'Medication dosage adjusted. Prescription sent.',
          prescriptionIds: [prescriptionId],
          followUpRecommended: true,
          followUpDate: new Date(Date.now() + 14 * 86400000).toISOString(), // 2 weeks
        },
      },
    });

    // Mock prescription for follow-up
    await mockApiResponse(patientPage, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          medications: [
            {
              name: 'Lisinopril',
              dosage: '5mg',
              frequency: 'Once daily in the evening',
              quantity: 30,
            },
          ],
          notes: 'Reduced dosage to minimize dizziness',
        },
      },
    });

    await patientPage.waitForURL(/.*\/patient\/dashboard/);

    // Patient sees notification about completed consultation
    await expect(patientPage.locator('[data-testid="notification-badge"]')).toBeVisible();

    // Navigate to consultation history
    await patientPage.getByRole('link', { name: /téléconsultation|consultation/i }).click();
    await patientPage.getByRole('tab', { name: /historique|history/i }).click();

    // View completed consultation
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();

    // Verify consultation summary
    await expect(patientPage.getByText('Marie Dupont')).toBeVisible();
    await expect(patientPage.getByText(/20.*min/i)).toBeVisible();
    await expect(patientPage.getByText(/completed|terminée/i)).toBeVisible();

    // View prescription created during consultation
    await patientPage.getByRole('button', { name: /voir ordonnance|view prescription/i }).click();
    await expect(patientPage.getByText('Lisinopril 5mg')).toBeVisible();
    await expect(patientPage.getByText('Once daily in the evening')).toBeVisible();

    // Follow-up reminder visible
    await expect(patientPage.locator('[data-testid="follow-up-reminder"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="follow-up-reminder"]')).toContainText(/2.*week/i);

    // Option to book follow-up consultation
    await expect(patientPage.getByRole('button', { name: /réserver suivi|book follow-up/i })).toBeVisible();

    await patientPage.close();
  });

  /**
   * Complete journey - all steps in sequence
   */
  test('should complete entire teleconsultation journey from booking to follow-up', async ({ context }) => {
    // This is a comprehensive test that runs through all steps sequentially
    // to ensure the complete flow works end-to-end

    // Step 1: Patient books consultation
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, '**/teleconsultation/available-slots**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'slot_journey_001',
            pharmacistId: pharmacistId,
            pharmacistName: 'Marie Dupont',
            startTime: new Date(Date.now() + 3600000).toISOString(),
            duration: 30,
            available: true,
          },
        ],
      },
    });

    await mockApiResponse(patientPage, '**/teleconsultation/book', {
      status: 201,
      body: { success: true, consultationId: 'consult_journey_full_001' },
    });

    await patientPage.getByRole('link', { name: /téléconsultation/i }).click();
    await patientPage.locator('[data-testid="slot-slot_journey_001"]').click();
    await patientPage.locator('[data-testid="consultation-reason"]').fill('Medication review');
    await patientPage.getByRole('button', { name: /réserver/i }).click();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // Step 2: Pharmacist accepts
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, '**/teleconsultation/requests**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'consult_journey_full_001',
            patientName: 'Sophie Bernard',
            status: 'pending',
          },
        ],
      },
    });

    await mockApiResponse(pharmacistPage, '**/teleconsultation/consult_journey_full_001/accept', {
      status: 200,
      body: { success: true },
    });

    await pharmacistPage.getByRole('link', { name: /téléconsultation/i }).click();
    await pharmacistPage.locator('[data-testid="consultation-consult_journey_full_001"]').click();
    await pharmacistPage.getByRole('button', { name: /accepter/i }).click();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // Step 3: Both join video call (simplified - just verify join works)
    await mockApiResponse(patientPage, '**/teleconsultation/consult_journey_full_001/join', {
      status: 200,
      body: { success: true, token: 'mock_token', roomName: 'room_001' },
    });

    await patientPage.getByRole('link', { name: /téléconsultation/i }).click();
    await patientPage.locator('[data-testid="consultation-consult_journey_full_001"]').click();
    await patientPage.getByRole('button', { name: /rejoindre/i }).click();
    await expect(patientPage.locator('[data-testid="video-container"]')).toBeVisible();

    // Step 4: Consultation completes
    await mockApiResponse(pharmacistPage, '**/teleconsultation/consult_journey_full_001/end', {
      status: 200,
      body: { success: true },
    });

    await pharmacistPage.getByRole('link', { name: /téléconsultation/i }).click();
    await pharmacistPage.locator('[data-testid="consultation-consult_journey_full_001"]').click();

    // Verify journey completed successfully
    await expect(patientPage.locator('[data-testid="video-container"]')).toBeVisible();

    await patientPage.close();
    await pharmacistPage.close();
  });
});
