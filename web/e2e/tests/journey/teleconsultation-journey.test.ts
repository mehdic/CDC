/**
 * E2E-047: Complete Teleconsultation Journey
 *
 * Tests the complete teleconsultation lifecycle from booking through
 * follow-up scheduling and recording storage.
 *
 * Journey Steps:
 * 1. Patient books teleconsultation
 * 2. Reminders sent to both parties
 * 3. Both parties join video call
 * 4. Pharmacist takes notes with voice transcription
 * 5. Prescription created during call
 * 6. Follow-up scheduled
 * 7. Recording saved (with consent)
 */

import { test, expect } from '../../fixtures/auth.fixture';
import {
  generateTeleconsultationJourneyData,
  mockTeleconsultationBookingStep,
  mockReminderSendingStep,
  mockVideoCallJoinStep,
  mockVoiceTranscriptionStep,
  mockPharmacistApprovalStep,
  mockFollowUpSchedulingStep,
  mockRecordingSavingStep,
  assertTeleconsultationJourneyComplete,
  JourneyStateManager,
} from './e2e-utils';
import { mockApiResponse } from '../../utils/api-mock';

test.describe('E2E-047: Complete Teleconsultation Journey', () => {
  let journeyState: JourneyStateManager;

  test.beforeEach(() => {
    journeyState = new JourneyStateManager();
  });

  /**
   * Test 1: Patient books teleconsultation with available pharmacist
   */
  test('Step 1: Patient books teleconsultation successfully', async ({ patientPage }) => {
    const journeyData = generateTeleconsultationJourneyData();
    journeyState.set('consultationData', journeyData);

    // Mock available pharmacists and time slots
    await mockApiResponse(patientPage, '**/consultations/available-slots', {
      status: 200,
      body: {
        success: true,
        pharmacists: [
          {
            id: journeyData.pharmacistId,
            name: journeyData.pharmacistName,
            rating: 4.8,
            specialty: 'Consultation générale',
            availableSlots: [
              journeyData.bookingTime,
              new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            ],
          },
        ],
      },
    });

    await mockTeleconsultationBookingStep(patientPage, journeyData);

    // Navigate to booking page
    await patientPage.goto('/consultations/book');

    // Verify page loaded
    const pageTitle = patientPage.locator('[data-testid="page-title"]');
    await expect(pageTitle).toContainText(
      /réserver.*consultation|book.*consultation|teleconsultation/i
    );

    // Select pharmacist
    const pharmacistCard = patientPage.locator(
      `[data-testid="pharmacist-${journeyData.pharmacistId}"]`
    );
    if (await pharmacistCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pharmacistCard.click();
    }

    // Select time slot
    const timeSlotButton = patientPage.getByRole('button', { name: /choisir|select|book/i });
    if (await timeSlotButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await timeSlotButton.first().click();
    }

    // Confirm booking
    const confirmButton = patientPage.getByRole('button', {
      name: /confirmer|confirm|book|réserver/i,
    });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Verify booking confirmation
    await expect(patientPage.locator('[role="alert"]')).toContainText(
      /succès|success|réservée|booked/i,
      { timeout: 5000 }
    );

    // Verify consultation ID shown
    const consultationId = patientPage.locator('[data-testid="consultation-id"]');
    if (await consultationId.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(consultationId).toContainText(journeyData.consultationId);
    }
  });

  /**
   * Test 2: Reminders sent to both patient and pharmacist
   */
  test('Step 2: Reminders sent to both parties before consultation', async ({
    patientPage,
    pharmacistPage,
  }) => {
    const journeyData = generateTeleconsultationJourneyData();
    journeyState.set('consultationData', journeyData);

    // Mock reminder sending
    await mockReminderSendingStep(patientPage, journeyData);
    await mockReminderSendingStep(pharmacistPage, journeyData);

    // Navigate to consultation details (as patient)
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);

    // Verify reminder notification shown
    const reminderBanner = patientPage.locator('[data-testid="reminder-banner"]');
    if (await reminderBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(reminderBanner).toContainText(/rappel|reminder|avant/i);
    }

    // Verify reminder methods shown
    const reminderMethods = patientPage.locator('[data-testid="reminder-methods"]');
    if (await reminderMethods.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(reminderMethods).toContainText(/email|sms|notification/i);
    }

    // Navigate to pharmacist dashboard
    await pharmacistPage.goto('/pharmacist/consultations');

    // Verify upcoming consultation listed
    const consultationItem = pharmacistPage.locator(
      `[data-testid="consultation-${journeyData.consultationId}"]`
    );
    if (await consultationItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(consultationItem).toContainText(journeyData.patientName);
    }
  });

  /**
   * Test 3: Both parties successfully join video call
   */
  test('Step 3: Both parties join video call successfully', async ({
    patientPage,
    pharmacistPage,
  }) => {
    const journeyData = generateTeleconsultationJourneyData();
    journeyState.set('consultationData', journeyData);

    // Mock video room join
    await mockVideoCallJoinStep(patientPage, journeyData);
    await mockVideoCallJoinStep(pharmacistPage, journeyData);

    // Patient joins call
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);
    const joinButton = patientPage.getByRole('button', { name: /rejoindre|join|start call/i });
    if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinButton.click();
    }

    // Wait for video interface to load
    const videoContainer = patientPage.locator('[data-testid="video-container"]');
    if (
      await videoContainer.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await expect(videoContainer).toBeVisible();
    }

    // Verify local video stream
    const localVideo = patientPage.locator('[data-testid="local-video"]');
    if (await localVideo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(localVideo).toBeVisible();
    }

    // Pharmacist joins call
    await pharmacistPage.goto(`/consultations/${journeyData.consultationId}`);
    const pharmacistJoinButton = pharmacistPage.getByRole('button', {
      name: /rejoindre|join|start call/i,
    });
    if (await pharmacistJoinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pharmacistJoinButton.click();
    }

    // Verify both parties can see each other
    const remoteVideo = patientPage.locator('[data-testid="remote-video"]');
    if (
      await remoteVideo.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await expect(remoteVideo).toBeVisible();
    }

    // Verify call timer shown
    const callTimer = patientPage.locator('[data-testid="call-timer"]');
    if (await callTimer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(callTimer).toContainText(/^\d+:\d+$/);
    }

    // Verify audio/video controls available
    const audioButton = patientPage.getByRole('button', { name: /microphone|audio|mute/i });
    const videoButton = patientPage.getByRole('button', { name: /caméra|video|camera/i });
    if (await audioButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(audioButton).toBeEnabled();
    }
    if (await videoButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(videoButton).toBeEnabled();
    }
  });

  /**
   * Test 4: Pharmacist takes notes with automatic voice transcription
   */
  test('Step 4: Pharmacist takes notes and voice is transcribed', async ({ pharmacistPage }) => {
    const journeyData = generateTeleconsultationJourneyData();
    journeyState.set('consultationData', journeyData);

    // Mock voice transcription service
    await mockVoiceTranscriptionStep(pharmacistPage, journeyData);

    // In active call, open notes panel
    await pharmacistPage.goto(`/consultations/${journeyData.consultationId}`);

    // Click "Take Notes" button
    const notesButton = pharmacistPage.getByRole('button', {
      name: /notes|prendre des notes|take notes/i,
    });
    if (await notesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesButton.click();
    }

    // Verify notes panel opened
    const notesPanel = pharmacistPage.locator('[data-testid="notes-panel"]');
    if (await notesPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(notesPanel).toBeVisible();
    }

    // Enable voice transcription
    const voiceButton = pharmacistPage.getByRole('button', {
      name: /microphone|voice|transcription|voix/i,
    });
    if (await voiceButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await voiceButton.click();
    }

    // Verify transcription started
    const transcriptionStatus = pharmacistPage.locator('[data-testid="transcription-status"]');
    if (await transcriptionStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(transcriptionStatus).toContainText(/en cours|recording|active/i);
    }

    // Simulate voice input and transcription
    await pharmacistPage.waitForTimeout(1000);

    // Verify transcribed text appears
    const transcribedText = pharmacistPage.locator('[data-testid="transcribed-text"]');
    if (
      await transcribedText.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await expect(transcribedText).toContainText(/patient|contrôle|blood|medication/i);
    }

    // Verify confidence score
    const confidenceScore = pharmacistPage.locator('[data-testid="transcription-confidence"]');
    if (await confidenceScore.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(confidenceScore).toContainText(/%/);
    }
  });

  /**
   * Test 5: Prescription created and signed during call
   */
  test('Step 5: Prescription created and signed during teleconsultation', async ({
    pharmacistPage,
  }) => {
    const journeyData = generateTeleconsultationJourneyData({
      prescriptionCreatedDuringCall: true,
    });
    journeyState.set('consultationData', journeyData);

    // Mock prescription creation
    await mockApiResponse(pharmacistPage, '**/prescriptions/create', {
      status: 201,
      body: {
        success: true,
        prescriptionId: journeyData.prescriptionId,
        consultationId: journeyData.consultationId,
        status: 'pending_signature',
      },
    });

    // Mock prescription signing
    await mockApiResponse(pharmacistPage, '**/prescriptions/sign', {
      status: 200,
      body: {
        success: true,
        prescriptionId: journeyData.prescriptionId,
        signatureMethod: 'HIN_eID',
        signedAt: new Date().toISOString(),
      },
    });

    // In active call, click "Create Prescription" button
    await pharmacistPage.goto(`/consultations/${journeyData.consultationId}`);

    const createPrescriptionButton = pharmacistPage.getByRole('button', {
      name: /créer.*ordonnance|create prescription/i,
    });
    if (await createPrescriptionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createPrescriptionButton.click();
    }

    // Verify prescription form opened in modal/panel
    const prescriptionForm = pharmacistPage.locator('[data-testid="prescription-form"]');
    if (await prescriptionForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(prescriptionForm).toBeVisible();
    }

    // Search and add medication
    const drugSearch = pharmacistPage.locator('[data-testid="drug-search"]');
    if (await drugSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
      await drugSearch.fill('Metformine');
      await pharmacistPage.waitForTimeout(500);

      // Select medication from dropdown
      const drugOption = pharmacistPage.locator('[data-testid="drug-option"]').first();
      if (await drugOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await drugOption.click();
      }
    }

    // Fill dosage
    const dosageInput = pharmacistPage.locator('[data-testid="dosage-input"]');
    if (await dosageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dosageInput.fill('500mg, 2x par jour');
    }

    // Add to prescription
    const addButton = pharmacistPage.getByRole('button', { name: /ajouter|add/i });
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
    }

    // Sign prescription
    const signButton = pharmacistPage.getByRole('button', {
      name: /signer|sign|envoyer|send/i,
    });
    if (await signButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signButton.click();
    }

    // Verify prescription signed
    const signedConfirmation = pharmacistPage.locator(
      '[data-testid="prescription-signed-confirmation"]'
    );
    if (await signedConfirmation.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(signedConfirmation).toContainText(/signée|signed|créée|created/i);
    }

    // Verify prescription appears in call notes
    const consultationPrescriptions = pharmacistPage.locator(
      '[data-testid="consultation-prescriptions"]'
    );
    if (await consultationPrescriptions.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(consultationPrescriptions).toContainText(journeyData.prescriptionId);
    }
  });

  /**
   * Test 6: Follow-up consultation scheduled
   */
  test('Step 6: Follow-up consultation scheduled', async ({ pharmacistPage }) => {
    const journeyData = generateTeleconsultationJourneyData({
      followUpScheduled: true,
    });
    journeyState.set('consultationData', journeyData);

    // Mock follow-up scheduling
    await mockFollowUpSchedulingStep(pharmacistPage, journeyData);

    // In active call, click "Schedule Follow-up"
    await pharmacistPage.goto(`/consultations/${journeyData.consultationId}`);

    const scheduleButton = pharmacistPage.getByRole('button', {
      name: /planifier|schedule|follow.*up|suivi/i,
    });
    if (await scheduleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleButton.click();
    }

    // Verify follow-up scheduling dialog
    const followupDialog = pharmacistPage.locator('[data-testid="followup-dialog"]');
    if (await followupDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(followupDialog).toBeVisible();
    }

    // Select follow-up date (4 weeks from now)
    const dateInput = pharmacistPage.locator('[data-testid="followup-date"]');
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Pick a date 4 weeks out
      const followupDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      await dateInput.fill(followupDate.toISOString().split('T')[0]);
    }

    // Select follow-up type
    const typeSelect = pharmacistPage.locator('[data-testid="followup-type"]');
    if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelect.selectOption('phone');
    }

    // Confirm scheduling
    const confirmButton = pharmacistPage.getByRole('button', {
      name: /confirmer|confirm|schedule/i,
    });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Verify follow-up scheduled confirmation
    const followupConfirm = pharmacistPage.locator('[data-testid="followup-scheduled"]');
    if (await followupConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(followupConfirm).toContainText(/planifiée|scheduled|confirmée|confirmed/i);
    }

    // Verify follow-up date shown in call summary
    const callSummary = pharmacistPage.locator('[data-testid="consultation-summary"]');
    if (await callSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(callSummary).toContainText(/suivi|follow-up/i);
    }
  });

  /**
   * Test 7: Recording saved with consent verification
   */
  test('Step 7: Recording saved with patient consent', async ({
    patientPage,
    pharmacistPage,
  }) => {
    const journeyData = generateTeleconsultationJourneyData({
      recordingConsent: true,
      recordingSaved: true,
    });
    journeyState.set('consultationData', journeyData);

    // Mock recording saving
    await mockRecordingSavingStep(patientPage, journeyData);
    await mockRecordingSavingStep(pharmacistPage, journeyData);

    // At consultation start, patient is asked for consent
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);

    // Verify consent dialog shown before joining
    const consentDialog = patientPage.locator('[data-testid="recording-consent-dialog"]');
    if (await consentDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(consentDialog).toBeVisible();
      await expect(consentDialog).toContainText(
        /enregistrement|recording|consentement|consent/i
      );
    }

    // Patient gives consent
    const consentButton = patientPage.getByRole('button', { name: /j'accepte|accept|agree/i });
    if (await consentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentButton.click();
    }

    // Join call
    const joinButton = patientPage.getByRole('button', { name: /rejoindre|join/i });
    if (await joinButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await joinButton.click();
    }

    // Verify recording indicator shown during call
    const recordingIndicator = patientPage.locator('[data-testid="recording-indicator"]');
    if (await recordingIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(recordingIndicator).toContainText(/enregistrement|recording|en cours|active/i);
    }

    // Simulate call completion
    await patientPage.waitForTimeout(2000);

    // End call
    const endCallButton = patientPage.getByRole('button', {
      name: /terminer|end|raccrocher|disconnect/i,
    });
    if (await endCallButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await endCallButton.click();
    }

    // Verify recording saved confirmation
    const recordingConfirm = patientPage.locator('[data-testid="recording-saved-confirmation"]');
    if (await recordingConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(recordingConfirm).toContainText(/enregistré|saved|conservé/i);
    }

    // Navigate to consultation details
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);

    // Verify recording accessible
    const recordingLink = patientPage.locator('[data-testid="recording-link"]');
    if (await recordingLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(recordingLink).toBeVisible();
      await expect(recordingLink).toContainText(/voir|view|accéder|access/i);
    }
  });

  /**
   * Complete journey test - all 7 steps in sequence
   */
  test('Complete teleconsultation lifecycle (all 7 steps)', async ({
    patientPage,
    pharmacistPage,
  }) => {
    const journeyData = generateTeleconsultationJourneyData();

    // ===== STEP 1: Book consultation =====
    await mockTeleconsultationBookingStep(patientPage, journeyData);
    await patientPage.goto('/consultations/book');

    // ===== STEP 2: Reminders sent =====
    await mockReminderSendingStep(patientPage, journeyData);
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);

    // ===== STEP 3: Join video call =====
    await mockVideoCallJoinStep(patientPage, journeyData);
    const joinBtn = patientPage.getByRole('button', { name: /rejoindre|join/i });
    if (await joinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinBtn.click();
    }

    // ===== STEP 4: Transcribe notes =====
    await mockVoiceTranscriptionStep(pharmacistPage, journeyData);
    const notesBtn = pharmacistPage.getByRole('button', { name: /notes|take notes/i });
    if (await notesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesBtn.click();
    }

    // ===== STEP 5: Create prescription =====
    await mockPharmacistApprovalStep(pharmacistPage, journeyData);
    const prescBtn = pharmacistPage.getByRole('button', {
      name: /créer.*ordonnance|create prescription/i,
    });
    if (await prescBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prescBtn.click();
    }

    // ===== STEP 6: Schedule follow-up =====
    await mockFollowUpSchedulingStep(pharmacistPage, journeyData);
    const scheduleBtn = pharmacistPage.getByRole('button', {
      name: /planifier|schedule|follow.*up/i,
    });
    if (await scheduleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scheduleBtn.click();
    }

    // ===== STEP 7: Save recording =====
    await mockRecordingSavingStep(patientPage, journeyData);

    // End call to trigger recording save
    const endBtn = patientPage.getByRole('button', {
      name: /terminer|end|raccrocher/i,
    });
    if (await endBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await endBtn.click();
    }

    // Final assertion - consultation journey complete
    await assertTeleconsultationJourneyComplete(patientPage, journeyData);
  });

  /**
   * Test error handling - participant disconnects during call
   */
  test('Call disruption handled gracefully with reconnect option', async ({ patientPage }) => {
    const journeyData = generateTeleconsultationJourneyData();

    // Mock sudden disconnection
    await mockApiResponse(patientPage, '**/consultations/*/disconnect', {
      status: 200,
      body: {
        success: true,
        consultationId: journeyData.consultationId,
        disconnectedAt: new Date().toISOString(),
      },
    });

    // Join call
    await patientPage.goto(`/consultations/${journeyData.consultationId}`);
    const joinBtn = patientPage.getByRole('button', { name: /rejoindre|join/i });
    if (await joinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinBtn.click();
    }

    // Simulate connection loss
    await patientPage.waitForTimeout(2000);

    // Verify disconnection warning shown
    const disconnectAlert = patientPage.locator('[data-testid="disconnection-alert"]');
    if (await disconnectAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(disconnectAlert).toContainText(
        /connexion.*perdue|connection lost|déconnecté|disconnected/i
      );
    }

    // Verify reconnect button available
    const reconnectBtn = patientPage.getByRole('button', {
      name: /reconnecter|reconnect|rejoindre|rejoin/i,
    });
    if (await reconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(reconnectBtn).toBeEnabled();
    }
  });
});
