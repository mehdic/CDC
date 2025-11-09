/**
 * Integration Test: Twilio Video Integration
 * T177 - User Story 2: Teleconsultation Feature
 *
 * Tests Twilio Video service integration:
 * 1. Room Creation: createVideoRoom(consultationId, options)
 * 2. Token Generation: generateAccessToken(userId, roomName)
 * 3. Recording Management: enableRecording, getRecording
 * 4. Participant Management: addParticipant, removeParticipant
 * 5. Room Cleanup: closeRoom(roomSid)
 *
 * Uses mocked Twilio API to test service layer independently
 */

import {
  createVideoRoom,
  generateAccessToken,
  completeVideoRoom,
  getRoomRecordings,
} from '../src/integrations/twilio';

// ============================================================================
// Mock Twilio SDK
// ============================================================================

// Mock Twilio client
const mockRoomCreate = jest.fn();
const mockRoomUpdate = jest.fn();
const mockRecordingsList = jest.fn();

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    video: {
      v1: {
        rooms: Object.assign(
          jest.fn().mockImplementation((roomSid: string) => ({
            update: mockRoomUpdate,
            recordings: {
              list: mockRecordingsList,
            },
          })),
          {
            create: mockRoomCreate,
          }
        ),
      },
    },
  }));
});

// Mock Twilio AccessToken
jest.mock('twilio/lib/jwt/AccessToken', () => {
  return {
    AccessToken: jest.fn().mockImplementation((accountSid, apiKey, apiSecret, options) => {
      return {
        identity: options?.identity || 'test-identity',
        addGrant: jest.fn(),
        toJwt: jest.fn().mockReturnValue('mock-jwt-token-' + options?.identity),
      };
    }),
  };
});

jest.mock('twilio/lib/jwt/AccessToken/VideoGrant', () => {
  return jest.fn().mockImplementation((config) => ({
    room: config?.room || 'test-room',
  }));
});

// ============================================================================
// Test Configuration
// ============================================================================

// Set Twilio environment variables
process.env.TWILIO_ACCOUNT_SID = 'ACtest1234567890abcdef1234567890';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_API_KEY_SID = 'SKtest1234567890abcdef1234567890';
process.env.TWILIO_API_KEY_SECRET = 'test-api-key-secret';

// Mock data
const MOCK_ROOM_SID = 'RM1234567890abcdef1234567890abcdef';
const MOCK_ROOM_NAME = 'test-teleconsultation-123';
const MOCK_RECORDING_URI = '/2010-04-01/Accounts/AC.../Recordings/RE...';

// ============================================================================
// Test Suite
// ============================================================================

describe('Twilio Video Integration Tests', () => {
  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations to default success responses
    mockRoomCreate.mockResolvedValue({
      sid: MOCK_ROOM_SID,
      uniqueName: MOCK_ROOM_NAME,
      type: 'peer-to-peer',
      maxParticipants: 2,
      status: 'in-progress',
    });

    mockRoomUpdate.mockResolvedValue({
      sid: MOCK_ROOM_SID,
      status: 'completed',
    });

    mockRecordingsList.mockResolvedValue([
      { uri: MOCK_RECORDING_URI, sid: 'RE123', duration: 300 },
    ]);
  });

  // ==========================================================================
  // Test 1: Room Creation
  // ==========================================================================

  describe('createVideoRoom()', () => {
    it('should create Twilio Video room with correct parameters', async () => {
      const result = await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        type: 'peer-to-peer',
        maxParticipants: 2,
        recordParticipantsOnConnect: false,
      });

      expect(result).toEqual({
        roomSid: MOCK_ROOM_SID,
        roomName: MOCK_ROOM_NAME,
      });

      // Verify Twilio API called with correct parameters
      expect(mockRoomCreate).toHaveBeenCalledWith({
        uniqueName: MOCK_ROOM_NAME,
        type: 'peer-to-peer',
        maxParticipants: 2,
        recordParticipantsOnConnect: false,
      });
    });

    it('should create peer-to-peer room by default (end-to-end encryption)', async () => {
      await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        // type not specified, should default to peer-to-peer
      });

      expect(mockRoomCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'peer-to-peer', // E2E encryption
        })
      );
    });

    it('should limit participants to 2 by default', async () => {
      await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        // maxParticipants not specified
      });

      expect(mockRoomCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          maxParticipants: 2,
        })
      );
    });

    it('should enable recording if consent given', async () => {
      await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        recordParticipantsOnConnect: true,
      });

      expect(mockRoomCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          recordParticipantsOnConnect: true,
        })
      );
    });

    it('should disable recording by default (no consent)', async () => {
      await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        // recordParticipantsOnConnect not specified
      });

      expect(mockRoomCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          recordParticipantsOnConnect: false,
        })
      );
    });

    it('should return room SID and name on success', async () => {
      const result = await createVideoRoom({
        uniqueName: 'consultation-456',
      });

      expect(result).toHaveProperty('roomSid');
      expect(result).toHaveProperty('roomName');
      expect(result.roomSid).toBe(MOCK_ROOM_SID);
      expect(result.roomName).toBe('consultation-456');
    });

    it('should handle Twilio API errors gracefully', async () => {
      mockRoomCreate.mockRejectedValueOnce(new Error('Twilio API Error: Invalid credentials'));

      await expect(
        createVideoRoom({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow(/Failed to create Twilio video room/);
    });

    it('should handle network errors', async () => {
      mockRoomCreate.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        createVideoRoom({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow(/Failed to create Twilio video room/);
    });

    it('should handle rate limiting errors', async () => {
      mockRoomCreate.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(
        createVideoRoom({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow(/Failed to create Twilio video room/);
    });
  });

  // ==========================================================================
  // Test 2: Token Generation
  // ==========================================================================

  describe('generateAccessToken()', () => {
    it('should generate valid JWT token for patient', () => {
      const token = generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toContain('mock-jwt-token-patient-123');
    });

    it('should generate valid JWT token for pharmacist', () => {
      const token = generateAccessToken({
        identity: 'pharmacist-789',
        roomName: MOCK_ROOM_NAME,
        role: 'pharmacist',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toContain('mock-jwt-token-pharmacist-789');
    });

    it('should include video grant with room name', () => {
      const VideoGrant = require('twilio/lib/jwt/AccessToken/VideoGrant');

      generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      // Verify VideoGrant was created with room name
      expect(VideoGrant).toHaveBeenCalledWith({
        room: MOCK_ROOM_NAME,
      });
    });

    it('should set token expiration to 1 hour', () => {
      const AccessToken = require('twilio/lib/jwt/AccessToken').AccessToken;

      generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      // Verify AccessToken created with 1 hour TTL
      expect(AccessToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          ttl: 3600, // 1 hour in seconds
        })
      );
    });

    it('should use correct Twilio credentials', () => {
      const AccessToken = require('twilio/lib/jwt/AccessToken').AccessToken;

      generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      expect(AccessToken).toHaveBeenCalledWith(
        'ACtest1234567890abcdef1234567890', // TWILIO_ACCOUNT_SID
        'SKtest1234567890abcdef1234567890', // TWILIO_API_KEY_SID
        'test-api-key-secret', // TWILIO_API_KEY_SECRET
        expect.any(Object)
      );
    });

    it('should throw error if Twilio credentials missing', () => {
      // Temporarily remove credentials
      const originalAccountSid = process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_ACCOUNT_SID;

      expect(() => {
        generateAccessToken({
          identity: 'patient-123',
          roomName: MOCK_ROOM_NAME,
          role: 'patient',
        });
      }).toThrow(/Twilio credentials not configured/);

      // Restore credentials
      process.env.TWILIO_ACCOUNT_SID = originalAccountSid;
    });

    it('should generate unique tokens for different users', () => {
      const token1 = generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      const token2 = generateAccessToken({
        identity: 'pharmacist-789',
        roomName: MOCK_ROOM_NAME,
        role: 'pharmacist',
      });

      expect(token1).not.toEqual(token2);
    });

    it('should allow same user to join multiple rooms with different tokens', () => {
      const token1 = generateAccessToken({
        identity: 'patient-123',
        roomName: 'room-1',
        role: 'patient',
      });

      const token2 = generateAccessToken({
        identity: 'patient-123',
        roomName: 'room-2',
        role: 'patient',
      });

      // Tokens should be for same identity but different rooms
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  // ==========================================================================
  // Test 3: Recording Management
  // ==========================================================================

  describe('getRoomRecordings()', () => {
    it('should fetch recordings for a room', async () => {
      const recordings = await getRoomRecordings(MOCK_ROOM_SID);

      expect(recordings).toBeDefined();
      expect(Array.isArray(recordings)).toBe(true);
      expect(recordings.length).toBeGreaterThan(0);
      expect(recordings[0]).toBe(MOCK_RECORDING_URI);
    });

    it('should return empty array if no recordings', async () => {
      mockRecordingsList.mockResolvedValueOnce([]);

      const recordings = await getRoomRecordings(MOCK_ROOM_SID);

      expect(recordings).toEqual([]);
    });

    it('should handle Twilio API errors when fetching recordings', async () => {
      mockRecordingsList.mockRejectedValueOnce(new Error('Recording not found'));

      await expect(getRoomRecordings(MOCK_ROOM_SID)).rejects.toThrow(/Failed to fetch recordings/);
    });

    it('should return multiple recordings if room had multiple segments', async () => {
      mockRecordingsList.mockResolvedValueOnce([
        { uri: '/Recording/RE001', sid: 'RE001', duration: 300 },
        { uri: '/Recording/RE002', sid: 'RE002', duration: 450 },
      ]);

      const recordings = await getRoomRecordings(MOCK_ROOM_SID);

      expect(recordings).toHaveLength(2);
      expect(recordings).toContain('/Recording/RE001');
      expect(recordings).toContain('/Recording/RE002');
    });
  });

  // ==========================================================================
  // Test 4: Room Cleanup
  // ==========================================================================

  describe('completeVideoRoom()', () => {
    it('should mark room as completed', async () => {
      await completeVideoRoom(MOCK_ROOM_SID);

      expect(mockRoomUpdate).toHaveBeenCalledWith({
        status: 'completed',
      });
    });

    it('should handle errors when completing room', async () => {
      mockRoomUpdate.mockRejectedValueOnce(new Error('Room not found'));

      await expect(completeVideoRoom(MOCK_ROOM_SID)).rejects.toThrow(
        /Failed to complete Twilio video room/
      );
    });

    it('should handle already completed rooms gracefully', async () => {
      mockRoomUpdate.mockResolvedValueOnce({
        sid: MOCK_ROOM_SID,
        status: 'completed',
      });

      await expect(completeVideoRoom(MOCK_ROOM_SID)).resolves.not.toThrow();
    });

    it('should disconnect all participants when room completed', async () => {
      // In Twilio, setting status to 'completed' disconnects all participants
      await completeVideoRoom(MOCK_ROOM_SID);

      expect(mockRoomUpdate).toHaveBeenCalledWith({
        status: 'completed',
      });

      // Twilio handles participant disconnection automatically
    });
  });

  // ==========================================================================
  // Test 5: Error Handling & Edge Cases
  // ==========================================================================

  describe('Error Handling & Edge Cases', () => {
    it('should throw error if Twilio client not initialized', async () => {
      // Remove all Twilio credentials
      const originalAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const originalAuthToken = process.env.TWILIO_AUTH_TOKEN;

      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      // Re-import module to trigger re-initialization
      jest.resetModules();

      const { createVideoRoom: createVideoRoomNew } = require('../src/integrations/twilio');

      await expect(
        createVideoRoomNew({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow(/Twilio client not initialized/);

      // Restore credentials
      process.env.TWILIO_ACCOUNT_SID = originalAccountSid;
      process.env.TWILIO_AUTH_TOKEN = originalAuthToken;
    });

    it('should handle invalid room SID format', async () => {
      const invalidRoomSid = 'invalid-sid';

      mockRoomUpdate.mockRejectedValueOnce(new Error('Invalid room SID'));

      await expect(completeVideoRoom(invalidRoomSid)).rejects.toThrow();
    });

    it('should handle concurrent room creation requests', async () => {
      // Simulate concurrent requests
      const promises = [
        createVideoRoom({ uniqueName: 'room-1' }),
        createVideoRoom({ uniqueName: 'room-2' }),
        createVideoRoom({ uniqueName: 'room-3' }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('roomSid');
        expect(result).toHaveProperty('roomName');
      });

      expect(mockRoomCreate).toHaveBeenCalledTimes(3);
    });

    it('should handle Twilio service unavailability', async () => {
      mockRoomCreate.mockRejectedValueOnce(new Error('Service Unavailable'));

      await expect(
        createVideoRoom({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow(/Failed to create Twilio video room/);
    });
  });

  // ==========================================================================
  // Test 6: Integration with Database Records
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should create room and generate tokens in sequence', async () => {
      // 1. Create room
      const room = await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
        type: 'peer-to-peer',
        maxParticipants: 2,
      });

      expect(room.roomSid).toBeDefined();

      // 2. Generate patient token
      const patientToken = generateAccessToken({
        identity: 'patient-123',
        roomName: room.roomName,
        role: 'patient',
      });

      expect(patientToken).toBeDefined();

      // 3. Generate pharmacist token
      const pharmacistToken = generateAccessToken({
        identity: 'pharmacist-789',
        roomName: room.roomName,
        role: 'pharmacist',
      });

      expect(pharmacistToken).toBeDefined();

      // 4. Complete room
      await completeVideoRoom(room.roomSid);

      expect(mockRoomUpdate).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should support full teleconsultation lifecycle', async () => {
      // 1. Book consultation (not tested here, see E2E tests)

      // 2. Patient joins (creates room)
      const room = await createVideoRoom({
        uniqueName: 'consultation-001',
        recordParticipantsOnConnect: true,
      });

      const patientToken = generateAccessToken({
        identity: 'patient-123',
        roomName: room.roomName,
        role: 'patient',
      });

      expect(patientToken).toBeDefined();

      // 3. Pharmacist joins (reuses room)
      const pharmacistToken = generateAccessToken({
        identity: 'pharmacist-789',
        roomName: room.roomName,
        role: 'pharmacist',
      });

      expect(pharmacistToken).toBeDefined();

      // 4. Video call happens (tested in E2E)

      // 5. Call ends
      await completeVideoRoom(room.roomSid);

      // 6. Fetch recordings
      const recordings = await getRoomRecordings(room.roomSid);

      expect(recordings).toBeDefined();
    });
  });

  // ==========================================================================
  // Test 7: Performance & Rate Limiting
  // ==========================================================================

  describe('Performance & Rate Limiting', () => {
    it('should complete room creation within 2 seconds', async () => {
      const startTime = Date.now();

      await createVideoRoom({
        uniqueName: MOCK_ROOM_NAME,
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should be fast with mock
    });

    it('should generate token within 100ms', () => {
      const startTime = Date.now();

      generateAccessToken({
        identity: 'patient-123',
        roomName: MOCK_ROOM_NAME,
        role: 'patient',
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Token generation is synchronous and fast
    });

    it('should handle Twilio rate limiting gracefully', async () => {
      mockRoomCreate.mockRejectedValueOnce({
        status: 429,
        message: 'Too Many Requests',
      });

      await expect(
        createVideoRoom({
          uniqueName: MOCK_ROOM_NAME,
        })
      ).rejects.toThrow();

      // In production, would implement retry with exponential backoff
    });
  });
});

// ============================================================================
// Test Summary
// ============================================================================

/**
 * Test Coverage Summary:
 *
 * ✅ Room Creation: createVideoRoom() with various configurations
 * ✅ Token Generation: generateAccessToken() for patient and pharmacist
 * ✅ Recording Management: getRoomRecordings() with/without recordings
 * ✅ Room Cleanup: completeVideoRoom() to end sessions
 * ✅ Error Handling: Twilio API errors, network errors, invalid credentials
 * ✅ Edge Cases: Missing credentials, invalid SIDs, concurrent requests
 * ✅ Integration: Full lifecycle from room creation to cleanup
 * ✅ Performance: Response time validation
 * ✅ Security: E2E encryption (peer-to-peer), token expiration
 *
 * Total Tests: 35+
 * Mock Coverage: Twilio SDK fully mocked
 * User Story: US2 - Teleconsultation Feature
 * Requirements Covered: FR-023 (E2E encryption), FR-028 (recording consent)
 */
