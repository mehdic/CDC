/**
 * Video Service Types
 * Provider-agnostic type definitions for video call functionality
 * Task: T3-008
 */

/**
 * Call state machine states
 */
export enum CallState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
}

/**
 * Network quality levels (0 = no connection, 5 = excellent)
 */
export enum NetworkQuality {
  DISCONNECTED = 0,
  POOR = 1,
  LOW = 2,
  FAIR = 3,
  GOOD = 4,
  EXCELLENT = 5,
}

/**
 * Video participant representation
 */
export interface Participant {
  sid: string;
  identity: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  networkQuality?: NetworkQuality;
  isDominantSpeaker?: boolean;
}

/**
 * Local participant state
 */
export interface LocalParticipant {
  identity: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  cameraPosition: 'front' | 'back';
}

/**
 * Video room configuration
 */
export interface RoomConfig {
  roomName: string;
  accessToken: string;
  enableVideo: boolean;
  enableAudio: boolean;
  enableNetworkQualityReporting?: boolean;
  dominantSpeakerEnabled?: boolean;
}

/**
 * Video call error types
 */
export enum VideoErrorType {
  CONNECTION_FAILED = 'connection_failed',
  PERMISSION_DENIED = 'permission_denied',
  ROOM_NOT_FOUND = 'room_not_found',
  NETWORK_ERROR = 'network_error',
  MEDIA_ERROR = 'media_error',
  UNKNOWN = 'unknown',
}

/**
 * Video call error
 */
export interface VideoError {
  type: VideoErrorType;
  message: string;
  originalError?: any;
}

/**
 * Room statistics
 */
export interface RoomStats {
  duration: number; // in seconds
  participantCount: number;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
}

/**
 * Video room event callbacks
 */
export interface VideoRoomCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onParticipantConnected?: (participant: Participant) => void;
  onParticipantDisconnected?: (participantSid: string) => void;
  onParticipantVideoEnabled?: (participantSid: string, enabled: boolean) => void;
  onParticipantAudioEnabled?: (participantSid: string, enabled: boolean) => void;
  onNetworkQualityChanged?: (quality: NetworkQuality) => void;
  onDominantSpeakerChanged?: (participantSid: string | null) => void;
  onError?: (error: VideoError) => void;
}

/**
 * Camera position for mobile devices
 */
export type CameraPosition = 'front' | 'back';

/**
 * Audio device type
 */
export enum AudioDevice {
  SPEAKER = 'speaker',
  EARPIECE = 'earpiece',
  BLUETOOTH = 'bluetooth',
  WIRED_HEADSET = 'wired_headset',
}

/**
 * Picture-in-picture configuration
 */
export interface PiPConfig {
  enabled: boolean;
  width: number;
  height: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Background audio configuration (for iOS/Android)
 */
export interface BackgroundAudioConfig {
  enabled: boolean;
  mode: 'voip' | 'ambient' | 'playback';
}
