import { TranscriptionResult, AudioValidationResult, SupportedLanguage } from '../types/voice.types';
import { AzureSpeechService } from './azure-speech.service';
import { MedicalTerminologyService } from './medical-terminology.service';
import * as fs from 'fs';

/**
 * AI Transcription Service Configuration
 */
export interface AITranscriptionConfig {
  azureSubscriptionKey: string;
  azureRegion: string;
  azureCustomEndpointId?: string;
  medicalPhraseLists?: string[];
  maxRetries?: number;
  confidenceThreshold?: number;
}

/**
 * AI Transcription Service
 * Azure Cognitive Services Speech-to-Text integration for Swiss healthcare
 * Supports French, German, Italian with medical terminology
 */
export class AITranscriptionService {
  private azureSpeech: AzureSpeechService;
  private medicalTerms: MedicalTerminologyService;
  private maxRetries: number;
  private confidenceThreshold: number;

  constructor(config: AITranscriptionConfig) {
    // Initialize Azure Speech Service
    this.azureSpeech = new AzureSpeechService({
      subscriptionKey: config.azureSubscriptionKey,
      region: config.azureRegion,
      customEndpointId: config.azureCustomEndpointId,
      phraseLists: config.medicalPhraseLists || this.getDefaultMedicalPhrases(),
    });

    // Initialize Medical Terminology Service
    this.medicalTerms = new MedicalTerminologyService();

    // Configuration
    this.maxRetries = config.maxRetries || 3;
    this.confidenceThreshold = config.confidenceThreshold || 0.85;
  }

  /**
   * Get default medical phrase lists for Swiss pharmacy context
   */
  private getDefaultMedicalPhrases(): string[] {
    return [
      // Swiss-specific terms
      'Swissmedic',
      'Santésuisse',
      'HIN',
      'eHealth Suisse',
      'Tarmed',
      'LAMal',
      'OAMal',

      // Common Swiss drug brands
      'Dafalgan',
      'Voltaren',
      'Aspirin',
      'Paracetamol',
      'Metformine',
      'Amlodipine',
      'Simvastatine',
      'Oméprazole',
      'Ramipril',
      'Levothyroxine',

      // Medical terminology (multilingual)
      'prescription',
      'ordonnance',
      'Rezept',
      'ricetta',
      'posologie',
      'Dosierung',
      'dosaggio',
      'comprimé',
      'Tablette',
      'compressa',
      'gélule',
      'Kapsel',
      'capsula',
      'sirop',
      'Sirup',
      'sciroppo',
      'pommade',
      'Salbe',
      'pomata',
      'injection',
      'Injektion',
      'iniezione',
    ];
  }

  /**
   * Transcribe audio file with retry logic
   * @param audioFilePath - Path to audio file
   * @param language - Target language (fr-CH, de-CH, it-CH)
   * @returns TranscriptionResult with medical terminology analysis
   */
  async transcribeAudio(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    // Validate file exists
    const validation = await this.validateAudioFile(audioFilePath);
    if (!validation.valid) {
      throw new Error(`Audio validation failed: ${validation.error}`);
    }

    let lastError: Error | null = null;

    // Retry logic for network/API failures
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Call Azure Speech Service
        const azureResult = await this.azureSpeech.transcribeFile(
          audioFilePath,
          language,
        );

        // Check confidence threshold
        if (azureResult.confidence < this.confidenceThreshold) {
          console.warn(
            `Low confidence transcription: ${azureResult.confidence} (threshold: ${this.confidenceThreshold})`,
          );
        }

        // Analyze medical terminology
        const medicalAnalysis = this.medicalTerms.analyzeMedicalContent(
          azureResult.text,
        );

        // Return enriched transcription result
        return {
          text: azureResult.text,
          confidence: azureResult.confidence,
          language,
          detectedLanguage: language,
          hasDoctor: medicalAnalysis.doctor.hasTerms,
          hasPharmaTerms: medicalAnalysis.pharma.hasTerms,
          keywords: medicalAnalysis.allKeywords,
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        // Exponential backoff before retry
        if (attempt < this.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(
      `Transcription failed after ${this.maxRetries} retries: ${lastError?.message}`,
    );
  }

  /**
   * Transcribe audio stream (real-time)
   * @param audioBuffer - Audio data buffer
   * @param language - Target language (fr-CH, de-CH, it-CH)
   * @returns TranscriptionResult with medical terminology analysis
   */
  async transcribeStream(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    try {
      // Call Azure Speech Service for streaming
      const azureResult = await this.azureSpeech.transcribeStream(
        audioBuffer,
        language,
      );

      // Check confidence threshold
      if (azureResult.confidence < this.confidenceThreshold) {
        console.warn(
          `Low confidence stream transcription: ${azureResult.confidence}`,
        );
      }

      // Analyze medical terminology
      const medicalAnalysis = this.medicalTerms.analyzeMedicalContent(
        azureResult.text,
      );

      // Return enriched transcription result
      return {
        text: azureResult.text,
        confidence: azureResult.confidence,
        language,
        detectedLanguage: language,
        hasDoctor: medicalAnalysis.doctor.hasTerms,
        hasPharmaTerms: medicalAnalysis.pharma.hasTerms,
        keywords: medicalAnalysis.allKeywords,
      };
    } catch (error) {
      throw new Error(
        `Stream transcription failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate audio file format and existence
   * @param audioFilePath - Path to audio file
   * @returns Validation result with format and duration info
   */
  async validateAudioFile(audioFilePath: string): Promise<AudioValidationResult> {
    try {
      // Check file exists
      if (!fs.existsSync(audioFilePath)) {
        return {
          valid: false,
          error: 'File not found',
        };
      }

      // Check file format
      const supportedFormats = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
      const ext = audioFilePath
        .substring(audioFilePath.lastIndexOf('.'))
        .toLowerCase();

      if (!supportedFormats.includes(ext)) {
        return {
          valid: false,
          error: `Invalid format: ${ext}. Supported: ${supportedFormats.join(', ')}`,
        };
      }

      // Get file stats
      const stats = fs.statSync(audioFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Check file size (max 25MB for Azure Speech)
      if (fileSizeMB > 25) {
        return {
          valid: false,
          error: `File too large: ${fileSizeMB.toFixed(2)}MB (max 25MB)`,
        };
      }

      return {
        valid: true,
        format: ext,
        duration: 0, // Duration detection would require ffprobe
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Add custom medical phrase to recognition vocabulary
   * Useful for adding new drug names or Swiss-specific terms
   * @param phrase - Medical term to add
   */
  addMedicalPhrase(phrase: string): void {
    this.azureSpeech.addPhrase(phrase);
  }

  /**
   * Get current confidence threshold
   */
  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * Update confidence threshold (for tuning)
   * @param threshold - New threshold (0.0 to 1.0)
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.confidenceThreshold = threshold;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
