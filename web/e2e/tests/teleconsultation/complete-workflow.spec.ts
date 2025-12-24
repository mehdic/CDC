import { test, expect, testUsers } from '../../fixtures/auth.fixture';
import { TeleconsultationPage } from '../../page-objects';
import { mockApiResponse } from '../../utils/api-mock';
import { login, clearAuth } from '../../utils/auth-helpers';

/**
 * E2E-TELE: Complete Teleconsultation Workflow
 *
 * Comprehensive end-to-end tests covering the full teleconsultation lifecycle:
 * 1. Video call initiation and connection
 * 2. Screen sharing functionality
 * 3. Chat during consultation
 * 4. Prescription creation during call
 * 5. Call termination and summary
 *
 * Tests use MOCK_AUTH=true pattern for authentication
 * and leverage Playwright for browser automation.
 */

test.describe('E2E-TELE: Complete Teleconsultation Workflow', () => {
  const consultationId = 'consult_e2e_001';
  const patientId = 'patient_e2e_001';
  const pharmacistId = 'pharmacist_e2e_001';

  /**
   * Test 1: Video Call Initiation and Connection
   *
   * Tests the complete flow from consultation booking to video call connection:
   * - Pharmacist and patient can see upcoming consultation
   * - Both users can join the video room
   * - Video controls (camera, microphone) are available
   * - Connection status is displayed
   * - Waiting room functionality works
   */
  test('should initiate and connect video call between pharmacist and patient', async ({ context }) => {
    const appointmentTime = new Date(Date.now() + 300000).toISOString(); // 5 minutes from now

    // Mock consultation details
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
          reason: 'medication_review',
          roomName: `room_${consultationId}`,
        },
      },
    };

    // Mock Twilio video token
    const mockTwilioToken = {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token_e2e',
        roomName: `room_${consultationId}`,
        identity: 'user_identity',
      },
    };

    // Mock join consultation
    const mockJoinResponse = {
      status: 200,
      body: {
        success: true,
        message: 'Joined consultation successfully',
      },
    };

    // Patient page
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, mockConsultationDetails);
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/token`, mockTwilioToken);
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/join`, mockJoinResponse);

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockConsultationDetails);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/token`, mockTwilioToken);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/join`, mockJoinResponse);

    // Patient joins first
    await patientPage.getByRole('link', { name: /consultations|téléconsultations/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await patientPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify patient in waiting room
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible({ timeout: 10000 });
    await expect(patientPage.locator('[data-testid="waiting-status"]')).toBeVisible();
    await expect(patientPage.getByText(/en attente|waiting/i)).toBeVisible();

    // Verify patient video controls are visible
    await expect(patientPage.locator('[data-testid="toggle-video"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="toggle-audio"]')).toBeVisible();

    // Test video control toggle
    const videoToggle = patientPage.locator('[data-testid="toggle-video"]');
    await videoToggle.click();
    await expect(videoToggle).toHaveAttribute('aria-pressed', 'false');
    await videoToggle.click();
    await expect(videoToggle).toHaveAttribute('aria-pressed', 'true');

    // Pharmacist joins consultation
    await pharmacistPage.getByRole('link', { name: /consultations|téléconsultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify pharmacist in video room
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible({ timeout: 10000 });

    // Verify connection status shows "connected"
    await expect(pharmacistPage.locator('[data-testid="connection-status"]')).toContainText(/connecté|connected/i);

    // Verify participant list shows both users
    await expect(pharmacistPage.locator('[data-testid="participant-list"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();
    await expect(pharmacistPage.getByText('Marie Dupont')).toBeVisible();

    // Verify patient sees pharmacist joined
    await expect(patientPage.locator('[data-testid="waiting-status"]')).toBeHidden();
    await expect(patientPage.locator('[data-testid="connection-status"]')).toContainText(/connecté|connected/i);

    // Verify patient info sidebar for pharmacist
    await expect(pharmacistPage.locator('[data-testid="patient-info-sidebar"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();

    await patientPage.close();
    await pharmacistPage.close();
  });

  /**
   * Test 2: Screen Sharing Functionality
   *
   * Tests screen sharing capabilities during a consultation:
   * - Pharmacist can initiate screen sharing
   * - Patient sees the shared screen
   * - Screen sharing controls are visible
   * - Screen sharing can be stopped
   */
  test('should enable pharmacist to share screen during consultation', async ({ context }) => {
    // Mock active consultation
    const mockActiveConsultation = {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          status: 'in_progress',
          participants: [
            { id: patientId, role: 'patient', joined: true },
            { id: pharmacistId, role: 'pharmacist', joined: true },
          ],
        },
      },
    };

    // Mock screen sharing start
    const mockScreenShareStart = {
      status: 200,
      body: {
        success: true,
        message: 'Screen sharing started',
        shareId: 'share_001',
      },
    };

    // Mock screen sharing stop
    const mockScreenShareStop = {
      status: 200,
      body: {
        success: true,
        message: 'Screen sharing stopped',
      },
    };

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/screen-share/start`, mockScreenShareStart);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/screen-share/stop`, mockScreenShareStop);

    // Patient page
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);

    // Join consultation (both users)
    await pharmacistPage.getByRole('link', { name: /consultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    await patientPage.getByRole('link', { name: /consultations/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await patientPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Wait for video rooms to load
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible();

    // Pharmacist initiates screen sharing
    await pharmacistPage.getByRole('button', { name: /partager écran|share screen/i }).click();

    // Verify screen sharing active indicator on pharmacist side
    await expect(pharmacistPage.locator('[data-testid="screen-sharing-active"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="screen-sharing-active"]')).toContainText(/partage en cours|sharing/i);

    // Verify screen sharing controls visible
    await expect(pharmacistPage.getByRole('button', { name: /arrêter partage|stop sharing/i })).toBeVisible();

    // Verify patient sees screen sharing notification
    await expect(patientPage.locator('[data-testid="screen-share-notification"]')).toBeVisible();
    await expect(patientPage.getByText(/partage d'écran|screen sharing/i)).toBeVisible();

    // Verify screen share view for patient
    await expect(patientPage.locator('[data-testid="shared-screen-view"]')).toBeVisible();

    // Pharmacist stops screen sharing
    await pharmacistPage.getByRole('button', { name: /arrêter partage|stop sharing/i }).click();

    // Verify screen sharing stopped
    await expect(pharmacistPage.locator('[data-testid="screen-sharing-active"]')).toBeHidden();
    await expect(patientPage.locator('[data-testid="screen-share-notification"]')).toBeHidden();

    // Verify back to normal video view
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible();

    await pharmacistPage.close();
    await patientPage.close();
  });

  /**
   * Test 3: Chat During Consultation
   *
   * Tests real-time chat functionality during active consultation:
   * - Both users can send messages
   * - Messages are displayed in real-time
   * - Chat history is maintained
   * - File sharing is available
   */
  test('should enable real-time chat between pharmacist and patient during consultation', async ({ context }) => {
    // Mock active consultation
    const mockActiveConsultation = {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          status: 'in_progress',
        },
      },
    };

    // Mock send message
    const mockSendMessage = {
      status: 200,
      body: {
        success: true,
        messageId: 'msg_001',
        timestamp: new Date().toISOString(),
      },
    };

    // Mock chat history
    const mockChatHistory = {
      status: 200,
      body: {
        success: true,
        messages: [
          {
            id: 'msg_001',
            sender: 'pharmacist',
            senderName: 'Marie Dupont',
            text: 'Bonjour Sophie, comment vous sentez-vous aujourd\'hui?',
            timestamp: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      },
    };

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/messages`, mockChatHistory);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/send-message`, mockSendMessage);

    // Patient page
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/messages`, mockChatHistory);
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/send-message`, mockSendMessage);

    // Join consultation
    await pharmacistPage.getByRole('link', { name: /consultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    await patientPage.getByRole('link', { name: /consultations/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await patientPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Wait for video rooms
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible();

    // Open chat panel on pharmacist side
    await pharmacistPage.getByRole('button', { name: /chat|messagerie/i }).click();
    await expect(pharmacistPage.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Verify chat history loaded
    await expect(pharmacistPage.getByText(/comment vous sentez-vous/i)).toBeVisible();

    // Pharmacist sends a message
    const chatInput = pharmacistPage.locator('[data-testid="chat-input"]');
    await chatInput.fill('Avez-vous pris vos médicaments ce matin?');
    await chatInput.press('Enter');

    // Verify message appears in pharmacist chat
    await expect(pharmacistPage.getByText(/Avez-vous pris vos médicaments/i)).toBeVisible();

    // Open chat panel on patient side
    await patientPage.getByRole('button', { name: /chat|messagerie/i }).click();
    await expect(patientPage.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Patient sends a response
    const patientChatInput = patientPage.locator('[data-testid="chat-input"]');
    await patientChatInput.fill('Oui, j\'ai pris le Lisinopril à 8h comme d\'habitude.');
    await patientChatInput.press('Enter');

    // Verify message appears in patient chat
    await expect(patientPage.getByText(/j'ai pris le Lisinopril/i)).toBeVisible();

    // Verify message count indicator
    await expect(pharmacistPage.locator('[data-testid="message-count"]')).toBeVisible();

    // Test file attachment button is visible
    await expect(pharmacistPage.locator('[data-testid="attach-file"]')).toBeVisible();

    // Close chat panels
    await pharmacistPage.getByRole('button', { name: /fermer|close/i }).first().click();
    await expect(pharmacistPage.locator('[data-testid="chat-panel"]')).toBeHidden();

    await pharmacistPage.close();
    await patientPage.close();
  });

  /**
   * Test 4: Prescription Creation During Call
   *
   * Tests the workflow for creating prescriptions during an active consultation:
   * - Pharmacist can access prescription form
   * - Patient data is pre-filled
   * - Drug interaction checking is performed
   * - Prescription is linked to consultation
   * - Patient receives notification
   */
  test('should allow pharmacist to create prescription during active consultation', async ({ page }) => {
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

    // Mock patient medical record
    await mockApiResponse(page, `**/patient/${patientId}/medical-record`, {
      status: 200,
      body: {
        success: true,
        data: {
          patientId: patientId,
          name: 'Sophie Bernard',
          dateOfBirth: '1975-06-15',
          allergies: ['Penicillin', 'Sulfa drugs'],
          currentMedications: [
            { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' },
          ],
          chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        },
      },
    });

    // Mock drug search
    await mockApiResponse(page, '**/drugs/search?q=Metformin', {
      status: 200,
      body: {
        success: true,
        results: [
          {
            id: 'drug_metformin',
            name: 'Metformin',
            genericName: 'Metformin Hydrochloride',
            commonDosages: ['500mg', '850mg', '1000mg'],
          },
        ],
      },
    });

    // Mock drug interaction check
    await mockApiResponse(page, '**/drugs/interactions/check', {
      status: 200,
      body: {
        success: true,
        interactions: [],
        severity: 'none',
        message: 'No significant interactions detected',
      },
    });

    // Mock prescription creation
    await mockApiResponse(page, '**/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: 'rx_consult_e2e_001',
        linkedToConsultation: consultationId,
      },
    });

    // Join consultation
    await page.getByRole('link', { name: /consultations/i }).click();
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await page.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify in video room
    await expect(page.locator('[data-testid="video-room"]')).toBeVisible();

    // Verify patient info sidebar visible
    await expect(page.locator('[data-testid="patient-info-sidebar"]')).toBeVisible();
    await expect(page.getByText('Sophie Bernard')).toBeVisible();

    // Click create prescription button
    await page.getByRole('button', { name: /créer ordonnance|create prescription|nouvelle ordonnance/i }).click();

    // Verify prescription form opened
    await expect(page.locator('[data-testid="prescription-form"]')).toBeVisible();

    // Verify patient context pre-filled
    await expect(page.locator('[data-testid="patient-name"]')).toHaveValue('Sophie Bernard');

    // Verify allergies displayed as warning
    await expect(page.locator('[data-testid="allergies-warning"]')).toBeVisible();
    await expect(page.getByText('Penicillin')).toBeVisible();
    await expect(page.getByText('Sulfa drugs')).toBeVisible();

    // Verify current medications displayed
    await expect(page.locator('[data-testid="current-medications"]')).toBeVisible();
    await expect(page.getByText('Lisinopril 10mg')).toBeVisible();

    // Search for medication
    await page.locator('[data-testid="medication-search"]').fill('Metformin');
    await page.waitForTimeout(500); // Wait for search debounce

    // Select medication from results
    await page.locator('[data-testid="drug-result-drug_metformin"]').click();

    // Verify medication added to prescription
    await expect(page.locator('[data-testid="medication-list"]')).toContainText('Metformin');

    // Set dosage
    await page.locator('[data-testid="dosage"]').selectOption('850mg');

    // Set frequency
    await page.locator('[data-testid="frequency"]').fill('Twice daily with meals');

    // Set duration
    await page.locator('[data-testid="duration"]').fill('90 days');

    // Add special instructions
    await page.locator('[data-testid="prescription-notes"]').fill(
      'Start with 850mg twice daily. May increase to 1000mg after 2 weeks if well tolerated. Monitor blood glucose levels.'
    );

    // Verify drug interaction check performed
    await expect(page.locator('[data-testid="interaction-check-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="interaction-check-result"]')).toContainText(/no significant interactions/i);

    // Submit prescription
    await page.getByRole('button', { name: /créer|create|enregistrer|save/i }).click();

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/prescription créée|prescription created/i);

    // Verify prescription linked to consultation
    await expect(page.locator('[data-testid="linked-prescriptions"]')).toBeVisible();
    await expect(page.locator('[data-testid="prescription-rx_consult_e2e_001"]')).toBeVisible();

    // Verify prescription badge shows count
    await expect(page.locator('[data-testid="prescription-count-badge"]')).toContainText('1');

    await clearAuth(page);
  });

  /**
   * Test 5: Call Termination and Summary
   *
   * Tests the consultation termination workflow and summary generation:
   * - Either participant can end the call
   * - Confirmation dialog is shown
   * - Call duration is recorded
   * - AI summary is generated
   * - Manual notes can be added
   * - Summary is sent to patient
   */
  test('should terminate consultation and generate comprehensive summary', async ({ context }) => {
    // Mock active consultation
    const consultationStartTime = new Date(Date.now() - 1200000); // Started 20 minutes ago
    const mockActiveConsultation = {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          patientId: patientId,
          patientName: 'Sophie Bernard',
          pharmacistId: pharmacistId,
          pharmacistName: 'Marie Dupont',
          status: 'in_progress',
          startedAt: consultationStartTime.toISOString(),
          transcriptionEnabled: true,
        },
      },
    };

    // Mock end consultation
    const mockEndConsultation = {
      status: 200,
      body: {
        success: true,
        consultationId: consultationId,
        duration: 1200, // 20 minutes in seconds
        status: 'completed',
      },
    };

    // Mock AI summary generation
    const mockAiSummary = {
      status: 200,
      body: {
        success: true,
        summary: {
          chiefComplaint: 'Medication review for diabetes management',
          keyDiscussionPoints: [
            'Patient reports good adherence to Lisinopril for blood pressure',
            'Recent HbA1c elevated at 7.8%, indicating need for diabetes medication',
            'Patient willing to add Metformin to treatment regimen',
            'Discussed importance of diet and exercise',
          ],
          vitalSigns: {
            bloodPressure: '135/85 mmHg',
            heartRate: '72 bpm',
            bloodGlucose: '145 mg/dL (fasting)',
          },
          recommendations: [
            'Initiated Metformin 850mg twice daily with meals',
            'Continue Lisinopril 10mg once daily',
            'Monitor fasting blood glucose daily for 2 weeks',
            'Increase physical activity to 30 minutes daily',
            'Reduce refined carbohydrate intake',
          ],
          prescriptionsCreated: ['rx_consult_e2e_001'],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks
          followUpReason: 'Review blood glucose control and medication tolerance',
        },
      },
    };

    // Mock save notes
    const mockSaveNotes = {
      status: 200,
      body: {
        success: true,
        message: 'Consultation notes saved successfully',
      },
    };

    // Mock send summary to patient
    const mockSendSummary = {
      status: 200,
      body: {
        success: true,
        message: 'Summary sent to patient',
      },
    };

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/end`, mockEndConsultation);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/generate-summary`, mockAiSummary);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/notes`, mockSaveNotes);
    await mockApiResponse(pharmacistPage, `**/teleconsultation/${consultationId}/send-summary`, mockSendSummary);

    // Patient page
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}`, mockActiveConsultation);
    await mockApiResponse(patientPage, `**/teleconsultation/${consultationId}/end`, mockEndConsultation);

    // Join consultation
    await pharmacistPage.getByRole('link', { name: /consultations/i }).click();
    await pharmacistPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /rejoindre|join/i }).click();

    await patientPage.getByRole('link', { name: /consultations/i }).click();
    await patientPage.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await patientPage.getByRole('button', { name: /rejoindre|join/i }).click();

    // Wait for video rooms
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="video-room"]')).toBeVisible();

    // Verify call duration timer is visible
    await expect(pharmacistPage.locator('[data-testid="call-duration"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="call-duration"]')).toContainText(/\d{2}:\d{2}/); // MM:SS format

    // Pharmacist ends consultation
    await pharmacistPage.getByRole('button', { name: /terminer|end call|fin/i }).click();

    // Verify confirmation dialog
    await expect(pharmacistPage.locator('[data-testid="end-call-dialog"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/êtes-vous sûr|are you sure/i)).toBeVisible();

    // Confirm end consultation
    await pharmacistPage.getByRole('button', { name: /confirmer|confirm|oui|yes/i }).click();

    // Verify video room closed
    await expect(pharmacistPage.locator('[data-testid="video-room"]')).toBeHidden();

    // Verify patient sees consultation ended
    await expect(patientPage.locator('[data-testid="consultation-ended-message"]')).toBeVisible();
    await expect(patientPage.getByText(/consultation terminée|consultation ended/i)).toBeVisible();

    // Verify summary generation screen
    await expect(pharmacistPage.locator('[data-testid="summary-screen"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/durée|duration/i)).toBeVisible();
    await expect(pharmacistPage.getByText('20 min')).toBeVisible();

    // Generate AI summary
    await pharmacistPage.getByRole('button', { name: /générer résumé|generate summary/i }).click();

    // Verify AI processing indicator
    await expect(pharmacistPage.locator('[data-testid="ai-processing"]')).toBeVisible();

    // Wait for AI summary to load
    await pharmacistPage.waitForTimeout(2000);

    // Verify AI summary displayed
    await expect(pharmacistPage.locator('[data-testid="ai-summary"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Medication review for diabetes management')).toBeVisible();
    await expect(pharmacistPage.getByText(/Metformin 850mg/i)).toBeVisible();
    await expect(pharmacistPage.getByText(/Monitor fasting blood glucose/i)).toBeVisible();

    // Verify prescriptions linked
    await expect(pharmacistPage.locator('[data-testid="linked-prescriptions"]')).toBeVisible();
    await expect(pharmacistPage.getByText('rx_consult_e2e_001')).toBeVisible();

    // Verify follow-up section
    await expect(pharmacistPage.locator('[data-testid="follow-up-section"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/follow-up required|suivi nécessaire/i)).toBeVisible();

    // Add manual notes
    const manualNotes = pharmacistPage.locator('[data-testid="manual-notes"]');
    await manualNotes.fill(
      'Patient was very cooperative and engaged throughout the consultation. ' +
      'Demonstrated good understanding of medication changes. ' +
      'Provided detailed instructions on blood glucose monitoring.'
    );

    // Save consultation notes
    await pharmacistPage.getByRole('button', { name: /enregistrer|save notes/i }).click();

    // Verify notes saved confirmation
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/saved|enregistré/i);

    // Send summary to patient
    await pharmacistPage.getByRole('button', { name: /envoyer au patient|send to patient/i }).click();

    // Verify summary sent confirmation
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/envoyé|sent/i);

    // Verify consultation marked as completed
    await expect(pharmacistPage.locator('[data-testid="consultation-status"]')).toContainText(/terminée|completed/i);

    await pharmacistPage.close();
    await patientPage.close();
  });

  /**
   * Test 6: Patient Views Consultation Summary
   *
   * Tests patient access to completed consultation summary:
   * - Patient can view consultation history
   * - Summary includes all key information
   * - Prescriptions are accessible
   * - Follow-up reminders are visible
   */
  test('should allow patient to view detailed consultation summary', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);

    // Mock completed consultation details
    await mockApiResponse(page, `**/patient/consultations/${consultationId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: consultationId,
          pharmacistName: 'Marie Dupont',
          date: new Date().toISOString(),
          duration: 1200,
          status: 'completed',
          summary: {
            chiefComplaint: 'Medication review for diabetes management',
            recommendations: [
              'Start Metformin 850mg twice daily with meals',
              'Continue Lisinopril 10mg once daily',
              'Monitor fasting blood glucose daily',
              'Increase physical activity to 30 minutes daily',
            ],
            prescriptionsCreated: [
              {
                id: 'rx_consult_e2e_001',
                medication: 'Metformin 850mg',
                instructions: 'Take twice daily with meals',
                duration: '90 days',
              },
            ],
            followUpDate: new Date(Date.now() + 1209600000).toISOString(),
            followUpReason: 'Review blood glucose control and medication tolerance',
          },
          pharmacistNotes: 'Patient was cooperative. Good understanding of changes.',
        },
      },
    });

    // Navigate to consultation history
    await page.getByRole('link', { name: /consultations|mes consultations/i }).click();

    // Switch to completed consultations tab
    await page.getByRole('tab', { name: /terminées|completed|passées/i }).click();

    // Click on completed consultation
    await page.locator(`[data-testid="consultation-${consultationId}"]`).click();

    // Verify summary page loaded
    await expect(page.locator('[data-testid="consultation-summary"]')).toBeVisible();

    // Verify pharmacist name
    await expect(page.getByText('Marie Dupont')).toBeVisible();

    // Verify duration
    await expect(page.getByText('20 min')).toBeVisible();

    // Verify chief complaint
    await expect(page.getByText('Medication review for diabetes management')).toBeVisible();

    // Verify recommendations list
    await expect(page.locator('[data-testid="recommendations-list"]')).toBeVisible();
    await expect(page.getByText(/Metformin 850mg twice daily/i)).toBeVisible();
    await expect(page.getByText(/Monitor fasting blood glucose/i)).toBeVisible();

    // Verify prescriptions section
    await expect(page.locator('[data-testid="prescriptions-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="prescription-rx_consult_e2e_001"]')).toBeVisible();
    await expect(page.getByText('Metformin 850mg')).toBeVisible();

    // Click prescription to view details
    await page.locator('[data-testid="prescription-rx_consult_e2e_001"]').click();
    await expect(page.locator('[data-testid="prescription-details"]')).toBeVisible();
    await expect(page.getByText('Take twice daily with meals')).toBeVisible();
    await expect(page.getByText('90 days')).toBeVisible();

    // Close prescription details
    await page.getByRole('button', { name: /fermer|close/i }).first().click();

    // Verify follow-up reminder
    await expect(page.locator('[data-testid="follow-up-reminder"]')).toBeVisible();
    await expect(page.getByText(/follow-up|rendez-vous de suivi/i)).toBeVisible();
    await expect(page.getByText(/Review blood glucose control/i)).toBeVisible();

    // Verify download summary button
    await expect(page.getByRole('button', { name: /télécharger|download|pdf/i })).toBeVisible();

    await clearAuth(page);
  });
});
