/**
 * Video Room Service
 * High-level service for managing video calls
 * Task: T3-009
 */

import { IVideoProvider } from './video-provider.interface';
import { MockVideoProvider } from './mock-video-provider';
import { TwilioVideoProvider } from './twilio-video-provider';
import { CallStateMachine } from './call-state-machine';
import {
  RoomConfig,
  CallState,
  Participant,
  LocalParticipant,
  VideoRoomCallbacks,
  VideoError,
  NetworkQuality,
  CameraPosition,
  AudioDevice,
  RoomStats,
  PiPConfig,
  BackgroundAudioConfig,
} from './types';

/**
 * Video room service configuration
 */
export interface VideoRoomServiceConfig {
  provider?: 'twilio' | 'mock';
  useMockProvider?: boolean;
  simulateNetworkIssues?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * Video room service
 * Provides high-level API for video call management with state machine
 */
export class VideoRoomService {
  private provider: IVideoProvider;
  private stateMachine: CallStateMachine;
  private config: VideoRoomServiceConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: VideoRoomServiceConfig = {}) {
    this.config = {
      provider: config.useMockProvider ? 'mock' : (config.provider || 'mock'),
      maxReconnectAttempts: config.maxReconnectAttempts || 3,
      reconnectDelay: config.reconnectDelay || 2000,
      simulateNetworkIssues: config.simulateNetworkIssues || false,
    };

    // Initialize provider based on configuration
    this.provider = this.createProvider();
    this.stateMachine = new CallStateMachine();

    console.log(`[VideoRoomService] Initialized with ${this.config.provider} provider`);
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Connect to a video room
   */
  async connect(config: RoomConfig, callbacks: VideoRoomCallbacks = {}): Promise<void> {
    if (!this.stateMachine.canTransition(CallState.CONNECTING)) {
      throw new Error(`Cannot connect from state: ${this.stateMachine.getState()}`);
    }

    this.stateMachine.transition(CallState.CONNECTING);

    try {
      await this.provider.connect(config, {
        onConnected: () => {
          this.stateMachine.transition(CallState.CONNECTED);
          this.reconnectAttempts = 0;
          callbacks.onConnected?.();
        },
        onDisconnected: () => {
          if (this.stateMachine.isConnected()) {
            this.stateMachine.transition(CallState.DISCONNECTED);
          }
          callbacks.onDisconnected?.();
        },
        onReconnecting: () => {
          if (this.stateMachine.is(CallState.CONNECTED)) {
            this.stateMachine.transition(CallState.RECONNECTING);
          }
          callbacks.onReconnecting?.();
          this.handleReconnecting();
        },
        onReconnected: () => {
          if (this.stateMachine.is(CallState.RECONNECTING)) {
            this.stateMachine.transition(CallState.CONNECTED);
          }
          this.reconnectAttempts = 0;
          callbacks.onReconnected?.();
        },
        onParticipantConnected: callbacks.onParticipantConnected,
        onParticipantDisconnected: callbacks.onParticipantDisconnected,
        onParticipantVideoEnabled: callbacks.onParticipantVideoEnabled,
        onParticipantAudioEnabled: callbacks.onParticipantAudioEnabled,
        onNetworkQualityChanged: callbacks.onNetworkQualityChanged,
        onDominantSpeakerChanged: callbacks.onDominantSpeakerChanged,
        onError: (error) => {
          if (this.stateMachine.is(CallState.CONNECTING)) {
            this.stateMachine.transition(CallState.FAILED);
          }
          callbacks.onError?.(error);
        },
      });
    } catch (error: any) {
      this.stateMachine.transition(CallState.FAILED);
      throw error;
    }
  }

  /**
   * Disconnect from current room
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      await this.provider.disconnect();
    } finally {
      if (this.stateMachine.isConnected()) {
        this.stateMachine.transition(CallState.DISCONNECTED);
      }
    }
  }

  // ============================================================================
  // Media Controls
  // ============================================================================

  /**
   * Toggle local video on/off
   */
  async setLocalVideoEnabled(enabled: boolean): Promise<void> {
    if (!this.stateMachine.isConnected()) {
      throw new Error('Not connected to a room');
    }

    await this.provider.setLocalVideoEnabled(enabled);
  }

  /**
   * Toggle local audio on/off
   */
  async setLocalAudioEnabled(enabled: boolean): Promise<void> {
    if (!this.stateMachine.isConnected()) {
      throw new Error('Not connected to a room');
    }

    await this.provider.setLocalAudioEnabled(enabled);
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(position?: CameraPosition): Promise<void> {
    if (!this.stateMachine.isConnected()) {
      throw new Error('Not connected to a room');
    }

    await this.provider.switchCamera(position);
  }

  /**
   * Set audio output device
   */
  async setAudioDevice(device: AudioDevice): Promise<void> {
    await this.provider.setAudioDevice(device);
  }

  // ============================================================================
  // Mobile-Specific Features
  // ============================================================================

  /**
   * Enable/disable Picture-in-Picture mode
   */
  async setPictureInPicture(config: PiPConfig): Promise<void> {
    await this.provider.setPictureInPicture(config);
  }

  /**
   * Enable/disable background audio continuation
   */
  async setBackgroundAudio(config: BackgroundAudioConfig): Promise<void> {
    await this.provider.setBackgroundAudio(config);
  }

  /**
   * Request camera and microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    return this.provider.requestPermissions();
  }

  // ============================================================================
  // State and Participants
  // ============================================================================

  /**
   * Get current call state
   */
  getState(): CallState {
    return this.stateMachine.getState();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.stateMachine.isConnected();
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): LocalParticipant | null {
    return this.provider.getLocalParticipant();
  }

  /**
   * Get remote participants
   */
  getRemoteParticipants(): Participant[] {
    return this.provider.getRemoteParticipants();
  }

  /**
   * Get room statistics
   */
  async getRoomStats(): Promise<RoomStats> {
    return this.provider.getRoomStats();
  }

  /**
   * Get total call duration (milliseconds)
   */
  getCallDuration(): number {
    return this.stateMachine.getTotalCallDuration();
  }

  /**
   * Subscribe to state changes
   */
  subscribeToStateChanges(listener: (state: CallState) => void): () => void {
    return this.stateMachine.subscribe(listener);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private createProvider(): IVideoProvider {
    switch (this.config.provider) {
      case 'mock':
        return new MockVideoProvider({
          simulateNetworkIssues: this.config.simulateNetworkIssues,
        });
      case 'twilio':
        return new TwilioVideoProvider();
      default:
        console.warn(`Unknown provider: ${this.config.provider}, defaulting to mock`);
        return new MockVideoProvider();
    }
  }

  private handleReconnecting(): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 3)) {
      console.error('[VideoRoomService] Max reconnect attempts reached');
      this.disconnect();
    }
  }
}
