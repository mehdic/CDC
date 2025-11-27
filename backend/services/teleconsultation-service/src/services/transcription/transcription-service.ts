/**
 * Transcription Service
 * Main service for managing transcription lifecycle
 * Task: T3-015
 */

import { MockTranscriptionProvider } from './mock-transcription-provider';
import { TranscriptStorageService } from './transcript-storage';
import {
  TranscriptionProvider,
  TranscriptionOptions,
  Transcript,
  TranscriptionSession,
  TranscriptSearchQuery,
  TranscriptSearchResult,
} from './types';

/**
 * Main transcription service
 * Coordinates transcription providers and storage
 */
export class TranscriptionService {
  private provider: TranscriptionProvider;
  private storage: TranscriptStorageService;
  private activeSessions: Map<string, TranscriptionSession> = new Map();

  constructor(
    provider?: TranscriptionProvider,
    storage?: TranscriptStorageService
  ) {
    // Use mock provider by default (can be replaced with AWS/Google/Azure)
    this.provider = provider || new MockTranscriptionProvider();

    // Initialize storage
    this.storage = storage || new TranscriptStorageService();

    console.log(`[TranscriptionService] Initialized with provider: ${this.provider.name}`);
  }

  /**
   * Initialize service
   */
  async initialize(config: Record<string, any> = {}): Promise<void> {
    await this.provider.initialize(config);
    console.log('[TranscriptionService] Service initialized');
  }

  /**
   * Start real-time transcription for a consultation
   * Returns a session that emits transcription events
   */
  async startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions = {},
    userId: string,
    userName: string
  ): Promise<TranscriptionSession> {
    if (!this.provider.isAvailable()) {
      throw new Error('Transcription provider not available');
    }

    console.log(`[TranscriptionService] Starting stream transcription for consultation ${consultationId}`);

    // Start transcription
    const session = await this.provider.startStreamTranscription(
      consultationId,
      audioStream,
      {
        language: options.language || 'fr',
        enable_speaker_diarization: options.enable_speaker_diarization !== false,
        enable_medical_term_extraction: options.enable_medical_term_extraction !== false,
        audio_source: 'stream',
        ...options,
      }
    );

    // Store session
    this.activeSessions.set(consultationId, session);

    // Handle session completion
    session.on('complete', async (transcript: Transcript) => {
      console.log(`[TranscriptionService] Transcription complete for consultation ${consultationId}`);

      try {
        // Save to storage
        await this.storage.saveTranscript(transcript, userId, userName);

        // Remove from active sessions
        this.activeSessions.delete(consultationId);
      } catch (error) {
        console.error('[TranscriptionService] Failed to save completed transcript:', error);
      }
    });

    // Handle errors
    session.on('error', (error: any) => {
      console.error(`[TranscriptionService] Transcription error for consultation ${consultationId}:`, error);
      this.activeSessions.delete(consultationId);
    });

    return session;
  }

  /**
   * Transcribe a pre-recorded consultation
   */
  async transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions = {},
    userId: string,
    userName: string
  ): Promise<Transcript> {
    if (!this.provider.isAvailable()) {
      throw new Error('Transcription provider not available');
    }

    console.log(`[TranscriptionService] Transcribing recording for consultation ${consultationId}`);

    // Transcribe
    const transcript = await this.provider.transcribeRecording(
      consultationId,
      audioUrl,
      {
        language: options.language || 'fr',
        enable_speaker_diarization: options.enable_speaker_diarization !== false,
        enable_medical_term_extraction: options.enable_medical_term_extraction !== false,
        audio_source: 'recording',
        ...options,
      }
    );

    // Save to storage
    await this.storage.saveTranscript(transcript, userId, userName);

    console.log(`[TranscriptionService] Saved transcript ${transcript.id}`);

    return transcript;
  }

  /**
   * Get transcript for a consultation
   */
  async getTranscript(
    consultationId: string,
    userId: string,
    userName: string
  ): Promise<Transcript | null> {
    return this.storage.getByConsultationId(consultationId, userId, userName);
  }

  /**
   * Search transcripts
   */
  async searchTranscripts(
    query: TranscriptSearchQuery,
    userId: string,
    userName: string
  ): Promise<TranscriptSearchResult[]> {
    return this.storage.search(query, userId, userName);
  }

  /**
   * Update transcript segment (pharmacist correction)
   */
  async updateSegment(
    consultationId: string,
    segmentId: string,
    newText: string,
    userId: string,
    userName: string,
    reason?: string
  ): Promise<void> {
    await this.storage.updateSegment(
      consultationId,
      segmentId,
      newText,
      userId,
      userName,
      reason
    );

    console.log(`[TranscriptionService] Updated segment ${segmentId} in consultation ${consultationId}`);
  }

  /**
   * Get active transcription session
   */
  getActiveSession(consultationId: string): TranscriptionSession | undefined {
    return this.activeSessions.get(consultationId);
  }

  /**
   * Stop active transcription session
   */
  async stopSession(consultationId: string, userId: string, userName: string): Promise<Transcript | null> {
    const session = this.activeSessions.get(consultationId);

    if (!session) {
      return null;
    }

    console.log(`[TranscriptionService] Stopping session for consultation ${consultationId}`);

    // Stop session
    const transcript = await session.stop();

    // Save transcript
    await this.storage.saveTranscript(transcript, userId, userName);

    // Remove from active sessions
    this.activeSessions.delete(consultationId);

    return transcript;
  }

  /**
   * Get audit log for transcript access
   */
  async getAuditLog(consultationId: string): Promise<any[]> {
    return this.storage.getAuditLog(consultationId);
  }

  /**
   * Close service and cleanup
   */
  close(): void {
    // Stop all active sessions
    this.activeSessions.forEach((session, consultationId) => {
      console.log(`[TranscriptionService] Stopping active session: ${consultationId}`);
      session.stop().catch(console.error);
    });

    this.activeSessions.clear();

    // Close storage
    this.storage.close();

    console.log('[TranscriptionService] Service closed');
  }
}

// Export singleton instance
let transcriptionServiceInstance: TranscriptionService | null = null;

export function getTranscriptionService(): TranscriptionService {
  if (!transcriptionServiceInstance) {
    transcriptionServiceInstance = new TranscriptionService();
    // Initialize with default config
    transcriptionServiceInstance.initialize().catch(console.error);
  }
  return transcriptionServiceInstance;
}

export function setTranscriptionService(service: TranscriptionService): void {
  transcriptionServiceInstance = service;
}
