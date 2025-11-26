import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-003: Twilio Video Integration Test
 *
 * Tests Twilio Video API integration including:
 * - Twilio token generation for participants
 * - Room creation and configuration
 * - Participant management (add, remove)
 * - Room lifecycle (create, join, leave, destroy)
 * - Connection quality indicators
 * - Twilio error handling and fallback
 */

test.describe('E2E-003: Twilio Video Integration', () => {
  /**
   * Test: Generate Twilio token for patient
   */
  test('should generate valid Twilio token for patient participant', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/token', {
      status: 200,
      body: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_patient',
        identity: 'patient_001',
        roomName: 'consult_001_room',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Request to join consultation
    await patientPage.locator('[data-testid="consultation-consult_001"]').click();
    await consultationPage.joinButton.click();

    // Verify token generation
    const tokenResponse = await patientPage.evaluate(() => {
      return localStorage.getItem('twilio_token');
    });
    expect(tokenResponse).not.toBeNull();
  });

  /**
   * Test: Generate Twilio token for pharmacist
   */
  test('should generate valid Twilio token for pharmacist participant', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/token', {
      status: 200,
      body: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_pharmacist',
        identity: 'pharmacist_001',
        roomName: 'consult_001_room',
        role: 'moderator', // Pharmacist has moderator privileges
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Join consultation
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();
    await consultationPage.joinButton.click();

    // Verify moderator token generated
    const tokenResponse = await pharmacistPage.evaluate(() => {
      return localStorage.getItem('twilio_token');
    });
    expect(tokenResponse).not.toBeNull();
  });

  /**
   * Test: Token expiration handling
   */
  test('should handle expired Twilio token gracefully', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/token', {
      status: 401,
      body: {
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });

    await mockApiResponse(patientPage, '**/twilio/token/refresh', {
      status: 200,
      body: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_refreshed',
        identity: 'patient_001',
        roomName: 'consult_001_room',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Try to join with expired token
    await patientPage.locator('[data-testid="consultation-consult_001"]').click();
    await consultationPage.joinButton.click();

    // Verify automatic token refresh
    await expect(patientPage.locator('[data-testid="token-refreshed-indicator"]')).toBeVisible();
    await expect(consultationPage.videoContainer).toBeVisible();
  });

  /**
   * Test: Twilio room creation
   */
  test('should create Twilio room when consultation starts', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms', {
      method: 'POST',
      status: 201,
      body: {
        success: true,
        room: {
          sid: 'RM123456789abcdef',
          uniqueName: 'consult_001_room',
          status: 'in-progress',
          type: 'group',
          maxParticipants: 2,
          recordParticipantsOnConnect: false,
          videoCodecs: ['VP8'],
          mediaRegion: 'ie1', // Ireland region for EU
        },
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    // Pharmacist starts consultation (creates room)
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();
    await consultationPage.joinButton.click();

    // Verify room created
    await expect(consultationPage.videoContainer).toBeVisible();
  });

  /**
   * Test: Room configuration with recording disabled
   */
  test('should create room with recording disabled by default', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms', {
      method: 'POST',
      status: 201,
      body: {
        success: true,
        room: {
          sid: 'RM123456789abcdef',
          uniqueName: 'consult_001_room',
          recordParticipantsOnConnect: false,
        },
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();
    await consultationPage.joinButton.click();

    // Verify recording indicator not shown
    await expect(pharmacistPage.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
  });

  /**
   * Test: Optional room recording with consent
   */
  test('should enable recording only with patient consent', async ({ pharmacistPage, patientPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms/*/recording', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        recordingEnabled: true,
        consentGiven: true,
      },
    });

    const pharmacistConsultation = new TeleconsultationPage(pharmacistPage);
    await pharmacistConsultation.goto();
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();
    await pharmacistConsultation.joinButton.click();

    // Patient joins and gives consent
    const patientConsultation = new TeleconsultationPage(patientPage);
    await patientConsultation.goto();
    await patientPage.locator('[data-testid="consultation-consult_001"]').click();
    await patientConsultation.joinButton.click();

    // Patient consents to recording
    await patientPage.locator('[data-testid="recording-consent-checkbox"]').check();
    await patientPage.getByRole('button', { name: /accepter|accept/i }).click();

    // Pharmacist enables recording
    await pharmacistPage.locator('[data-testid="start-recording-button"]').click();

    // Verify recording active
    await expect(pharmacistPage.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="recording-indicator"]')).toBeVisible();
  });

  /**
   * Test: Participant joins room
   */
  test('should add participant to Twilio room on join', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/participants', {
      status: 200,
      body: {
        success: true,
        participants: [
          {
            sid: 'PA123456',
            identity: 'patient_001',
            status: 'connected',
            tracks: {
              audio: true,
              video: true,
            },
          },
          {
            sid: 'PA789012',
            identity: 'pharmacist_001',
            status: 'connected',
            tracks: {
              audio: true,
              video: true,
            },
          },
        ],
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify both participants in room
    await patientPage.locator('[data-testid="participants-button"]').click();
    await expect(patientPage.locator('[data-testid="participant-patient_001"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="participant-pharmacist_001"]')).toBeVisible();
  });

  /**
   * Test: Participant leaves room
   */
  test('should remove participant from Twilio room on leave', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/participants/*/disconnect', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        participantSid: 'PA123456',
        status: 'disconnected',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Leave room
    await consultationPage.endCallButton.click();
    await patientPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify participant disconnected
    await expect(consultationPage.videoContainer).not.toBeVisible();
  });

  /**
   * Test: Room closure when last participant leaves
   */
  test('should close Twilio room when last participant leaves', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms/*/complete', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        roomSid: 'RM123456789abcdef',
        status: 'completed',
        duration: 1245, // seconds
        endedAt: new Date().toISOString(),
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Pharmacist (last participant) leaves
    await consultationPage.endCallButton.click();
    await pharmacistPage.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify room completed
    await expect(pharmacistPage.locator('[data-testid="consultation-completed"]')).toBeVisible();
  });

  /**
   * Test: Track publication (audio/video)
   */
  test('should publish audio and video tracks to room', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/tracks/publish', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        tracks: [
          {
            kind: 'audio',
            sid: 'MT123',
            enabled: true,
          },
          {
            kind: 'video',
            sid: 'MT456',
            enabled: true,
          },
        ],
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify tracks published
    await expect(patientPage.locator('[data-testid="audio-track-published"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="video-track-published"]')).toBeVisible();
  });

  /**
   * Test: Track unpublication (disable audio/video)
   */
  test('should unpublish tracks when muted or camera off', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/tracks/unpublish', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        trackSid: 'MT123',
        unpublished: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Mute audio
    await patientPage.locator('[data-testid="mute-audio-button"]').click();

    // Verify audio track unpublished
    await expect(patientPage.locator('[data-testid="audio-track-unpublished"]')).toBeVisible();
  });

  /**
   * Test: Network quality level reporting
   */
  test('should report network quality levels via Twilio', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/network-quality', {
      status: 200,
      body: {
        success: true,
        level: 4, // Scale 0-5 (5 is best)
        audio: {
          send: 5,
          recv: 4,
        },
        video: {
          send: 4,
          recv: 4,
        },
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify network quality displayed
    await expect(patientPage.locator('[data-testid="network-quality-level"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="network-quality-level"]')).toContainText(/4|good|bien/i);
  });

  /**
   * Test: Bandwidth adaptation (automatic quality reduction)
   */
  test('should adapt video quality based on bandwidth', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/bandwidth', {
      status: 200,
      body: {
        success: true,
        maxVideoBitrate: 500, // kbps (reduced from default)
        adaptiveSimulcast: true,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Simulate poor network
    await patientPage.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('network-quality-changed', {
          detail: { level: 1 }, // Poor quality
        })
      );
    });

    // Verify quality adaptation indicator
    await expect(patientPage.locator('[data-testid="quality-adapted"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="quality-adapted"]')).toContainText(/reduced.*quality|qualité.*réduite/i);
  });

  /**
   * Test: Dominant speaker detection
   */
  test('should detect and highlight dominant speaker', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms/*/dominant-speaker', {
      status: 200,
      body: {
        success: true,
        dominantSpeaker: 'patient_001',
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Simulate patient speaking
    await pharmacistPage.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('dominant-speaker-changed', {
          detail: { identity: 'patient_001' },
        })
      );
    });

    // Verify dominant speaker highlighted
    await expect(pharmacistPage.locator('[data-testid="participant-patient_001"]')).toHaveClass(/dominant-speaker/);
  });

  /**
   * Test: Twilio error handling - Room not found
   */
  test('should handle Twilio room not found error', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/invalid_room', {
      status: 404,
      body: {
        success: false,
        error: 'Room not found',
        code: 'ROOM_NOT_FOUND',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Try to join non-existent room
    await patientPage.locator('[data-testid="consultation-invalid_consult"]').click();
    await consultationPage.joinButton.click();

    // Verify error message
    await expect(patientPage.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="error-toast"]')).toContainText(/room.*not found|salle.*introuvable/i);
  });

  /**
   * Test: Twilio error handling - Max participants reached
   */
  test('should handle max participants error', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/join', {
      status: 429,
      body: {
        success: false,
        error: 'Maximum participants reached',
        code: 'MAX_PARTICIPANTS',
        maxParticipants: 2,
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();

    // Try to join full room
    await patientPage.locator('[data-testid="consultation-full_room"]').click();
    await consultationPage.joinButton.click();

    // Verify error message
    await expect(patientPage.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="error-toast"]')).toContainText(/maximum.*participants|maximum.*participants/i);
  });

  /**
   * Test: Fallback to audio-only when video fails
   */
  test('should fallback to audio-only call when video fails', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/rooms/*/fallback-audio', {
      method: 'POST',
      status: 200,
      body: {
        success: true,
        audioOnly: true,
        reason: 'Video track failed',
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Simulate video track failure
    await patientPage.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('track-failed', {
          detail: { kind: 'video', error: 'MediaStreamError' },
        })
      );
    });

    // Verify audio-only mode
    await expect(patientPage.locator('[data-testid="audio-only-mode"]')).toBeVisible();
    await expect(patientPage.locator('[data-testid="audio-only-indicator"]')).toContainText(/audio.*only|audio.*seulement/i);
  });

  /**
   * Test: Room statistics collection
   */
  test('should collect and display room statistics', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/twilio/rooms/*/stats', {
      status: 200,
      body: {
        success: true,
        stats: {
          duration: 1245, // seconds
          participants: 2,
          bytesReceived: 45678901,
          bytesSent: 34567890,
          packetsLost: 12,
          jitter: 23,
          roundTripTime: 45,
        },
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Open call statistics
    await pharmacistPage.locator('[data-testid="call-stats-button"]').click();

    // Verify stats displayed
    await expect(pharmacistPage.locator('[data-testid="call-stats-panel"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/round.*trip.*time|temps.*aller-retour/i)).toBeVisible();
    await expect(pharmacistPage.getByText('45 ms')).toBeVisible();
  });

  /**
   * Test: Region selection for optimal performance
   */
  test('should connect to optimal Twilio media region', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/twilio/regions/nearest', {
      status: 200,
      body: {
        success: true,
        region: 'ie1', // Ireland
        latency: 23,
        regions: [
          { code: 'ie1', name: 'Ireland', latency: 23 },
          { code: 'de1', name: 'Germany', latency: 45 },
          { code: 'us1', name: 'US East', latency: 156 },
        ],
      },
    });

    const consultationPage = new TeleconsultationPage(patientPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    // Verify region selected
    await expect(patientPage.locator('[data-testid="media-region"]')).toContainText(/Ireland|ie1/i);
  });
});
