import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-002: Video Call Session E2E
 *
 * Tests complete video call session including:
 * - Patient and pharmacist joining video call
 * - Audio controls (mute/unmute microphone)
 * - Video controls (camera on/off)
 * - Screen sharing (if applicable)
 * - Graceful disconnect/leave call
 * - Reconnection after network issues
 */

test.describe('E2E-002: Video Call Session', () => {
  test.beforeEach(async ({ page }) => {
    // Mock active consultation
    await mockApiResponse(page, '**/consultations/*/join', {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token_12345',
        roomName: 'consultation_room_001',
        identity: 'patient_001',
      },
    });
  });

  /**
   * Test: Patient and pharmacist join video call
   */
  test('should allow patient and pharmacist to join video call', async ({ patientPage, pharmacistPage }) => {
    // Patient joins consultation
    const patientConsultation = new TeleconsultationPage(patientPage);
    await patientConsultation.goto();
    await patientConsultation.joinConsultation('consult_001');

    // Verify patient video container visible
    await expect(patientConsultation.videoContainer).toBeVisible();
    await expect(patientPage.locator('[data-testid="local-video"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="remote-video"]')).toBeVisible();

    // Pharmacist joins same consultation
    const pharmacistConsultation = new TeleconsultationPage(pharmacistPage);
    await pharmacistConsultation.goto();
    await pharmacistConsultation.joinConsultation('consult_001');

    // Verify pharmacist video container visible
    await expect(pharmacistConsultation.videoContainer).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="local-video"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="remote-video"]')).toBeVisible();
  });

  /**
   * Test: Connection status indicator
   */
  test('should display connection status indicator during call', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify connection status displayed
    await expect(patientPage.locator('[data-testid="connection-status"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="connection-status"]')).toContainText(/connecté|connected/i);
  });

  /**
   * Test: Mute/unmute microphone
   */
  test('should allow muting and unmuting microphone', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Find mute button
    const muteButton = patientPage.locator('[data-testid="mute-audio-button"]');
    await expect(muteButton).toBeVisible();

    // Verify microphone initially unmuted
    await expect(muteButton).toHaveAttribute('data-muted', 'false');

    // Mute microphone
    await muteButton.click();
    await expect(muteButton).toHaveAttribute('data-muted', 'true');
    await expect(patientPage.locator('[data-testid="muted-indicator"]')).toBeVisible();

    // Unmute microphone
    await muteButton.click();
    await expect(muteButton).toHaveAttribute('data-muted', 'false');
    await expect(patientPage.locator('[data-testid="muted-indicator"]')).not.toBeVisible();
  });

  /**
   * Test: Camera on/off toggle
   */
  test('should allow turning camera on and off', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Find video toggle button
    const videoButton = patientPage.locator('[data-testid="toggle-video-button"]');
    await expect(videoButton).toBeVisible();

    // Verify camera initially on
    await expect(videoButton).toHaveAttribute('data-video-enabled', 'true');
    await expect(patientPage.locator('[data-testid="local-video"]')).toBeVisible();

    // Turn camera off
    await videoButton.click();
    await expect(videoButton).toHaveAttribute('data-video-enabled', 'false');
    await expect(patientPage.locator('[data-testid="video-disabled-placeholder"]')).toBeVisible();

    // Turn camera back on
    await videoButton.click();
    await expect(videoButton).toHaveAttribute('data-video-enabled', 'true');
    await expect(patientPage.locator('[data-testid="local-video"]')).toBeVisible();
  });

  /**
   * Test: Audio/video quality indicators
   */
  test('should display audio and video quality indicators', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/consultations/*/quality', {
      status: 200,
      body: {
        success: true,
        audioQuality: 'good',
        videoQuality: 'excellent',
        latency: 45,
        packetLoss: 0.5,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify quality indicators visible
    await expect(patientPage.locator('[data-testid="quality-indicator"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="audio-quality"]')).toContainText(/good/i);
    await expect(patientPage.locator('[data-testid="video-quality"]')).toContainText(/excellent/i);
  });

  /**
   * Test: Speaker volume control
   */
  test('should allow adjusting speaker volume', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Find volume control
    const volumeSlider = patientPage.locator('[data-testid="volume-slider"]');
    await expect(volumeSlider).toBeVisible();

    // Adjust volume
    await volumeSlider.fill('50');
    await expect(volumeSlider).toHaveValue('50');

    // Verify volume indicator updated
    await expect(patientPage.locator('[data-testid="volume-level"]')).toContainText('50%');
  });

  /**
   * Test: Screen sharing (pharmacist shares screen)
   */
  test('should allow pharmacist to share screen', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/screen-share/start', {
      status: 200,
      body: {
        success: true,
        screenShareActive: true,
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Start screen sharing
    const shareButton = pharmacistPage.locator('[data-testid="share-screen-button"]');
    await expect(shareButton).toBeVisible();
    await shareButton.click();

    // Verify screen sharing active
    await expect(pharmacistPage.locator('[data-testid="screen-share-active"]')).toBeVisible();
    await expect(shareButton).toContainText(/stop.*sharing|arrêter.*partage/i);
  });

  /**
   * Test: Patient views pharmacist's shared screen
   */
  test('should allow patient to view pharmacist shared screen', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/consultations/*/screen-share/status', {
      status: 200,
      body: {
        success: true,
        screenShareActive: true,
        sharingParticipant: 'pharmacist_001',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify shared screen visible to patient
    await expect(patientPage.locator('[data-testid="shared-screen"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="sharing-indicator"]')).toContainText(/pharmacist.*sharing/i);
  });

  /**
   * Test: Stop screen sharing
   */
  test('should allow stopping screen share', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/screen-share/stop', {
      status: 200,
      body: {
        success: true,
        screenShareActive: false,
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Start then stop screen sharing
    const shareButton = pharmacistPage.locator('[data-testid="share-screen-button"]');
    await shareButton.click(); // Start
    await expect(pharmacistPage.locator('[data-testid="screen-share-active"]')).toBeVisible();

    await shareButton.click(); // Stop
    await expect(pharmacistPage.locator('[data-testid="screen-share-active"]')).not.toBeVisible();
  });

  /**
   * Test: Participant list visibility
   */
  test('should display list of call participants', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/participants', {
      status: 200,
      body: {
        success: true,
        participants: [
          { id: 'patient_001', name: 'Sophie Bernard', role: 'patient', status: 'connected' },
          { id: 'pharmacist_001', name: 'Dr. Claire Martin', role: 'pharmacist', status: 'connected' },
        ],
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Open participants panel
    await pharmacistPage.locator('[data-testid="participants-button"]').click();

    // Verify participants listed
    await expect(pharmacistPage.locator('[data-testid="participant-patient_001"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="participant-pharmacist_001"]')).toBeVisible();
    await expect(pharmacistPage.getByText('Dr. Claire Martin')).toBeVisible();
  });

  /**
   * Test: Graceful disconnect/leave call
   */
  test('should allow gracefully leaving video call', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/consultations/*/leave', {
      status: 200,
      body: {
        success: true,
        leftAt: new Date().toISOString(),
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify in call
    await expect(consultationPage.videoContainer).toBeVisible();

    // Leave call
    await consultationPage.endCallButton.click();
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify call ended
    await expect(consultationPage.videoContainer).not.toBeVisible();
    await expect(patientPage.locator('[data-testid="call-ended-message"]')).toBeVisible();
  });

  /**
   * Test: End call confirmation dialog
   */
  test('should show confirmation dialog before ending call', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Click end call button
    await consultationPage.endCallButton.click();

    // Verify confirmation dialog appears
    await expect(patientPage.locator('[data-testid="end-call-confirmation"]')).toBeVisible();
    await expect(patientPage.getByText(/êtes-vous sûr|are you sure/i)).toBeVisible();

    // Verify cancel option available
    await expect(patientPage.getByRole('button', { name: /annuler|cancel/i })).toBeVisible();
  });

  /**
   * Test: Network quality warning
   */
  test('should display warning on poor network quality', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/consultations/*/quality', {
      status: 200,
      body: {
        success: true,
        audioQuality: 'poor',
        videoQuality: 'poor',
        latency: 450,
        packetLoss: 12.5,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify poor quality warning displayed
    await expect(patientPage.locator('[data-testid="quality-warning"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="quality-warning"]')).toContainText(/poor.*connection|connexion.*faible/i);
  });

  /**
   * Test: Reconnection after network interruption
   */
  test('should automatically reconnect after brief network interruption', async ({ patientPage }) => {
    // Mock initial connection
    await mockApiResponse(patientPage, '**/consultations/*/reconnect', {
      status: 200,
      body: {
        success: true,
        reconnected: true,
        token: 'mock_twilio_token_reconnect',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Simulate network disconnection
    await patientPage.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Verify reconnecting indicator
    await expect(patientPage.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="reconnecting-indicator"]')).toContainText(/reconnecting|reconnexion/i);

    // Simulate network reconnection
    await patientPage.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Wait for automatic reconnection
    await expect(patientPage.locator('[data-testid="connection-status"]')).toContainText(/connecté|connected/i);
    await expect(patientPage.locator('[data-testid="reconnecting-indicator"]')).not.toBeVisible();
  });

  /**
   * Test: Failed reconnection handling
   */
  test('should handle failed reconnection gracefully', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/consultations/*/reconnect', {
      status: 503,
      body: {
        success: false,
        error: 'Unable to reconnect',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Simulate network failure
    await patientPage.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Wait for failed reconnection
    await patientPage.waitForTimeout(5000);

    // Verify error message displayed
    await expect(patientPage.locator('[data-testid="reconnect-failed"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="reconnect-failed"]')).toContainText(/unable.*reconnect|impossible.*reconnecter/i);

    // Verify manual retry button available
    await expect(patientPage.getByRole('button', { name: /réessayer|retry/i })).toBeVisible();
  });

  /**
   * Test: Call duration display
   */
  test('should display call duration timer', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify duration timer visible
    const durationTimer = patientPage.locator('[data-testid="call-duration"]');
    await expect(durationTimer).toBeVisible();

    // Verify timer starts at 00:00
    await expect(durationTimer).toContainText(/00:0[0-9]/);

    // Wait and verify timer increments
    await patientPage.waitForTimeout(2000);
    await expect(durationTimer).toContainText(/00:(0[2-9]|1[0-9])/); // At least 00:02
  });

  /**
   * Test: Background blur/virtual background
   */
  test('should allow enabling background blur', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Open video settings
    await patientPage.locator('[data-testid="video-settings-button"]').click();

    // Enable background blur
    const blurToggle = patientPage.locator('[data-testid="background-blur-toggle"]');
    await expect(blurToggle).toBeVisible();
    await blurToggle.check();

    // Verify blur enabled
    await expect(patientPage.locator('[data-testid="blur-enabled-indicator"]')).toBeVisible();
  });

  /**
   * Test: Full screen mode toggle
   */
  test('should allow toggling full screen mode', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Find fullscreen button
    const fullscreenButton = patientPage.locator('[data-testid="fullscreen-button"]');
    await expect(fullscreenButton).toBeVisible();

    // Enter fullscreen
    await fullscreenButton.click();

    // Verify fullscreen active (check for fullscreen exit button)
    await expect(patientPage.locator('[data-testid="exit-fullscreen-button"]')).toBeVisible();
  });

  /**
   * Test: Picture-in-picture mode
   */
  test('should support picture-in-picture mode', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Enable picture-in-picture
    const pipButton = patientPage.locator('[data-testid="pip-button"]');
    await expect(pipButton).toBeVisible();
    await pipButton.click();

    // Verify PiP mode indicator
    await expect(patientPage.locator('[data-testid="pip-active"]')).toBeVisible();
  });

  /**
   * Test: Emergency disconnect (network failure during call)
   */
  test('should handle emergency disconnect during active call', async ({ patientPage }) => {
    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify call active
    await expect(consultationPage.videoContainer).toBeVisible();

    // Simulate sudden network failure
    await patientPage.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Verify disconnection handling
    await expect(patientPage.locator('[data-testid="disconnected-indicator"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="reconnecting-indicator"]')).toBeVisible();

    // Verify call state preserved for reconnection
    await expect(patientPage.locator('[data-testid="call-state-preserved"]')).toBeVisible();
  });
});
