/**
 * Mock Video Provider Tests
 * Task: T3-012
 */

import { MockVideoProvider } from '../mock-video-provider';
import { CallState, NetworkQuality, AudioDevice } from '../types';

describe('MockVideoProvider', () => {
  let provider: MockVideoProvider;

  beforeEach(() => {
    provider = new MockVideoProvider();
  });

  describe('Connection', () => {
    it('should connect to a room successfully', async () => {
      const onConnected = jest.fn();

      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onConnected }
      );

      expect(provider.isConnected()).toBe(true);
      expect(onConnected).toHaveBeenCalled();
    });

    it('should create local participant on connect', async () => {
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      const local = provider.getLocalParticipant();
      expect(local).not.toBeNull();
      expect(local?.videoEnabled).toBe(true);
      expect(local?.audioEnabled).toBe(true);
    });

    it('should simulate remote participant joining', async () => {
      const onParticipantConnected = jest.fn();

      await provider.connect(
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
      expect(provider.getRemoteParticipants()).toHaveLength(1);
    });

    it('should fail connection when permissions denied', async () => {
      // Mock requestPermissions to return false
      jest.spyOn(provider, 'requestPermissions').mockResolvedValue(false);

      const onError = jest.fn();

      await expect(
        provider.connect(
          {
            roomName: 'test-room',
            accessToken: 'mock-token',
            enableVideo: true,
            enableAudio: true,
          },
          { onError }
        )
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Disconnection', () => {
    it('should disconnect from room', async () => {
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      const onDisconnected = jest.fn();
      await provider.disconnect();

      expect(provider.isConnected()).toBe(false);
      expect(provider.getLocalParticipant()).toBeNull();
    });

    it('should remove all remote participants on disconnect', async () => {
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      provider.addMockParticipant('Test User');
      expect(provider.getRemoteParticipants()).toHaveLength(1);

      await provider.disconnect();
      expect(provider.getRemoteParticipants()).toHaveLength(0);
    });
  });

  describe('Media Controls', () => {
    beforeEach(async () => {
      await provider.connect(
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
      await provider.setLocalVideoEnabled(false);
      expect(provider.getLocalParticipant()?.videoEnabled).toBe(false);

      await provider.setLocalVideoEnabled(true);
      expect(provider.getLocalParticipant()?.videoEnabled).toBe(true);
    });

    it('should toggle local audio', async () => {
      await provider.setLocalAudioEnabled(false);
      expect(provider.getLocalParticipant()?.audioEnabled).toBe(false);

      await provider.setLocalAudioEnabled(true);
      expect(provider.getLocalParticipant()?.audioEnabled).toBe(true);
    });

    it('should switch camera', async () => {
      const local = provider.getLocalParticipant();
      expect(local?.cameraPosition).toBe('front');

      await provider.switchCamera('back');
      expect(provider.getLocalParticipant()?.cameraPosition).toBe('back');

      await provider.switchCamera(); // Toggle
      expect(provider.getLocalParticipant()?.cameraPosition).toBe('front');
    });

    it('should throw error when toggling media without connection', async () => {
      await provider.disconnect();

      await expect(provider.setLocalVideoEnabled(true)).rejects.toThrow(
        'Not connected to a room'
      );
    });
  });

  describe('Participants', () => {
    beforeEach(async () => {
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );
    });

    it('should add mock participants', () => {
      const onParticipantConnected = jest.fn();
      provider.addMockParticipant('Test User');

      expect(provider.getRemoteParticipants()).toHaveLength(1);
      expect(provider.getRemoteParticipants()[0].identity).toBe('Test User');
    });

    it('should remove mock participants', () => {
      provider.addMockParticipant('Test User');
      const participants = provider.getRemoteParticipants();
      const sid = participants[0].sid;

      provider.removeMockParticipant(sid);
      expect(provider.getRemoteParticipants()).toHaveLength(0);
    });
  });

  describe('Room Statistics', () => {
    it('should provide room statistics', async () => {
      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        {}
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = await provider.getRoomStats();
      expect(stats.duration).toBeGreaterThanOrEqual(1);
      expect(stats.participantCount).toBeGreaterThanOrEqual(1);
      expect(stats.bytesReceived).toBeGreaterThan(0);
      expect(stats.bytesSent).toBeGreaterThan(0);
    });
  });

  describe('Audio Devices', () => {
    it('should allow setting audio device', async () => {
      await expect(provider.setAudioDevice(AudioDevice.SPEAKER)).resolves.not.toThrow();
      await expect(provider.setAudioDevice(AudioDevice.BLUETOOTH)).resolves.not.toThrow();
    });
  });

  describe('Permissions', () => {
    it('should request and grant permissions', async () => {
      const granted = await provider.requestPermissions();
      expect(granted).toBe(true);
    });
  });

  describe('Network Simulation', () => {
    it('should simulate reconnection', async () => {
      const onReconnecting = jest.fn();
      const onReconnected = jest.fn();

      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onReconnecting, onReconnected }
      );

      provider.simulateReconnection();

      expect(onReconnecting).toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 2500));
      expect(onReconnected).toHaveBeenCalled();
    });

    it('should simulate disconnection', async () => {
      const onDisconnected = jest.fn();

      await provider.connect(
        {
          roomName: 'test-room',
          accessToken: 'mock-token',
          enableVideo: true,
          enableAudio: true,
        },
        { onDisconnected }
      );

      provider.simulateDisconnection();
      expect(provider.isConnected()).toBe(false);
    });
  });

  describe('Network Issues Mode', () => {
    it('should simulate network failures when configured', async () => {
      const providerWithIssues = new MockVideoProvider({ simulateNetworkIssues: true });
      const onError = jest.fn();

      // May fail randomly, so we test the behavior exists
      const connectAttempts = [];
      for (let i = 0; i < 10; i++) {
        try {
          await providerWithIssues.connect(
            {
              roomName: 'test-room',
              accessToken: 'mock-token',
              enableVideo: true,
              enableAudio: true,
            },
            { onError }
          );
          connectAttempts.push('success');
        } catch (error) {
          connectAttempts.push('failure');
        }
      }

      // At least some should fail with network issues enabled
      expect(connectAttempts.includes('failure')).toBe(true);
    });
  });
});
