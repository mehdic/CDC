/**
 * Video Services - Barrel Export
 * Provider-agnostic video call services for MetaPharm Connect
 * Task: T3-008, T3-009
 */

// Main service
export { VideoRoomService } from './video-room-service';
export type { VideoRoomServiceConfig } from './video-room-service';

// Providers
export type { IVideoProvider } from './video-provider.interface';
export { MockVideoProvider } from './mock-video-provider';
export { TwilioVideoProvider } from './twilio-video-provider';

// State machine
export { CallStateMachine } from './call-state-machine';

// Types (enums and types)
export {
  CallState,
  NetworkQuality,
  VideoErrorType,
  AudioDevice,
} from './types';

export type {
  CameraPosition,
  Participant,
  LocalParticipant,
  RoomConfig,
  VideoError,
  RoomStats,
  VideoRoomCallbacks,
  PiPConfig,
  BackgroundAudioConfig,
} from './types';
