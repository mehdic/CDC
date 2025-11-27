/**
 * AWS Transcribe Medical Provider (STUB)
 * Future implementation for production AWS Transcribe Medical integration
 * Task: T3-014
 */

import { BaseTranscriptionProvider } from './transcription-provider.interface';
import {
  Transcript,
  TranscriptionOptions,
  TranscriptionSession,
} from './types';

/**
 * AWS Transcribe Medical provider (stub for future implementation)
 *
 * Production implementation would use:
 * - AWS SDK (@aws-sdk/client-transcribe)
 * - AWS Transcribe Medical for healthcare-specific transcription
 * - WebSocket streaming for real-time transcription
 * - S3 for audio storage
 * - Medical vocabulary customization for French pharmacy terms
 *
 * Configuration required:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - S3_BUCKET for audio storage
 *
 * Features:
 * - HIPAA-eligible service
 * - Medical terminology optimization
 * - Speaker diarization
 * - Custom vocabulary for French medical terms
 * - Batch and streaming transcription
 */
export class AWSTranscribeProvider extends BaseTranscriptionProvider {
  readonly name = 'aws-transcribe';

  async initialize(config: Record<string, any>): Promise<void> {
    // Validate required AWS credentials
    this.validateConfig([
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
    ]);

    this.config = config;
    this.initialized = true;

    console.log('[AWSTranscribeProvider] Initialized (stub - not yet implemented)');
    console.warn('[AWSTranscribeProvider] This is a stub. Production implementation required.');
  }

  async startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession> {
    throw new Error('AWS Transcribe streaming not yet implemented. Use MockTranscriptionProvider for development.');
  }

  async transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript> {
    throw new Error('AWS Transcribe recording not yet implemented. Use MockTranscriptionProvider for development.');
  }

  isAvailable(): boolean {
    // Check if AWS credentials are configured
    return false; // Stub - not implemented
  }
}
