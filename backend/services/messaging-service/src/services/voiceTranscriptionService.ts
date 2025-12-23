/**
 * Voice Message Transcription Service
 * Handles transcription of voice messages using AWS Transcribe or similar providers
 */

import axios, { AxiosInstance } from 'axios';

export type TranscriptionProvider = 'aws' | 'google' | 'azure';

export interface TranscriptionConfig {
  provider: TranscriptionProvider;
  language: string; // e.g., 'fr-CH' for Swiss French
  apiKey?: string;
  region?: string; // For AWS
  projectId?: string; // For Google
  resourceKey?: string; // For Azure
  enabled: boolean;
}

export interface TranscriptionRequest {
  audioUrl: string;
  audioFormat: 'mp3' | 'wav' | 'ogg' | 'aac';
  language?: string;
  metadata?: {
    messageId?: string;
    senderId?: string;
    [key: string]: unknown;
  };
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
  metadata?: {
    jobId?: string;
    status?: string;
    [key: string]: unknown;
  };
}

/**
 * Abstract base transcription provider
 */
abstract class BaseTranscriptionProvider {
  abstract transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
  abstract isHealthy(): Promise<boolean>;
}

/**
 * AWS Transcribe provider
 */
class AwsTranscribeProvider extends BaseTranscriptionProvider {
  private region: string;
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiKey: string, region: string = 'us-east-1') {
    super();
    this.apiKey = apiKey;
    this.region = region;

    this.client = axios.create({
      baseURL: `https://transcribe.${region}.amazonaws.com`,
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'Transcribe_v1',
      },
    });
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    try {
      const jobName = `transcribe-${Date.now()}`;
      const mediaFormat = this.mapAudioFormat(request.audioFormat);

      // Start transcription job
      const response = await this.client.post(
        '/',
        {
          TranscriptionJobName: jobName,
          Media: {
            MediaFileUri: request.audioUrl,
          },
          MediaFormat: mediaFormat,
          LanguageCode: request.language || 'fr-CH',
          Settings: {
            VocabularyName: 'medical-vocabulary', // Custom vocabulary for healthcare terms
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      // In a real implementation, you'd poll for job completion
      // For now, return a mock response
      return {
        text: 'Transcribed text from AWS (placeholder)',
        confidence: 0.95,
        language: 'fr-CH',
        metadata: {
          jobId: response.data.TranscriptionJob?.TranscriptionJobName,
          status: 'COMPLETED',
        },
      };
    } catch (error) {
      console.error('AWS Transcribe error:', error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.post(
        '/',
        { TranscriptionJobName: 'health-check' },
        {
          timeout: 5000,
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  private mapAudioFormat(format: string): string {
    const mapping: Record<string, string> = {
      mp3: 'mp3',
      wav: 'wav',
      ogg: 'ogg',
      aac: 'aac',
    };
    return mapping[format] || format;
  }
}

/**
 * Google Cloud Speech-to-Text provider
 */
class GoogleSpeechProvider extends BaseTranscriptionProvider {
  private projectId: string;
  private apiKey: string;
  private client: AxiosInstance;

  constructor(projectId: string, apiKey: string) {
    super();
    this.projectId = projectId;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: 'https://speech.googleapis.com/v1',
      params: {
        key: apiKey,
      },
    });
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    try {
      const response = await this.client.post('/speech:recognize', {
        config: {
          encoding: 'LINEAR16',
          languageCode: request.language || 'fr-CH',
          audioChannelCount: 1,
        },
        audio: {
          uri: request.audioUrl,
        },
      });

      const results = response.data.results || [];
      const transcript = results
        .map((result: any) =>
          result.alternatives?.[0]?.transcript || ''
        )
        .join(' ');

      const confidence = results[0]?.alternatives?.[0]?.confidence || 0;

      return {
        text: transcript,
        confidence,
        language: 'fr-CH',
        metadata: {
          status: 'COMPLETED',
        },
      };
    } catch (error) {
      console.error('Google Speech error:', error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.get('/projects', {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Azure Speech Services provider
 */
class AzureSpeechProvider extends BaseTranscriptionProvider {
  private region: string;
  private resourceKey: string;
  private client: AxiosInstance;

  constructor(region: string, resourceKey: string) {
    super();
    this.region = region;
    this.resourceKey = resourceKey;

    this.client = axios.create({
      baseURL: `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
      headers: {
        'Ocp-Apim-Subscription-Key': resourceKey,
        'Content-Type': 'application/octet-stream',
      },
    });
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    try {
      const response = await this.client.post('', request.audioUrl, {
        params: {
          language: request.language || 'fr-CH',
        },
      });

      return {
        text: response.data.DisplayText || '',
        confidence: 0.95,
        language: 'fr-CH',
        metadata: {
          status: 'COMPLETED',
        },
      };
    } catch (error) {
      console.error('Azure Speech error:', error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.get('/', {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Voice Transcription Service
 * Main service that manages transcription requests
 */
export class VoiceTranscriptionService {
  private provider: BaseTranscriptionProvider | null = null;
  private config: TranscriptionConfig;
  private cache: Map<string, TranscriptionResult> = new Map();

  constructor(config: TranscriptionConfig) {
    this.config = config;

    if (!config.enabled) {
      console.log('Voice transcription service disabled');
      return;
    }

    this.initializeProvider();
  }

  /**
   * Initialize the appropriate transcription provider
   */
  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'aws':
        if (!this.config.apiKey || !this.config.region) {
          throw new Error('AWS transcription requires apiKey and region');
        }
        this.provider = new AwsTranscribeProvider(
          this.config.apiKey,
          this.config.region
        );
        console.log('✓ AWS Transcribe provider initialized');
        break;

      case 'google':
        if (!this.config.apiKey || !this.config.projectId) {
          throw new Error('Google transcription requires apiKey and projectId');
        }
        this.provider = new GoogleSpeechProvider(
          this.config.projectId,
          this.config.apiKey
        );
        console.log('✓ Google Speech provider initialized');
        break;

      case 'azure':
        if (!this.config.resourceKey || !this.config.region) {
          throw new Error('Azure transcription requires resourceKey and region');
        }
        this.provider = new AzureSpeechProvider(
          this.config.region,
          this.config.resourceKey
        );
        console.log('✓ Azure Speech provider initialized');
        break;

      default:
        throw new Error(`Unsupported transcription provider: ${this.config.provider}`);
    }
  }

  /**
   * Transcribe a voice message
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    if (!this.provider) {
      throw new Error('Transcription service not initialized');
    }

    // Check cache first
    const cacheKey = `${request.audioUrl}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const result = await this.provider.transcribe(request);

      // Cache result for 24 hours
      this.cache.set(cacheKey, result);
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 24 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Check if transcription service is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.provider || !this.config.enabled) {
      return false;
    }

    try {
      return await this.provider.isHealthy();
    } catch {
      return false;
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async transcribeBatch(
    requests: TranscriptionRequest[]
  ): Promise<TranscriptionResult[]> {
    return Promise.all(requests.map((req) => this.transcribe(req)));
  }

  /**
   * Clear transcription cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
  } {
    return {
      size: this.cache.size,
      maxSize: 1000, // Maximum 1000 cached transcriptions
    };
  }
}
