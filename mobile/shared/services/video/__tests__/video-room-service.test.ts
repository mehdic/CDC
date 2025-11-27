/**
 * Video Room Service Tests
 * Task: T3-012
 */

import { VideoRoomService } from '../video-room-service';
import { CallState, NetworkQuality, AudioDevice } from '../types';

describe('VideoRoomService', () => {
  let service: VideoRoomService;

  beforeEach(() => {
    service = new VideoRoomService({ useMockProvider: true });
  });

  describe('Initialization', () => {
    it('should initialize with mock provider', () => {
      expect(service).toBeDefined();
      expect(service.getState()).toBe(CallState.IDLE);
    });

    it('should initialize with custom config', () => {
      const customService = new VideoRoomService({
        useMockProvider: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 5000,
      });

      expect(customService).toBeDefined();
    });
  });

  describe('Connection Flow', () => {
    it('should connect to a room successfully', async () => {
      const onConnected = jest.fn();

      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onConnected }
      );

      expect(service.isConnected()).toBe(true);
      expect(service.getState()).toBe(CallState.CONNECTED);
      expect(onConnected).toHaveBeenCalled();
    });

    it('should transition through CONNECTING state', async () => {
      const states: CallState[] = [];
      const unsubscribe = service.subscribeToStateChanges((state) => {
        states.push(state);
      });

      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      expect(states).toContain(CallState.CONNECTING);
      expect(states).toContain(CallState.CONNECTED);
      unsubscribe();
    });

    it('should handle connection failures', async () => {
      // Create a service that will fail due to Twilio provider (which throws not implemented)
      const twilioService = new VideoRoomService({ provider: 'twilio' });

      await expect(
        twilioService.connect(
          {
            roomName: 'test-room',
            accessToken: 'invalid-token',
            enableVideo: true,
            enableAudio: true,
          },
          {}
        )
      ).rejects.toThrow();

      expect(twilioService.getState()).toBe(CallState.FAILED);
    });

    it('should disconnect from room', async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      await service.disconnect();
      expect(service.isConnected()).toBe(false);
      expect(service.getState()).toBe(CallState.DISCONNECTED);
    });

    it('should prevent connection from invalid state', async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      // Try to connect again while already connected
      await expect(
        service.connect(
          {
            roomName: 'another-room',
            accessToken: 'mock-token',
            enableVideo: true,
            enableAudio: true,
          },
          {}
        )
      ).rejects.toThrow(/Cannot connect from state/);
    });
  });

  describe('Media Controls', () => {
    beforeEach(async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );
    });

    it('should toggle local video', async () => {
      await expect(service.setLocalVideoEnabled(false)).resolves.not.toThrow();
      expect(service.getLocalParticipant()?.videoEnabled).toBe(false);
    });

    it('should toggle local audio', async () => {
      await expect(service.setLocalAudioEnabled(false)).resolves.not.toThrow();
      expect(service.getLocalParticipant()?.audioEnabled).toBe(false);
    });

    it('should switch camera', async () => {
      await expect(service.switchCamera('back')).resolves.not.toThrow();
      expect(service.getLocalParticipant()?.cameraPosition).toBe('back');
    });

    it('should set audio device', async () => {
      await expect(service.setAudioDevice(AudioDevice.SPEAKER)).resolves.not.toThrow();
    });

    it('should throw error when controlling media without connection', async () => {
      await service.disconnect();

      await expect(service.setLocalVideoEnabled(true)).rejects.toThrow(
        'Not connected to a room'
      );
    });
  });

  describe('Participants', () => {
    beforeEach(async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );
    });

    it('should get local participant', () => {
      const local = service.getLocalParticipant();
      expect(local).not.toBeNull();
      expect(local?.videoEnabled).toBe(true);
      expect(local?.audioEnabled).toBe(true);
    });

    it('should get remote participants', async () => {
      // Wait for simulated remote participant
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const remotes = service.getRemoteParticipants();
      expect(remotes.length).toBeGreaterThan(0);
    });

    it('should notify on participant connected', async () => {
      const onParticipantConnected = jest.fn();

      // Reconnect with callback
      await service.disconnect();
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onParticipantConnected }
      );

      // Wait for simulated remote participant
      await new Promise((resolve) => setTimeout(resolve, 2500));

      expect(onParticipantConnected).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should track call state', async () => {
      expect(service.getState()).toBe(CallState.IDLE);

      const connectPromise = service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      // Should be connecting immediately
      expect(service.getState()).toBe(CallState.CONNECTING);

      await connectPromise;
      expect(service.getState()).toBe(CallState.CONNECTED);
    });

    it('should allow subscribing to state changes', async () => {
      const stateChanges: CallState[] = [];
      const unsubscribe = service.subscribeToStateChanges((state) => {
        stateChanges.push(state);
      });

      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      await service.disconnect();

      expect(stateChanges).toContain(CallState.CONNECTING);
      expect(stateChanges).toContain(CallState.CONNECTED);
      expect(stateChanges).toContain(CallState.DISCONNECTED);

      unsubscribe();
    });
  });

  describe('Room Statistics', () => {
    it('should provide room statistics', async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = await service.getRoomStats();
      expect(stats).toBeDefined();
      expect(stats.duration).toBeGreaterThanOrEqual(1);
      expect(stats.participantCount).toBeGreaterThanOrEqual(1);
    });

    it('should track call duration', async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      const duration = service.getCallDuration();
      expect(duration).toBeGreaterThanOrEqual(500);
    });
  });

  describe('Mobile-Specific Features', () => {
    beforeEach(async () => {
      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );
    });

    it('should set picture-in-picture mode', async () => {
      await expect(
        service.setPictureInPicture({
          enabled: true,
          width: 150,
          height: 200,
          position: 'top-right',
        })
      ).resolves.not.toThrow();
    });

    it('should set background audio mode', async () => {
      await expect(
        service.setBackgroundAudio({
          enabled: true,
          mode: 'voip',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Permissions', () => {
    it('should request permissions', async () => {
      const granted = await service.requestPermissions();
      expect(granted).toBe(true);
    });
  });

  describe('Reconnection Handling', () => {
    it('should handle reconnection events', async () => {
      const onReconnecting = jest.fn();
      const onReconnected = jest.fn();

      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onReconnecting, onReconnected }
      );

      // Simulate reconnection via provider
      const mockProvider = (service as any).provider;
      if (mockProvider.simulateReconnection) {
        mockProvider.simulateReconnection();

        expect(onReconnecting).toHaveBeenCalled();

        await new Promise((resolve) => setTimeout(resolve, 2500));
        expect(onReconnected).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network quality changes', async () => {
      const onNetworkQualityChanged = jest.fn();

      await service.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
          enableNetworkQualityReporting: true,
        },
        { onNetworkQualityChanged }
      );

      // Wait for network quality monitoring to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Should have received at least one quality update
      expect(onNetworkQualityChanged).toHaveBeenCalled();
    });
  });
});
