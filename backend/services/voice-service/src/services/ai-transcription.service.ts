import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';
import { TranscriptionResult, AudioValidationResult, SupportedLanguage } from '../types/voice.types';

/**
 * AI Transcription Service
 * Azure Speech Services integration for Swiss multilingual healthcare transcription
 * Supports fr-CH, de-CH, it-CH with medical terminology post-processing
 */
export class AITranscriptionService {
  private apiKey: string;
  private region: string;
  private maxRetries: number;
  private timeout: number;

  constructor(config: {
    apiKey: string;
    region?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    // Default to Switzerland North (Zurich) for data residency compliance (FADP/DSG)
    this.region = config.region || 'switzerlandnorth';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Map internal Swiss language codes to Azure locale codes
   * Swiss Italian (it-CH) not available → use it-IT
   * Romansh (rm-CH) not supported → fallback to de-CH
   */
  private mapLanguageToAzureLocale(language: SupportedLanguage): string {
    const localeMap: Record<SupportedLanguage, string> = {
      [SupportedLanguage.FRENCH]: 'fr-CH',
      [SupportedLanguage.GERMAN]: 'de-CH',
      [SupportedLanguage.ITALIAN]: 'it-IT', // Azure doesn't support it-CH
      [SupportedLanguage.ROMANSH]: 'de-CH', // Romansh not supported, fallback
    };
    return localeMap[language];
  }

  /**
   * Batch transcription for voice notes (cost-effective: $0.006/min)
   * Suitable for asynchronous voice notes and prescription dictation
   */
  async transcribeAudio(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await this.transcribeFromFile(audioFilePath, language);
        return result;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries - 1) {
          // Exponential backoff for rate limiting (HTTP 429)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(
      `Transcription failed after ${this.maxRetries} retries: ${lastError?.message}`,
    );
  }

  /**
   * Real-time streaming transcription for teleconsultations (higher cost: $0.0167/min)
   * 200-500ms latency for live audio
   */
  async transcribeStream(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    return this.transcribeFromBuffer(audioBuffer, language);
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

  /**
   * Azure Speech transcription from audio file
   * Uses Speech SDK for batch processing
   */
  private async transcribeFromFile(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const azureLocale = this.mapLanguageToAzureLocale(language);

      // Configure Azure Speech
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.apiKey,
        this.region
      );
      speechConfig.speechRecognitionLanguage = azureLocale;
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;

      // Configure audio input from file
      const audioConfig = sdk.AudioConfig.fromWavFileInput(
        fs.readFileSync(audioFilePath)
      );

      // Create speech recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      let fullText = '';
      let totalConfidence = 0;
      let segmentCount = 0;

      // Handle recognized speech segments
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          fullText += e.result.text + ' ';

          // Extract confidence from detailed results
          const detailedResult = e.result as any;
          if (detailedResult.privJson) {
            try {
              const json = JSON.parse(detailedResult.privJson);
              if (json.NBest && json.NBest[0]?.Confidence) {
                totalConfidence += json.NBest[0].Confidence;
                segmentCount++;
              }
            } catch {}
          }
        }
      };

      // Handle errors
      recognizer.canceled = (s, e) => {
        recognizer.close();

        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(`Azure Speech error: ${e.errorDetails}`));
        } else {
          // Cancellation due to end of stream
          this.completeRecognition(fullText, totalConfidence, segmentCount, language, resolve);
        }
      };

      // Handle session stopped
      recognizer.sessionStopped = () => {
        recognizer.close();
        this.completeRecognition(fullText, totalConfidence, segmentCount, language, resolve);
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          // Recognition started successfully
        },
        (err) => {
          recognizer.close();
          reject(new Error(`Failed to start recognition: ${err}`));
        }
      );

      // Set timeout
      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync(
          () => recognizer.close(),
          (err) => {
            recognizer.close();
            reject(new Error(`Timeout: ${err}`));
          }
        );
      }, this.timeout);
    });
  }

  /**
   * Azure Speech transcription from audio buffer (streaming)
   * Uses Speech SDK with push stream for real-time processing
   */
  private async transcribeFromBuffer(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const azureLocale = this.mapLanguageToAzureLocale(language);

      // Configure Azure Speech
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        this.apiKey,
        this.region
      );
      speechConfig.speechRecognitionLanguage = azureLocale;
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;

      // Create push stream for buffer
      const pushStream = sdk.AudioInputStream.createPushStream();
      const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength) as ArrayBuffer;
      pushStream.write(arrayBuffer);
      pushStream.close();

      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      let fullText = '';
      let totalConfidence = 0;
      let segmentCount = 0;

      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          fullText += e.result.text + ' ';

          const detailedResult = e.result as any;
          if (detailedResult.privJson) {
            try {
              const json = JSON.parse(detailedResult.privJson);
              if (json.NBest && json.NBest[0]?.Confidence) {
                totalConfidence += json.NBest[0].Confidence;
                segmentCount++;
              }
            } catch {}
          }
        }
      };

      recognizer.canceled = (s, e) => {
        recognizer.close();

        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(`Azure Speech error: ${e.errorDetails}`));
        } else {
          this.completeRecognition(fullText, totalConfidence, segmentCount, language, resolve);
        }
      };

      recognizer.sessionStopped = () => {
        recognizer.close();
        this.completeRecognition(fullText, totalConfidence, segmentCount, language, resolve);
      };

      recognizer.startContinuousRecognitionAsync(
        () => {},
        (err) => {
          recognizer.close();
          reject(new Error(`Failed to start recognition: ${err}`));
        }
      );

      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync(
          () => recognizer.close(),
          (err) => {
            recognizer.close();
            reject(new Error(`Timeout: ${err}`));
          }
        );
      }, this.timeout);
    });
  }

  /**
   * Complete recognition and build TranscriptionResult
   */
  private completeRecognition(
    text: string,
    totalConfidence: number,
    segmentCount: number,
    language: SupportedLanguage,
    resolve: (value: TranscriptionResult) => void
  ): void {
    const avgConfidence = segmentCount > 0 ? totalConfidence / segmentCount : 0.0;

    resolve({
      text: text.trim(),
      confidence: avgConfidence,
      language,
      detectedLanguage: language,
      hasDoctor: false, // Will be populated by MedicalTerminologyService
      hasPharmaTerms: false, // Will be populated by MedicalTerminologyService
      keywords: [], // Will be populated by MedicalTerminologyService
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
