/**
 * Video Provider Interface
 * Provider-agnostic interface for video call implementations
 * Allows swapping between Twilio, Mock, or other providers
 * Task: T3-008
 */

import {
  RoomConfig,
  Participant,
  LocalParticipant,
  VideoRoomCallbacks,
  CameraPosition,
  AudioDevice,
  RoomStats,
  PiPConfig,
  BackgroundAudioConfig,
} from './types';

/**
 * Abstract video provider interface
 * Implementations: TwilioVideoProvider, MockVideoProvider
 */
export interface IVideoProvider {
  /**
   * Connect to a video room
   * @param config Room configuration with access token and settings
   * @param callbacks Event callbacks for room events
   * @returns Promise that resolves when connected
   */
  connect(config: RoomConfig, callbacks: VideoRoomCallbacks): Promise<void>;

  /**
   * Disconnect from current video room
   */
  disconnect(): Promise<void>;

  /**
   * Toggle local video on/off
   * @param enabled true to enable video, false to disable
   */
  setLocalVideoEnabled(enabled: boolean): Promise<void>;

  /**
   * Toggle local audio on/off
   * @param enabled true to enable audio, false to disable
   */
  setLocalAudioEnabled(enabled: boolean): Promise<void>;

  /**
   * Switch camera position (front/back)
   * @param position 'front' or 'back'
   */
  switchCamera(position?: CameraPosition): Promise<void>;

  /**
   * Get current local participant state
   */
  getLocalParticipant(): LocalParticipant | null;

  /**
   * Get all remote participants
   */
  getRemoteParticipants(): Participant[];

  /**
   * Get current room statistics
   */
  getRoomStats(): Promise<RoomStats>;

  /**
   * Check if currently connected to a room
   */
  isConnected(): boolean;

  /**
   * Set audio device output (speaker, earpiece, bluetooth, etc.)
   * @param device Audio device type
   */
  setAudioDevice(device: AudioDevice): Promise<void>;

  /**
   * Enable/disable Picture-in-Picture mode (mobile)
   * @param config PiP configuration
   */
  setPictureInPicture(config: PiPConfig): Promise<void>;

  /**
   * Enable/disable background audio continuation (mobile)
   * @param config Background audio configuration
   */
  setBackgroundAudio(config: BackgroundAudioConfig): Promise<void>;

  /**
   * Request camera and microphone permissions (mobile)
   * @returns Promise that resolves to true if granted, false otherwise
   */
  requestPermissions(): Promise<boolean>;
}
