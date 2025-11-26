import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-004: Video Call Initiation - Twilio Integration
 *
 * End-to-end test for video call features including:
 * - Twilio token generation
 * - Room creation
 * - Participant joining
 * - Audio/video controls
 * - Connection quality monitoring
 * - Graceful disconnect
 */
test.describe('Video Call Initiation (E2E-004)', () => {
  test('pharmacist initiates video call with Twilio token', async ({ pharmacistPage }) => {
    // Mock Twilio token generation
    await mockApiResponse(pharmacistPage, '**/consultations/*/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_twilio_token',
        roomName: 'room_consult_001',
        roomSid: 'RM1234567890abcdef1234567890abcd',
        identity: 'pharmacist_001',
        expiresAt: new Date(Date.now() + 14400000).toISOString(), // 4 hours
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Mock consultation data
    await mockApiResponse(pharmacistPage, '**/consultations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'consult_001',
            patientName: 'Sophie Bernard',
            scheduledAt: new Date().toISOString(),
            status: 'upcoming',
            canJoin: true,
          },
        ],
      },
    });

    // Join consultation
    await consultationPage.joinConsultation('consult_001');

    // Verify video container loaded
    await consultationPage.expectVideoCallActive();

    // Verify Twilio room connected (check for video elements)
    await expect(pharmacistPage.locator('[data-testid="local-video"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(pharmacistPage.locator('[data-testid="connection-status"]')).toContainText(
      /connecté|connected/i
    );
  });

  test('patient joins video call room', async ({ page }) => {
    // Patient login
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_patient_token',
        user: {
          id: 'patient_001',
          role: 'patient',
          firstName: 'Sophie',
          lastName: 'Bernard',
        },
      },
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('patient@example.ch');
    await page.getByLabel(/mot de passe/i).fill('PatientPass123!');
    await page.getByRole('button', { name: /connexion/i }).click();

    // Mock patient's consultation
    await mockApiResponse(page, '**/consultations/my-upcoming', {
      status: 200,
      body: {
        success: true,
        consultations: [
          {
            id: 'consult_001',
            pharmacistName: 'Dr. Marie Dubois',
            scheduledAt: new Date().toISOString(),
            status: 'ready_to_join',
          },
        ],
      },
    });

    await page.goto('/teleconsultation');

    // Mock Twilio token for patient
    await mockApiResponse(page, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_patient_token',
        roomName: 'room_consult_001',
        roomSid: 'RM1234567890abcdef1234567890abcd',
        identity: 'patient_001',
        expiresAt: new Date(Date.now() + 14400000).toISOString(),
      },
    });

    // Join consultation
    await page.getByRole('button', { name: /rejoindre|join/i }).click();

    // Verify video call UI
    await expect(page.locator('[data-testid="video-container"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="local-video"]')).toBeVisible();
  });

  test('video controls - mute/unmute microphone', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Mock join
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_token',
        roomName: 'room_001',
      },
    });

    await consultationPage.joinConsultation('consult_001');
    await consultationPage.expectVideoCallActive();

    // Find microphone toggle button
    const micButton = pharmacistPage.getByRole('button', { name: /microphone|mute|unmute/i });
    await expect(micButton).toBeVisible();

    // Initially unmuted (icon shows microphone on)
    await expect(micButton).toHaveAttribute('aria-label', /unmute|microphone on/i);

    // Click to mute
    await micButton.click();

    // Verify muted state
    await expect(micButton).toHaveAttribute('aria-label', /mute|microphone off/i);
    await expect(pharmacistPage.locator('[data-testid="mic-status"]')).toContainText(/muet|muted/i);

    // Click to unmute
    await micButton.click();

    // Verify unmuted state
    await expect(micButton).toHaveAttribute('aria-label', /unmute|microphone on/i);
  });

  test('video controls - enable/disable camera', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');

    // Find camera toggle button
    const cameraButton = pharmacistPage.getByRole('button', { name: /caméra|camera|vidéo|video/i });
    await expect(cameraButton).toBeVisible();

    // Click to disable camera
    await cameraButton.click();

    // Verify camera disabled (local video hidden or shows placeholder)
    await expect(pharmacistPage.locator('[data-testid="camera-status"]')).toContainText(
      /désactivée|disabled/i
    );

    // Click to enable camera
    await cameraButton.click();

    // Verify camera enabled
    await expect(pharmacistPage.locator('[data-testid="local-video"]')).toBeVisible();
  });

  test('displays remote participant video when patient joins', async ({
    pharmacistPage,
    context,
  }) => {
    // Pharmacist in video call
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_pharmacist_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');

    // Verify only local video initially
    await expect(pharmacistPage.locator('[data-testid="local-video"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="remote-video-patient_001"]')).toBeHidden();

    // Mock participant joined event (in real scenario, Twilio would emit this)
    await pharmacistPage.evaluate(() => {
      // Simulate Twilio room participant joined event
      const event = new CustomEvent('twilioParticipantConnected', {
        detail: {
          participantId: 'patient_001',
          identity: 'Sophie Bernard',
        },
      });
      window.dispatchEvent(event);
    });

    // Verify remote video container appears
    await expect(pharmacistPage.locator('[data-testid="remote-video-patient_001"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(pharmacistPage.locator('[data-testid="participant-name"]')).toContainText(
      'Sophie Bernard'
    );
  });

  test('monitors connection quality and displays warnings', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');

    // Simulate poor connection quality event
    await pharmacistPage.evaluate(() => {
      const event = new CustomEvent('twilioQualityWarning', {
        detail: {
          level: 'poor',
          message: 'Connexion instable',
        },
      });
      window.dispatchEvent(event);
    });

    // Verify connection warning displayed
    await expect(
      pharmacistPage.locator('[data-testid="connection-quality-warning"]')
    ).toBeVisible();
    await expect(
      pharmacistPage.locator('[data-testid="connection-quality-warning"]')
    ).toContainText(/connexion instable|poor connection/i);
  });

  test('gracefully handles token expiration', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Mock initial token (expires in 1 second for testing)
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_expiring_token',
        roomName: 'room_001',
        expiresAt: new Date(Date.now() + 1000).toISOString(), // 1 second
      },
    });

    await consultationPage.joinConsultation('consult_001');

    // Wait for token expiration
    await pharmacistPage.waitForTimeout(2000);

    // Mock token refresh
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/refresh-token', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_refreshed_token',
        expiresAt: new Date(Date.now() + 14400000).toISOString(),
      },
    });

    // Verify token refreshed automatically (no disconnection)
    await expect(pharmacistPage.locator('[data-testid="connection-status"]')).toContainText(
      /connecté|connected/i
    );
  });

  test('ends video call and disconnects from room', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');
    await consultationPage.expectVideoCallActive();

    // Mock end consultation API
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/end', {
      status: 200,
      body: {
        success: true,
        duration: 1234, // seconds
        message: 'Consultation terminée',
      },
    });

    // End consultation
    await consultationPage.endConsultation();

    // Verify video container hidden
    await expect(pharmacistPage.locator('[data-testid="video-container"]')).toBeHidden();

    // Verify disconnection message
    await expect(pharmacistPage.locator('[role="alert"]')).toContainText(
      /consultation terminée|consultation ended/i
    );
  });

  test('handles network disconnection during call', async ({ pharmacistPage, context }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');

    // Simulate network disconnection
    await context.setOffline(true);

    // Wait for disconnection detection
    await pharmacistPage.waitForTimeout(2000);

    // Verify disconnection warning
    await expect(pharmacistPage.locator('[data-testid="connection-lost-warning"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="connection-lost-warning"]')).toContainText(
      /connexion perdue|connection lost/i
    );

    // Reconnect network
    await context.setOffline(false);

    // Mock reconnection
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/rejoin', {
      status: 200,
      body: { success: true, twilioToken: 'mock_reconnect_token', roomName: 'room_001' },
    });

    // Verify auto-reconnection attempt
    await expect(pharmacistPage.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="connection-status"]')).toContainText(
      /reconnexion|reconnecting/i
    );
  });

  test('switches to audio-only mode on poor connection', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: { success: true, twilioToken: 'mock_token', roomName: 'room_001' },
    });

    await consultationPage.joinConsultation('consult_001');

    // Simulate very poor connection
    await pharmacistPage.evaluate(() => {
      const event = new CustomEvent('twilioQualityWarning', {
        detail: {
          level: 'critical',
          message: 'Connexion très faible',
          suggestAudioOnly: true,
        },
      });
      window.dispatchEvent(event);
    });

    // Verify audio-only mode suggestion
    const audioOnlyPrompt = pharmacistPage.locator('[data-testid="audio-only-suggestion"]');
    await expect(audioOnlyPrompt).toBeVisible();
    await expect(audioOnlyPrompt).toContainText(/passer en audio uniquement|switch to audio only/i);

    // Accept audio-only mode
    await pharmacistPage.getByRole('button', { name: /audio uniquement|audio only/i }).click();

    // Verify video disabled, audio continues
    await expect(pharmacistPage.locator('[data-testid="audio-only-mode"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="camera-status"]')).toContainText(
      /désactivée|disabled/i
    );
  });

  test('records consultation duration for billing', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_token',
        roomName: 'room_001',
        startedAt: new Date().toISOString(),
      },
    });

    await consultationPage.joinConsultation('consult_001');

    // Wait a few seconds
    await pharmacistPage.waitForTimeout(5000);

    // Verify duration timer visible
    const durationTimer = pharmacistPage.locator('[data-testid="consultation-duration"]');
    await expect(durationTimer).toBeVisible();
    await expect(durationTimer).toContainText(/00:0[0-9]/); // Shows seconds counting

    // Mock end with duration
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/end', {
      status: 200,
      body: {
        success: true,
        duration: 5, // 5 seconds for test
        billingAmount: 0, // Billed separately
      },
    });

    await consultationPage.endConsultation();

    // Verify duration recorded
    await expect(pharmacistPage.locator('[data-testid="consultation-summary"]')).toContainText(
      /durée.*5 secondes|duration.*5 seconds/i
    );
  });

  test('verifies encryption for PHI during video call', async ({ pharmacistPage }) => {
    // This test verifies UI indicators of encryption, not actual encryption
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_token',
        roomName: 'room_001',
        encryptionEnabled: true,
        encryptionType: 'DTLS-SRTP', // WebRTC encryption
      },
    });

    await consultationPage.joinConsultation('consult_001');

    // Verify encryption indicator visible (HIPAA/GDPR requirement)
    const encryptionBadge = pharmacistPage.locator('[data-testid="encryption-indicator"]');
    await expect(encryptionBadge).toBeVisible();
    await expect(encryptionBadge).toContainText(/chiffré|encrypted/i);

    // Verify tooltip explains encryption
    await encryptionBadge.hover();
    await expect(pharmacistPage.locator('[role="tooltip"]')).toContainText(/DTLS-SRTP|end-to-end/i);
  });
});
