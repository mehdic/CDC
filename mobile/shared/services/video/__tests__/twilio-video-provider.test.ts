/**
 * TwilioVideoProvider Tests
 * Task: T3-008
 */

// Mock the Twilio SDK BEFORE importing
const mockTwilioSDK = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  setLocalVideoEnabled: jest.fn(),
  setLocalAudioEnabled: jest.fn(),
  flipCamera: jest.fn(),
  setAudioDevice: jest.fn(),
  getStats: jest.fn(),
  setOnRoomDidConnect: jest.fn(),
  setOnRoomDidDisconnect: jest.fn(),
  setOnRoomDidFailToConnect: jest.fn(),
  setOnParticipantAddedVideoTrack: jest.fn(),
  setOnParticipantRemovedVideoTrack: jest.fn(),
  setOnParticipantEnabledVideoTrack: jest.fn(),
  setOnParticipantDisabledVideoTrack: jest.fn(),
  setOnParticipantEnabledAudioTrack: jest.fn(),
  setOnParticipantDisabledAudioTrack: jest.fn(),
  setOnNetworkQualityLevelsChanged: jest.fn(),
  setOnDominantSpeakerChanged: jest.fn(),
  setOnReconnecting: jest.fn(),
  setOnReconnected: jest.fn(),
};

// Mock react-native-permissions
const mockPermissions = {
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  request: jest.fn(),
};

// Set up mocks BEFORE importing the module
jest.mock('react-native-twilio-video-webrtc', () => ({
  TwilioVideo: mockTwilioSDK,
}));

jest.mock('react-native-permissions', () => mockPermissions);

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// NOW import after mocks are set up
import { TwilioVideoProvider } from '../twilio-video-provider';
import {
  VideoErrorType,
  NetworkQuality,
  AudioDevice,
} from '../types';

describe('TwilioVideoProvider', () => {
  let provider: TwilioVideoProvider;
  let mockCallbacks: any;

  // Event handler references
  let onRoomDidConnect: (event: any) => void;
  let onRoomDidDisconnect: (event: any) => void;
  let onRoomDidFailToConnect: (event: any) => void;
  let onParticipantAddedVideoTrack: (event: any) => void;
  let onParticipantRemovedVideoTrack: (event: any) => void;
  let onNetworkQualityLevelsChanged: (event: any) => void;
  let onDominantSpeakerChanged: (event: any) => void;
  let onReconnecting: (event: any) => void;
  let onReconnected: (event: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    // Capture event handlers when they're registered
    mockTwilioSDK.setOnRoomDidConnect.mockImplementation((handler) => {
      onRoomDidConnect = handler;
    });
    mockTwilioSDK.setOnRoomDidDisconnect.mockImplementation((handler) => {
      onRoomDidDisconnect = handler;
    });
    mockTwilioSDK.setOnRoomDidFailToConnect.mockImplementation((handler) => {
      onRoomDidFailToConnect = handler;
    });
    mockTwilioSDK.setOnParticipantAddedVideoTrack.mockImplementation((handler) => {
      onParticipantAddedVideoTrack = handler;
    });
    mockTwilioSDK.setOnParticipantRemovedVideoTrack.mockImplementation((handler) => {
      onParticipantRemovedVideoTrack = handler;
    });
    mockTwilioSDK.setOnNetworkQualityLevelsChanged.mockImplementation((handler) => {
      onNetworkQualityLevelsChanged = handler;
    });
    mockTwilioSDK.setOnDominantSpeakerChanged.mockImplementation((handler) => {
      onDominantSpeakerChanged = handler;
    });
    mockTwilioSDK.setOnReconnecting.mockImplementation((handler) => {
      onReconnecting = handler;
    });
    mockTwilioSDK.setOnReconnected.mockImplementation((handler) => {
      onReconnected = handler;
    });

    // Default permission grant
    mockPermissions.request.mockResolvedValue(mockPermissions.RESULTS.GRANTED);

    provider = new TwilioVideoProvider();

    mockCallbacks = {
      onConnected: jest.fn(),
      onDisconnected: jest.fn(),
      onReconnecting: jest.fn(),
      onReconnected: jest.fn(),
      onParticipantConnected: jest.fn(),
      onParticipantDisconnected: jest.fn(),
      onParticipantVideoEnabled: jest.fn(),
      onParticipantAudioEnabled: jest.fn(),
      onNetworkQualityChanged: jest.fn(),
      onDominantSpeakerChanged: jest.fn(),
      onError: jest.fn(),
    };
  });

  describe('Constructor', () => {
    it('should create an instance of TwilioVideoProvider', () => {
      expect(provider).toBeInstanceOf(TwilioVideoProvider);
    });
  });

  describe('connect()', () => {
    const config = {
      roomName: 'test-room',
      accessToken: 'test-token',
      enableVideo: true,
      enableAudio: true,
      enableNetworkQualityReporting: true,
      dominantSpeakerEnabled: true,
    };

    it('should request permissions before connecting', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(config, mockCallbacks);

      expect(mockPermissions.request).toHaveBeenCalledTimes(2);
      expect(mockPermissions.request).toHaveBeenCalledWith('ios.permission.CAMERA');
      expect(mockPermissions.request).toHaveBeenCalledWith('ios.permission.MICROPHONE');
    });

    it('should throw error if permissions are denied', async () => {
      mockPermissions.request.mockResolvedValueOnce(mockPermissions.RESULTS.DENIED);

      await expect(provider.connect(config, mockCallbacks)).rejects.toThrow(
        'Camera and microphone permissions are required'
      );

      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VideoErrorType.PERMISSION_DENIED,
        })
      );
    });

    it('should set up Twilio event listeners', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(config, mockCallbacks);

      expect(mockTwilioSDK.setOnRoomDidConnect).toHaveBeenCalled();
      expect(mockTwilioSDK.setOnRoomDidDisconnect).toHaveBeenCalled();
      expect(mockTwilioSDK.setOnRoomDidFailToConnect).toHaveBeenCalled();
      expect(mockTwilioSDK.setOnParticipantAddedVideoTrack).toHaveBeenCalled();
      expect(mockTwilioSDK.setOnParticipantRemovedVideoTrack).toHaveBeenCalled();
    });

    it('should connect to Twilio room with correct config', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(config, mockCallbacks);

      expect(mockTwilioSDK.connect).toHaveBeenCalledWith('test-token', {
        roomName: 'test-room',
        enableVideo: true,
        enableAudio: true,
        enableNetworkQualityReporting: true,
        dominantSpeakerEnabled: true,
      });
    });

    it('should call onConnected callback when room connects', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(config, mockCallbacks);

      // Simulate Twilio onRoomDidConnect event
      onRoomDidConnect({
        localParticipant: {
          identity: 'test-user',
        },
      });

      expect(mockCallbacks.onConnected).toHaveBeenCalled();
      expect(provider.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockTwilioSDK.connect.mockRejectedValue(error);

      await expect(provider.connect(config, mockCallbacks)).rejects.toThrow('Connection failed');

      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VideoErrorType.CONNECTION_FAILED,
          message: 'Connection failed',
        })
      );
    });
  });

  describe('disconnect()', () => {
    it('should disconnect from Twilio room', async () => {
      mockTwilioSDK.disconnect.mockResolvedValue(undefined);

      await provider.disconnect();

      expect(mockTwilioSDK.disconnect).toHaveBeenCalled();
      expect(provider.isConnected()).toBe(false);
    });

    it('should clear local participant and remote participants', async () => {
      // First connect
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );

      // Simulate connection
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });

      // Add a remote participant
      onParticipantAddedVideoTrack({
        participant: {
          sid: 'remote-1',
          identity: 'remote-user',
        },
      });

      expect(provider.getRemoteParticipants()).toHaveLength(1);

      // Disconnect
      await provider.disconnect();

      expect(provider.getLocalParticipant()).toBeNull();
      expect(provider.getRemoteParticipants()).toHaveLength(0);
    });
  });

  describe('Media controls', () => {
    beforeEach(async () => {
      // Connect first
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    describe('setLocalVideoEnabled()', () => {
      it('should enable/disable local video', async () => {
        mockTwilioSDK.setLocalVideoEnabled.mockResolvedValue(undefined);

        await provider.setLocalVideoEnabled(false);

        expect(mockTwilioSDK.setLocalVideoEnabled).toHaveBeenCalledWith(false);
        expect(provider.getLocalParticipant()?.videoEnabled).toBe(false);

        await provider.setLocalVideoEnabled(true);

        expect(mockTwilioSDK.setLocalVideoEnabled).toHaveBeenCalledWith(true);
        expect(provider.getLocalParticipant()?.videoEnabled).toBe(true);
      });

      it('should throw error if not connected', async () => {
        await provider.disconnect();

        await expect(provider.setLocalVideoEnabled(true)).rejects.toThrow(
          'Not connected to a room'
        );
      });
    });

    describe('setLocalAudioEnabled()', () => {
      it('should enable/disable local audio', async () => {
        mockTwilioSDK.setLocalAudioEnabled.mockResolvedValue(undefined);

        await provider.setLocalAudioEnabled(false);

        expect(mockTwilioSDK.setLocalAudioEnabled).toHaveBeenCalledWith(false);
        expect(provider.getLocalParticipant()?.audioEnabled).toBe(false);

        await provider.setLocalAudioEnabled(true);

        expect(mockTwilioSDK.setLocalAudioEnabled).toHaveBeenCalledWith(true);
        expect(provider.getLocalParticipant()?.audioEnabled).toBe(true);
      });

      it('should throw error if not connected', async () => {
        await provider.disconnect();

        await expect(provider.setLocalAudioEnabled(true)).rejects.toThrow(
          'Not connected to a room'
        );
      });
    });

    describe('switchCamera()', () => {
      it('should flip camera', async () => {
        mockTwilioSDK.flipCamera.mockResolvedValue(undefined);

        await provider.switchCamera();

        expect(mockTwilioSDK.flipCamera).toHaveBeenCalled();
        expect(provider.getLocalParticipant()?.cameraPosition).toBe('back');

        await provider.switchCamera();

        expect(provider.getLocalParticipant()?.cameraPosition).toBe('front');
      });

      it('should throw error if not connected', async () => {
        await provider.disconnect();

        await expect(provider.switchCamera()).rejects.toThrow('Not connected to a room');
      });
    });
  });

  describe('Participant management', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should add remote participant when video track added', () => {
      onParticipantAddedVideoTrack({
        participant: {
          sid: 'remote-1',
          identity: 'remote-user',
        },
      });

      const participants = provider.getRemoteParticipants();
      expect(participants).toHaveLength(1);
      expect(participants[0].sid).toBe('remote-1');
      expect(participants[0].identity).toBe('remote-user');
      expect(mockCallbacks.onParticipantConnected).toHaveBeenCalledWith(
        expect.objectContaining({
          sid: 'remote-1',
          identity: 'remote-user',
        })
      );
    });

    it('should remove remote participant when video track removed', () => {
      // Add participant first
      onParticipantAddedVideoTrack({
        participant: {
          sid: 'remote-1',
          identity: 'remote-user',
        },
      });

      expect(provider.getRemoteParticipants()).toHaveLength(1);

      // Remove participant
      onParticipantRemovedVideoTrack({
        participant: {
          sid: 'remote-1',
        },
      });

      expect(provider.getRemoteParticipants()).toHaveLength(0);
      expect(mockCallbacks.onParticipantDisconnected).toHaveBeenCalledWith('remote-1');
    });

    it('should not add duplicate participants', () => {
      onParticipantAddedVideoTrack({
        participant: {
          sid: 'remote-1',
          identity: 'remote-user',
        },
      });

      onParticipantAddedVideoTrack({
        participant: {
          sid: 'remote-1',
          identity: 'remote-user',
        },
      });

      expect(provider.getRemoteParticipants()).toHaveLength(1);
    });
  });

  describe('Network quality monitoring', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
          enableNetworkQualityReporting: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should report network quality changes', () => {
      onNetworkQualityLevelsChanged({
        localQuality: 5,
      });

      expect(mockCallbacks.onNetworkQualityChanged).toHaveBeenCalledWith(
        NetworkQuality.EXCELLENT
      );

      onNetworkQualityLevelsChanged({
        localQuality: 1,
      });

      expect(mockCallbacks.onNetworkQualityChanged).toHaveBeenCalledWith(NetworkQuality.POOR);
    });

    it('should map all network quality levels correctly', () => {
      const qualityMap = [
        { twilio: 0, expected: NetworkQuality.DISCONNECTED },
        { twilio: 1, expected: NetworkQuality.POOR },
        { twilio: 2, expected: NetworkQuality.LOW },
        { twilio: 3, expected: NetworkQuality.FAIR },
        { twilio: 4, expected: NetworkQuality.GOOD },
        { twilio: 5, expected: NetworkQuality.EXCELLENT },
      ];

      qualityMap.forEach(({ twilio, expected }) => {
        onNetworkQualityLevelsChanged({ localQuality: twilio });
        expect(mockCallbacks.onNetworkQualityChanged).toHaveBeenCalledWith(expected);
      });
    });
  });

  describe('Dominant speaker', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
          dominantSpeakerEnabled: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should track dominant speaker changes', () => {
      // Add participants
      onParticipantAddedVideoTrack({
        participant: { sid: 'remote-1', identity: 'user1' },
      });
      onParticipantAddedVideoTrack({
        participant: { sid: 'remote-2', identity: 'user2' },
      });

      // Change dominant speaker
      onDominantSpeakerChanged({
        participant: { sid: 'remote-1' },
      });

      expect(mockCallbacks.onDominantSpeakerChanged).toHaveBeenCalledWith('remote-1');

      const participants = provider.getRemoteParticipants();
      expect(participants.find((p) => p.sid === 'remote-1')?.isDominantSpeaker).toBe(true);
      expect(participants.find((p) => p.sid === 'remote-2')?.isDominantSpeaker).toBe(false);
    });
  });

  describe('Reconnection handling', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should handle reconnecting event', () => {
      onReconnecting({ error: 'Network lost' });

      expect(mockCallbacks.onReconnecting).toHaveBeenCalled();
    });

    it('should handle reconnected event', () => {
      onReconnecting({ error: 'Network lost' });
      onReconnected({});

      expect(mockCallbacks.onReconnected).toHaveBeenCalled();
    });
  });

  describe('Room statistics', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should return room stats', async () => {
      const stats = await provider.getRoomStats();

      expect(stats).toHaveProperty('duration');
      expect(stats).toHaveProperty('participantCount');
      expect(stats).toHaveProperty('bytesReceived');
      expect(stats).toHaveProperty('bytesSent');
      expect(stats).toHaveProperty('packetsLost');
    });

    it('should count participants correctly', async () => {
      onParticipantAddedVideoTrack({
        participant: { sid: 'remote-1', identity: 'user1' },
      });
      onParticipantAddedVideoTrack({
        participant: { sid: 'remote-2', identity: 'user2' },
      });

      const stats = await provider.getRoomStats();

      expect(stats.participantCount).toBe(3); // 2 remote + 1 local
    });
  });

  describe('Audio device', () => {
    beforeEach(async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );
      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
    });

    it('should set audio device', async () => {
      mockTwilioSDK.setAudioDevice.mockResolvedValue(undefined);

      await provider.setAudioDevice(AudioDevice.SPEAKER);

      expect(mockTwilioSDK.setAudioDevice).toHaveBeenCalledWith('speaker');

      await provider.setAudioDevice(AudioDevice.BLUETOOTH);

      expect(mockTwilioSDK.setAudioDevice).toHaveBeenCalledWith('bluetooth');
    });
  });

  describe('Error handling', () => {
    it('should handle room connection failure', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );

      // Simulate connection failure
      onRoomDidFailToConnect({
        error: 'Invalid access token',
      });

      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: VideoErrorType.CONNECTION_FAILED,
          message: 'Invalid access token',
        })
      );
    });

    it('should handle room disconnection', async () => {
      mockTwilioSDK.connect.mockResolvedValue(undefined);

      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'test-token',
          enableVideo: true,
          enableAudio: true,
        },
        mockCallbacks
      );

      onRoomDidConnect({ localParticipant: { identity: 'user1' } });
      expect(provider.isConnected()).toBe(true);

      onRoomDidDisconnect({});

      expect(provider.isConnected()).toBe(false);
      expect(mockCallbacks.onDisconnected).toHaveBeenCalled();
    });
  });
});
