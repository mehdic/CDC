/**
 * Transcription Provider Interface
 * Defines the contract for transcription providers (AWS, Google, Azure, Mock)
 * Task: T3-014
 */

import {
  TranscriptionProvider,
  TranscriptionSession,
  Transcript,
  TranscriptionOptions,
} from './types';

/**
 * Base abstract class for transcription providers
 * Implements common functionality and defines provider contract
 */
export abstract class BaseTranscriptionProvider implements TranscriptionProvider {
  protected config: Record<string, any> = {};
  protected initialized = false;

  abstract readonly name: string;

  /**
   * Initialize provider with configuration
   * Should validate credentials and connectivity
   */
  abstract initialize(config: Record<string, any>): Promise<void>;

  /**
   * Start real-time transcription from audio stream
   * Returns a session object for controlling the transcription
   */
  abstract startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession>;

  /**
   * Transcribe a pre-recorded audio file
   * Returns the complete transcript
   */
  abstract transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Helper method to validate configuration
   */
  protected validateConfig(requiredKeys: string[]): void {
    for (const key of requiredKeys) {
      if (!this.config[key]) {
        throw new Error(`Missing required configuration: ${key}`);
      }
    }
  }
}
