import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { TeleconsultationPage, MessagingPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E-027: Multi-User Teleconsultation
 *
 * Tests teleconsultation workflows involving multiple users:
 * 1. Patient + Pharmacist standard consultation
 * 2. Patient + Pharmacist + Doctor consultation (complex case)
 * 3. Consultation with AI transcription and note-taking
 * 4. Prescription creation during teleconsultation
 * 5. Post-consultation follow-up messaging
 */

test.describe('E2E-027: Multi-User Teleconsultation', () => {
  const consultationId = 'consult_multi_001';
  const patientId = 'patient_001';
  const pharmacistId = 'pharmacist_001';
  const doctorId = 'doctor_001';

  test.beforeEach(async ({ page }) => {
    // Mock Twilio video token generation
    await mockApiResponse(page, '**/teleconsultation/*/token', {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token_123',
        roomName: `room_${consultationId}`,
        identity: 'user_identity',
      },
    });
  });

  /**
   * Scenario 1: Patient books teleconsultation with pharmacist
   */
  test('should allow patient to book teleconsultation with pharmacist', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);

    // Mock available time slots
    await mockApiResponse(page, '**/teleconsultation/slots**', {
      status: 200,
      body: {
        success: true,
        slots: [
          {
            pharmacistId: pharmacistId,
            pharmacistName: 'Marie Dupont',
            date: new Date(Date.now() + 86400000).toISOString(),
            time: '14:00',
            available: true,
          },
          {
            pharmacistId: pharmacistId,
            pharmacistName: 'Marie Dupont',
            date: new Date(Date.now() + 86400000).toISOString(),
            time: '15:30',
            available: true,
          },
        ],
      },
    });

    // Mock booking confirmation
    await mockApiResponse(page, '**/teleconsultation/book', {
      status: 201,
      body: {
        success: true,
        consultationId: consultationId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        pharmacistName: 'Marie Dupont',
      },
    });

    const teleconsultPage = new TeleconsultationPage(page);
    await teleconsultPage.goto();

    // Click book consultation
    await page.getByRole('button', { name: /réserver|book|nouvelle consultation/i }).click();

    // Select reason for consultation
    await page.locator('[data-testid="consultation-reason"]').selectOption('medication_advice');
    await page.locator('[data-testid="consultation-description"]').fill('Questions about my blood pressure medication dosage');

    // View available pharmacists
    await page.getByRole('button', { name: /voir disponibilités|view availability/i }).click();

    // Select time slot
    await page.locator('[data-testid="slot-14:00"]').click();

    // Confirm booking
    await page.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.getByText('Marie Dupont')).toBeVisible();
    await expect(page.locator('[data-testid="consultation-id"]')).toContainText(consultationId);

    await clearAuth(page);
  });

  /**
   * Scenario 2: Pharmacist and patient join video call
   */
  test('should allow pharmacist and patient to join teleconsultation video call', async ({ context }) => {
    const appointmentTime = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now

    // Mock consultation details for both users
    const mockConsultationDetails = {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          patientId: patientId,
          patientName: 'Sophie Bernard',
          pharmacistId: pharmacistId,
          pharmacistName: 'Marie Dupont',
          scheduledAt: appointmentTime,
          status: 'scheduled',
          reason: 'medication_advice',
          roomName: `room_${consultationId}`,
        },
      },
    };

    // Patient page
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, mockConsultationDetails);
    await mockApiResponse(patientPage, '**/teleconsultation/*/join', {
      status: 200,
      body: { success: true },
    });

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockConsultationDetails);
    await mockApiResponse(pharmacistPage, '**/teleconsultation/*/join', {
      status: 200,
      body: { success: true },
    });

    // Patient joins consultation
    await patientPage.getByRole('link', { name: /consultations|téléconsultations/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await patientPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify patient in waiting room
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible();
    await expect(patientPage.getByText(/en attente|waiting/i)).toBeVisible();

    // Pharmacist joins consultation
    await pharmacistPage.getByRole('link', { name: /consultations|téléconsultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify pharmacist in video room
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible();

    // Verify call controls visible for both
    await expect(patientPage.locator('[data-testid="toggle-video"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="toggle-audio"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="toggle-video"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="toggle-audio"]')).toBeVisible();

    // Verify patient info sidebar for pharmacist
    await expect(pharmacistPage.locator('[data-testid="patient-info-sidebar"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();

    await patientPage.close();
    await pharmacistPage.close();
  });

  /**
   * Scenario 3: Pharmacist invites doctor to ongoing consultation
   */
  test('should allow pharmacist to invite doctor to ongoing teleconsultation', async ({ context }) => {
    // Mock consultation in progress
    const mockActiveConsultation = {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          patientName: 'Sophie Bernard',
          pharmacistName: 'Marie Dupont',
          status: 'in_progress',
          participants: [
            { id: patientId, role: 'patient', joined: true },
            { id: pharmacistId, role: 'pharmacist', joined: true },
          ],
        },
      },
    };

    // Mock doctor invitation
    const mockDoctorInvite = {
      status: 200,
      body: {
        success: true,
        invitationId: 'invite_001',
        message: 'Doctor invitation sent',
      },
    };

    // Mock doctor list
    const mockDoctorList = {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: doctorId,
            name: 'Dr. Jean Martin',
            specialty: 'General Practitioner',
            available: true,
          },
        ],
      },
    };

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(pharmacistPage, '**/doctors/available', mockDoctorList);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/invite`, mockDoctorInvite);

    // Join consultation
    await pharmacistPage.getByRole('link', { name: /consultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Wait for video room to load
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible();

    // Click invite participant button
    await pharmacistPage.getByRole('button', { name: /inviter|invite|add participant/i }).click();

    // Select role: doctor
    await pharmacistPage.locator('[data-testid="invite-role"]').selectOption('doctor');

    // Select doctor from list
    await pharmacistPage.locator(`[data-testid="doctor-${doctorId}"]`).click();

    // Add invitation message
    await pharmacistPage.locator('[data-testid="invitation-message"]').fill('Complex case requiring specialist input');

    // Send invitation
    await pharmacistPage.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify invitation sent
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/invitation sent|invitation envoyée/i);

    // Verify pending participant shown
    await expect(pharmacistPage.locator(`[data-testid="participant-pending-${doctorId}"]`)).toBeVisible();

    await pharmacistPage.close();
  });

  /**
   * Scenario 4: AI transcription during consultation
   */
  test('should transcribe consultation conversation with AI and highlight medical terms', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock active consultation
    await mockApiResponse(page, `**/teleconsultation/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          status: 'in_progress',
          transcriptionEnabled: true,
        },
      },
    });

    // Mock transcription stream
    await mockApiResponse(page, `**/teleconsultation/${consultationId}/transcription`, {
      status: 200,
      body: {
        success: true,
        transcript: [
          {
            speaker: 'patient',
            text: 'I have been taking Lisinopril 10mg for my blood pressure, but I still feel dizzy sometimes',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            medicalTerms: ['Lisinopril', 'blood pressure', 'dizzy'],
          },
          {
            speaker: 'pharmacist',
            text: 'Let me check your dosage. Have you been taking it consistently at the same time every day?',
            timestamp: new Date(Date.now() - 30000).toISOString(),
            medicalTerms: ['dosage'],
          },
        ],
      },
    });

    const teleconsultPage = new TeleconsultationPage(page);
    await page.getByRole('link', { name: /consultations/i }).click();
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await page.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify video room loaded
    await expect(page.locator('[data-testid="video-room"]')).toBeVisible();

    // Open transcription panel
    await page.getByRole('button', { name: /transcription|transcript/i }).click();

    // Verify transcription panel visible
    await expect(page.locator('[data-testid="transcription-panel"]')).toBeVisible();

    // Verify transcript entries
    await expect(page.getByText(/Lisinopril 10mg/i)).toBeVisible();
    await expect(page.getByText(/blood pressure/i)).toBeVisible();

    // Verify medical terms are highlighted
    const highlightedTerm = page.locator('[data-testid="medical-term-Lisinopril"]');
    await expect(highlightedTerm).toBeVisible();
    await expect(highlightedTerm).toHaveClass(/highlighted|medical-term/);

    // Click on highlighted term to see info
    await highlightedTerm.click();
    await expect(page.locator('[data-testid="term-info-popup"]')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 5: Pharmacist creates prescription during teleconsultation
   */
  test('should allow pharmacist to create prescription during teleconsultation', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock active consultation
    await mockApiResponse(page, `**/teleconsultation/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          patientId: patientId,
          patientName: 'Sophie Bernard',
          status: 'in_progress',
        },
      },
    });

    // Mock patient medical record access
    await mockApiResponse(page, `**/patient/${patientId}/medical-record`, {
      status: 200,
      body: {
        success: true,
        data: {
          allergies: ['Penicillin'],
          currentMedications: ['Lisinopril 10mg'],
          chronicConditions: ['Hypertension'],
        },
      },
    });

    // Mock prescription creation
    await mockApiResponse(page, '**/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: 'rx_teleconsult_001',
        linkedToConsultation: consultationId,
      },
    });

    // Join consultation
    await page.getByRole('link', { name: /consultations/i }).click();
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await page.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify in video room
    await expect(page.locator('[data-testid="video-room"]')).toBeVisible();

    // Access patient sidebar
    await expect(page.locator('[data-testid="patient-info-sidebar"]')).toBeVisible();
    await expect(page.getByText('Sophie Bernard')).toBeVisible();

    // Click create prescription button
    await page.getByRole('button', { name: /créer ordonnance|create prescription/i }).click();

    // Verify prescription form opened in sidebar
    await expect(page.locator('[data-testid="prescription-form"]')).toBeVisible();

    // Verify patient context pre-filled
    await expect(page.locator('[data-testid="patient-name"]')).toHaveValue('Sophie Bernard');

    // Add medication
    await page.locator('[data-testid="medication-search"]').fill('Amlodipine');
    await page.locator('[data-testid="medication-result-Amlodipine"]').click();

    // Set dosage
    await page.locator('[data-testid="dosage"]').fill('5mg');
    await page.locator('[data-testid="frequency"]').fill('Once daily');
    await page.locator('[data-testid="duration"]').fill('30 days');

    // Add notes
    await page.locator('[data-testid="prescription-notes"]').fill('Added calcium channel blocker to current Lisinopril treatment. Monitor blood pressure closely.');

    // Submit prescription
    await page.getByRole('button', { name: /enregistrer|save|create/i }).click();

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/created|créée/i);

    // Verify prescription linked to consultation
    await expect(page.locator('[data-testid="linked-prescription"]')).toBeVisible();
    await expect(page.locator('[data-testid="linked-prescription"]')).toContainText('rx_teleconsult_001');

    await clearAuth(page);
  });

  /**
   * Scenario 6: Post-consultation notes and summary
   */
  test('should save consultation notes and generate AI summary after session', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock completed consultation
    await mockApiResponse(page, `**/teleconsultation/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          status: 'completed',
          duration: 1200, // 20 minutes
          transcript: 'Full transcript...',
          aiSummary: null,
        },
      },
    });

    // Mock AI summary generation
    await mockApiResponse(page, `**/teleconsultation/${consultationId}/generate-summary`, {
      status: 200,
      body: {
        success: true,
        summary: {
          chiefComplaint: 'Persistent dizziness with current hypertension medication',
          discussionPoints: [
            'Patient reports dizziness after taking Lisinopril 10mg',
            'Dosage timing confirmed - taken in morning',
            'Blood pressure readings reviewed - average 135/85',
          ],
          recommendations: [
            'Added Amlodipine 5mg once daily',
            'Advised patient to monitor BP twice daily',
            'Follow-up in 2 weeks',
          ],
          prescriptionsCreated: ['rx_teleconsult_001'],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks
        },
      },
    });

    // Mock save notes
    await mockApiResponse(page, `**/teleconsultation/${consultationId}/notes`, {
      status: 200,
      body: {
        success: true,
        message: 'Notes saved successfully',
      },
    });

    // Navigate to completed consultation
    await page.getByRole('link', { name: /consultations/i }).click();
    await page.getByRole('tab', { name: /terminées|completed|history/i }).click();
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();

    // Verify session details
    await expect(page.locator('[data-testid="consultation-details"]')).toBeVisible();
    await expect(page.getByText('20 minutes')).toBeVisible();

    // Generate AI summary
    await page.getByRole('button', { name: /générer résumé|generate summary/i }).click();

    // Wait for AI processing
    await expect(page.locator('[data-testid="ai-processing"]')).toBeVisible();
    await page.waitForTimeout(2000); // Simulate AI processing time

    // Verify AI summary displayed
    await expect(page.locator('[data-testid="ai-summary"]')).toBeVisible();
    await expect(page.getByText(/Chief Complaint|Motif principal/i)).toBeVisible();
    await expect(page.getByText('Persistent dizziness')).toBeVisible();
    await expect(page.getByText('Amlodipine 5mg')).toBeVisible();

    // Add manual notes
    await page.locator('[data-testid="manual-notes"]').fill('Patient was cooperative and understood instructions. Good medication adherence reported.');

    // Save consultation notes
    await page.getByRole('button', { name: /enregistrer|save notes/i }).click();

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/saved|enregistré/i);

    // Verify notes added to patient record
    await expect(page.locator('[data-testid="added-to-record"]')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 7: Patient receives post-consultation follow-up
   */
  test('should notify patient after consultation with summary and next steps', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);

    // Mock consultation history for patient
    await mockApiResponse(page, '**/patient/consultations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: consultationId,
            pharmacistName: 'Marie Dupont',
            date: new Date().toISOString(),
            duration: 1200,
            status: 'completed',
            hasSummary: true,
          },
        ],
      },
    });

    // Mock consultation summary for patient view
    await mockApiResponse(page, `**/patient/consultations/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          pharmacistName: 'Marie Dupont',
          date: new Date().toISOString(),
          summary: {
            recommendations: [
              'Continue taking Lisinopril 10mg as prescribed',
              'Start new medication: Amlodipine 5mg once daily',
              'Monitor blood pressure twice daily',
              'Record readings in health app',
            ],
            prescriptionsCreated: [
              {
                id: 'rx_teleconsult_001',
                medication: 'Amlodipine 5mg',
                instructions: 'Take once daily with water',
              },
            ],
            followUpDate: new Date(Date.now() + 1209600000).toISOString(),
          },
          recordingUrl: 'https://example.com/recording', // If consent given
        },
      },
    });

    // Navigate to consultation history
    await page.getByRole('link', { name: /consultations|téléconsultations/i }).click();

    // View completed consultation
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();

    // Verify summary visible
    await expect(page.locator('[data-testid="consultation-summary"]')).toBeVisible();
    await expect(page.getByText('Marie Dupont')).toBeVisible();

    // Verify recommendations
    await expect(page.getByText('Monitor blood pressure twice daily')).toBeVisible();

    // Verify prescription created
    await expect(page.locator('[data-testid="prescription-rx_teleconsult_001"]')).toBeVisible();
    await expect(page.getByText('Amlodipine 5mg')).toBeVisible();

    // Verify follow-up reminder
    await expect(page.locator('[data-testid="follow-up-reminder"]')).toBeVisible();
    await expect(page.getByText(/follow-up|suivi/i)).toBeVisible();

    // Click to view prescription details
    await page.locator('[data-testid="prescription-rx_teleconsult_001"]').click();
    await expect(page.locator('[data-testid="prescription-details"]')).toBeVisible();

    await clearAuth(page);
  });
});
