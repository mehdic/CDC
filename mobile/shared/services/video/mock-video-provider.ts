/**
 * Mock Video Provider
 * Mock implementation for testing and development without real Twilio SDK
 * Task: T3-008, T3-009
 */

import { IVideoProvider } from './video-provider.interface';
import {
  RoomConfig,
  Participant,
  LocalParticipant,
  VideoRoomCallbacks,
  CameraPosition,
  AudioDevice,
  RoomStats,
  CallState,
  NetworkQuality,
  VideoErrorType,
  PiPConfig,
  BackgroundAudioConfig,
} from './types';

/**
 * Mock video provider for testing
 * Simulates video call behavior without actual video streaming
 */
export class MockVideoProvider implements IVideoProvider {
  private connected: boolean = false;
  private localParticipant: LocalParticipant | null = null;
  private remoteParticipants: Participant[] = [];
  private callbacks: VideoRoomCallbacks = {};
  private connectionStartTime: number = 0;
  private simulateNetworkIssues: boolean = false;

  constructor(options?: { simulateNetworkIssues?: boolean }) {
    this.simulateNetworkIssues = options?.simulateNetworkIssues ?? false;
  }

  async connect(config: RoomConfig, callbacks: VideoRoomCallbacks): Promise<void> {
    this.callbacks = callbacks;

    // Simulate connection delay
    await this.delay(500);

    // Check permissions first
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      const error = {
        type: VideoErrorType.PERMISSION_DENIED,
        message: 'Camera and microphone permissions are required',
      };
      this.callbacks.onError?.(error);
      throw new Error(error.message);
    }

    // Simulate network issues if configured
    if (this.simulateNetworkIssues && Math.random() > 0.7) {
      const error = {
        type: VideoErrorType.NETWORK_ERROR,
        message: 'Failed to connect due to network issues',
      };
      this.callbacks.onError?.(error);
      throw new Error(error.message);
    }

    // Create local participant
    this.localParticipant = {
      identity: 'local-participant',
      videoEnabled: config.enableVideo,
      audioEnabled: config.enableAudio,
      cameraPosition: 'front',
    };

    this.connected = true;
    this.connectionStartTime = Date.now();

    console.log('[MockVideoProvider] Connected to room:', config.roomName);
    this.callbacks.onConnected?.();

    // Simulate remote participant joining after 2 seconds
    setTimeout(() => {
      this.simulateRemoteParticipantJoin();
    }, 2000);

    // Simulate network quality monitoring
    if (config.enableNetworkQualityReporting) {
      this.startNetworkQualityMonitoring();
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    console.log('[MockVideoProvider] Disconnecting from room');

    // Remove all remote participants
    this.remoteParticipants.forEach((participant) => {
      this.callbacks.onParticipantDisconnected?.(participant.sid);
    });

    this.remoteParticipants = [];
    this.localParticipant = null;
    this.connected = false;

    this.callbacks.onDisconnected?.();
  }

  async setLocalVideoEnabled(enabled: boolean): Promise<void> {
    if (!this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    console.log('[MockVideoProvider] Set local video:', enabled);
    this.localParticipant.videoEnabled = enabled;
  }

  async setLocalAudioEnabled(enabled: boolean): Promise<void> {
    if (!this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    console.log('[MockVideoProvider] Set local audio:', enabled);
    this.localParticipant.audioEnabled = enabled;
  }

  async switchCamera(position?: CameraPosition): Promise<void> {
    if (!this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    const newPosition = position || (this.localParticipant.cameraPosition === 'front' ? 'back' : 'front');
    console.log('[MockVideoProvider] Switch camera to:', newPosition);
    this.localParticipant.cameraPosition = newPosition;

    // Simulate camera switch delay
    await this.delay(300);
  }

  getLocalParticipant(): LocalParticipant | null {
    return this.localParticipant;
  }

  getRemoteParticipants(): Participant[] {
    return this.remoteParticipants;
  }

  async getRoomStats(): Promise<RoomStats> {
    const duration = this.connected ? Math.floor((Date.now() - this.connectionStartTime) / 1000) : 0;

    return {
      duration,
      participantCount: this.remoteParticipants.length + (this.localParticipant ? 1 : 0),
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesSent: Math.floor(Math.random() * 1000000),
      packetsLost: Math.floor(Math.random() * 100),
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async setAudioDevice(device: AudioDevice): Promise<void> {
    console.log('[MockVideoProvider] Set audio device:', device);
    // Mock implementation - no real audio device switching
  }

  async setPictureInPicture(config: PiPConfig): Promise<void> {
    console.log('[MockVideoProvider] Set Picture-in-Picture:', config.enabled);
    // Mock implementation - no real PiP
  }

  async setBackgroundAudio(config: BackgroundAudioConfig): Promise<void> {
    console.log('[MockVideoProvider] Set background audio:', config.enabled);
    // Mock implementation - no real background audio
  }

  async requestPermissions(): Promise<boolean> {
    console.log('[MockVideoProvider] Requesting permissions (auto-granted in mock)');
    // Mock always grants permissions
    return true;
  }

  // ============================================================================
  // Simulation Helpers
  // ============================================================================

  /**
   * Simulate a remote participant joining the room
   */
  private simulateRemoteParticipantJoin(): void {
    if (!this.connected) {
      return;
    }

    const participant: Participant = {
      sid: `remote-${Date.now()}`,
      identity: 'Remote Participant',
      videoEnabled: true,
      audioEnabled: true,
      networkQuality: NetworkQuality.GOOD,
      isDominantSpeaker: false,
    };

    this.remoteParticipants.push(participant);
    console.log('[MockVideoProvider] Remote participant joined:', participant.identity);
    this.callbacks.onParticipantConnected?.(participant);
  }

  /**
   * Simulate network quality monitoring
   */
  private startNetworkQualityMonitoring(): void {
    const checkQuality = () => {
      if (!this.connected) {
        return;
      }

      // Randomly vary network quality
      const qualities = [
        NetworkQuality.EXCELLENT,
        NetworkQuality.GOOD,
        NetworkQuality.FAIR,
      ];

      if (this.simulateNetworkIssues) {
        qualities.push(NetworkQuality.LOW, NetworkQuality.POOR);
      }

      const quality = qualities[Math.floor(Math.random() * qualities.length)];
      this.callbacks.onNetworkQualityChanged?.(quality);

      // Check again in 5 seconds
      setTimeout(checkQuality, 5000);
    };

    setTimeout(checkQuality, 2000);
  }

  /**
   * Simulate reconnection scenario
   */
  public simulateReconnection(): void {
    if (!this.connected) {
      return;
    }

    console.log('[MockVideoProvider] Simulating reconnection...');
    this.callbacks.onReconnecting?.();

    setTimeout(() => {
      console.log('[MockVideoProvider] Reconnected');
      this.callbacks.onReconnected?.();
    }, 2000);
  }

  /**
   * Simulate network disconnection
   */
  public simulateDisconnection(): void {
    if (!this.connected) {
      return;
    }

    console.log('[MockVideoProvider] Simulating disconnection...');
    this.disconnect();
  }

  /**
   * Add a mock remote participant manually (for testing)
   */
  public addMockParticipant(name: string): void {
    const participant: Participant = {
      sid: `mock-${Date.now()}`,
      identity: name,
      videoEnabled: true,
      audioEnabled: true,
      networkQuality: NetworkQuality.GOOD,
    };

    this.remoteParticipants.push(participant);
    this.callbacks.onParticipantConnected?.(participant);
  }

  /**
   * Remove a mock remote participant manually (for testing)
   */
  public removeMockParticipant(sid: string): void {
    const index = this.remoteParticipants.findIndex((p) => p.sid === sid);
    if (index !== -1) {
      this.remoteParticipants.splice(index, 1);
      this.callbacks.onParticipantDisconnected?.(sid);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
