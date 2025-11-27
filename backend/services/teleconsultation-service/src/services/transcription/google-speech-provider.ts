/**
 * Google Cloud Speech-to-Text Provider (STUB)
 * Future implementation for production Google Cloud Speech-to-Text integration
 * Task: T3-014
 */

import { BaseTranscriptionProvider } from './transcription-provider.interface';
import {
  Transcript,
  TranscriptionOptions,
  TranscriptionSession,
} from './types';

/**
 * Google Cloud Speech-to-Text provider (stub for future implementation)
 *
 * Production implementation would use:
 * - @google-cloud/speech SDK
 * - Medical speech recognition model
 * - StreamingRecognize for real-time transcription
 * - RecognizeAsync for batch transcription
 * - Custom medical vocabulary for French pharmacy terms
 *
 * Configuration required:
 * - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 * - PROJECT_ID
 * - LANGUAGE_CODE (fr-CH for Swiss French)
 *
 * Features:
 * - Medical speech recognition
 * - Speaker diarization
 * - Custom phrase hints for medical terminology
 * - Streaming and batch recognition
 * - French language support with regional variants
 */
export class GoogleSpeechProvider extends BaseTranscriptionProvider {
  readonly name = 'google-speech';

  async initialize(config: Record<string, any>): Promise<void> {
    // Validate required Google Cloud credentials
    this.validateConfig([
      'GOOGLE_APPLICATION_CREDENTIALS',
      'PROJECT_ID',
    ]);

    this.config = config;
    this.initialized = true;

    console.log('[GoogleSpeechProvider] Initialized (stub - not yet implemented)');
    console.warn('[GoogleSpeechProvider] This is a stub. Production implementation required.');
  }

  async startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession> {
    throw new Error('Google Speech streaming not yet implemented. Use MockTranscriptionProvider for development.');
  }

  async transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript> {
    throw new Error('Google Speech recording not yet implemented. Use MockTranscriptionProvider for development.');
  }

  isAvailable(): boolean {
    // Check if Google Cloud credentials are configured
    return false; // Stub - not implemented
  }
}
