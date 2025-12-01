import axios, { AxiosInstance } from 'axios';
import { TranscriptionResult, AudioValidationResult, SupportedLanguage } from '../types/voice.types';

/**
 * AI Transcription Service
 * STUB IMPLEMENTATION: Placeholder for real AI service integration
 */
export class AITranscriptionService {
  private apiKey: string;
  private apiBaseUrl: string;
  private model: string;
  private maxRetries: number;
  private timeout: number;
  private client: AxiosInstance;

  constructor(config: {
    apiKey: string;
    apiBaseUrl: string;
    model?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.apiBaseUrl = config.apiBaseUrl;
    this.model = config.model || 'whisper-1';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async transcribeAudio(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.callTranscriptionAPI(audioFilePath, language);
        return result;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(
      `Transcription failed after ${this.maxRetries} retries: ${lastError?.message}`,
    );
  }

  async transcribeStream(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    return this.callStreamTranscriptionAPI(audioBuffer, language);
  }

  async validateAudioFile(audioFilePath: string): Promise<AudioValidationResult> {
    try {
      const supportedFormats = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
      const ext = audioFilePath
        .substring(audioFilePath.lastIndexOf('.'))
        .toLowerCase();

      if (!supportedFormats.includes(ext)) {
        return {
          valid: false,
          error: 'Invalid format',
        };
      }

      return {
        valid: true,
        format: ext,
        duration: 60,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  private async callTranscriptionAPI(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    const mockResponse: TranscriptionResult = {
      text: `[Transcribed audio content for ${audioFilePath}]`,
      confidence: 0.92,
      language,
      detectedLanguage: language,
      hasDoctor: false,
      hasPharmaTerms: false,
      keywords: [],
    };

    await this.delay(1000);
    return mockResponse;
  }

  private async callStreamTranscriptionAPI(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    const mockResponse: TranscriptionResult = {
      text: '[Streamed transcription result]',
      confidence: 0.88,
      language,
      detectedLanguage: language,
      hasDoctor: false,
      hasPharmaTerms: false,
      keywords: [],
    };

    await this.delay(500);
    return mockResponse;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
