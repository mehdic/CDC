/**
 * Twilio Video Provider (STUB)
 * Production implementation using react-native-twilio-video-webrtc
 * Task: T3-008
 *
 * NOTE: This is currently a stub/interface definition.
 * The actual Twilio integration is implemented in the existing
 * TwilioVideo.tsx components in pharmacist-app and patient-app.
 *
 * Future work: Refactor existing components to use this provider architecture.
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
  PiPConfig,
  BackgroundAudioConfig,
  VideoErrorType,
} from './types';

/**
 * Twilio Video provider (stub implementation)
 *
 * IMPLEMENTATION NOTES:
 * - Use react-native-twilio-video-webrtc package
 * - See existing implementation in:
 *   - mobile/patient-app/src/components/TwilioVideo.tsx
 *   - mobile/pharmacist-app/src/components/TwilioVideo.tsx
 * - iOS Permissions required: NSCameraUsageDescription, NSMicrophoneUsageDescription
 * - Android Permissions required: CAMERA, RECORD_AUDIO
 */
export class TwilioVideoProvider implements IVideoProvider {
  private connected: boolean = false;
  private localParticipant: LocalParticipant | null = null;
  private remoteParticipants: Participant[] = [];
  private callbacks: VideoRoomCallbacks = {};

  async connect(config: RoomConfig, callbacks: VideoRoomCallbacks): Promise<void> {
    // TODO: Implement Twilio connection
    // TwilioVideo.connect(config.accessToken, {
    //   roomName: config.roomName,
    //   enableVideo: config.enableVideo,
    //   enableAudio: config.enableAudio,
    //   enableNetworkQualityReporting: config.enableNetworkQualityReporting,
    //   dominantSpeakerEnabled: config.dominantSpeakerEnabled,
    // });

    this.callbacks = callbacks;

    throw new Error('TwilioVideoProvider not yet implemented. Use MockVideoProvider for development/testing.');
  }

  async disconnect(): Promise<void> {
    // TODO: Implement Twilio disconnect
    // TwilioVideo.disconnect();

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async setLocalVideoEnabled(enabled: boolean): Promise<void> {
    // TODO: Implement
    // TwilioVideo.setLocalVideoEnabled(enabled);

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async setLocalAudioEnabled(enabled: boolean): Promise<void> {
    // TODO: Implement
    // TwilioVideo.setLocalAudioEnabled(enabled);

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async switchCamera(position?: CameraPosition): Promise<void> {
    // TODO: Implement
    // TwilioVideo.flipCamera();

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  getLocalParticipant(): LocalParticipant | null {
    return this.localParticipant;
  }

  getRemoteParticipants(): Participant[] {
    return this.remoteParticipants;
  }

  async getRoomStats(): Promise<RoomStats> {
    // TODO: Implement Twilio stats collection

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async setAudioDevice(device: AudioDevice): Promise<void> {
    // TODO: Implement audio device switching
    // TwilioVideo.setAudioDevice(device);

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async setPictureInPicture(config: PiPConfig): Promise<void> {
    // TODO: Implement PiP for mobile
    // iOS: Use AVPictureInPictureController
    // Android: Use PictureInPictureParams

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async setBackgroundAudio(config: BackgroundAudioConfig): Promise<void> {
    // TODO: Implement background audio
    // iOS: Configure AVAudioSession category
    // Android: Configure audio focus

    throw new Error('TwilioVideoProvider not yet implemented');
  }

  async requestPermissions(): Promise<boolean> {
    // TODO: Implement permission requests
    // Use react-native-permissions package:
    // - PERMISSIONS.IOS.CAMERA
    // - PERMISSIONS.IOS.MICROPHONE
    // - PERMISSIONS.ANDROID.CAMERA
    // - PERMISSIONS.ANDROID.RECORD_AUDIO

    throw new Error('TwilioVideoProvider not yet implemented');
  }
}

/**
 * iOS Permissions Required (Info.plist):
 *
 * <key>NSCameraUsageDescription</key>
 * <string>MetaPharm Connect needs camera access for video consultations</string>
 *
 * <key>NSMicrophoneUsageDescription</key>
 * <string>MetaPharm Connect needs microphone access for voice during consultations</string>
 */

/**
 * Android Permissions Required (AndroidManifest.xml):
 *
 * <uses-permission android:name="android.permission.CAMERA" />
 * <uses-permission android:name="android.permission.RECORD_AUDIO" />
 * <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
 * <uses-permission android:name="android.permission.INTERNET" />
 */
