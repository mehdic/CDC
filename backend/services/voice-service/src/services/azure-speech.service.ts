import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';
import { SupportedLanguage } from '../types/voice.types';

/**
 * Azure Speech Recognition Result
 * Extended result with Azure-specific metadata
 */
export interface AzureSpeechResult {
  text: string;
  confidence: number;
  offset: number;
  duration: number;
  language: string;
  recognitionStatus: string;
}

/**
 * Azure Speech Configuration
 */
export interface AzureSpeechConfig {
  subscriptionKey: string;
  region: string;
  customEndpointId?: string;
  phraseLists?: string[];
}

/**
 * Azure Speech Service
 * Handles Azure Cognitive Services Speech-to-Text integration
 * Supports Swiss languages (fr-CH, de-CH, it-CH) with medical terminology
 */
export class AzureSpeechService {
  private speechConfig: sdk.SpeechConfig;
  private phraseLists: string[];

  constructor(config: AzureSpeechConfig) {
    // Initialize Azure Speech Config with Switzerland North region
    this.speechConfig = sdk.SpeechConfig.fromSubscription(
      config.subscriptionKey,
      config.region,
    );

    // Use custom endpoint if provided (for medical vocabulary models)
    if (config.customEndpointId) {
      this.speechConfig.endpointId = config.customEndpointId;
    }

    // Store phrase lists for medical terminology enhancement
    this.phraseLists = config.phraseLists || [];

    // Enable detailed output for confidence scores
    this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
  }

  /**
   * Transcribe audio file (batch processing)
   * @param audioFilePath - Path to audio file (WAV, MP3, OGG, FLAC, M4A)
   * @param language - Target language (fr-CH, de-CH, it-CH)
   * @returns Transcription result with confidence and metadata
   */
  async transcribeFile(
    audioFilePath: string,
    language: SupportedLanguage,
  ): Promise<AzureSpeechResult> {
    // Validate file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Set recognition language
    this.speechConfig.speechRecognitionLanguage = this.mapLanguage(language);

    // Create audio config from file
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync(audioFilePath),
    );

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

    // Add phrase lists for medical terminology
    this.addPhraseListsToRecognizer(recognizer);

    // Perform recognition
    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();

          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(this.parseResult(result));
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error('No speech could be recognized'));
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(
              new Error(
                `Recognition canceled: ${cancellation.reason} - ${cancellation.errorDetails}`,
              ),
            );
          } else {
            reject(new Error(`Recognition failed: ${result.reason}`));
          }
        },
        (error) => {
          recognizer.close();
          reject(new Error(`Recognition error: ${error}`));
        },
      );
    });
  }

  /**
   * Transcribe audio buffer (real-time streaming)
   * @param audioBuffer - Audio data buffer
   * @param language - Target language (fr-CH, de-CH, it-CH)
   * @returns Transcription result with confidence and metadata
   */
  async transcribeStream(
    audioBuffer: Buffer,
    language: SupportedLanguage,
  ): Promise<AzureSpeechResult> {
    // Set recognition language
    this.speechConfig.speechRecognitionLanguage = this.mapLanguage(language);

    // Create push stream for buffer input
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer.buffer as ArrayBuffer);
    pushStream.close();

    // Create audio config from stream
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

    // Add phrase lists for medical terminology
    this.addPhraseListsToRecognizer(recognizer);

    // Perform recognition
    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();

          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(this.parseResult(result));
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error('No speech could be recognized in stream'));
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(
              new Error(
                `Stream recognition canceled: ${cancellation.reason} - ${cancellation.errorDetails}`,
              ),
            );
          } else {
            reject(new Error(`Stream recognition failed: ${result.reason}`));
          }
        },
        (error) => {
          recognizer.close();
          reject(new Error(`Stream recognition error: ${error}`));
        },
      );
    });
  }

  /**
   * Add custom phrase lists to recognizer for medical terminology
   * Improves recognition accuracy for pharmacy-specific terms
   */
  private addPhraseListsToRecognizer(recognizer: sdk.SpeechRecognizer): void {
    if (this.phraseLists.length === 0) {
      return;
    }

    const phraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(recognizer);
    this.phraseLists.forEach((phrase) => {
      phraseListGrammar.addPhrase(phrase);
    });
  }

  /**
   * Parse Azure recognition result
   * Extracts text, confidence, and metadata
   */
  private parseResult(result: sdk.SpeechRecognitionResult): AzureSpeechResult {
    // Parse detailed JSON result for confidence score
    let confidence = 0.0;
    let recognitionStatus = 'Success';

    try {
      const jsonResult = JSON.parse(
        result.properties.getProperty(
          sdk.PropertyId.SpeechServiceResponse_JsonResult,
        ),
      );

      // Extract best hypothesis confidence
      if (jsonResult.NBest && jsonResult.NBest.length > 0) {
        confidence = jsonResult.NBest[0].Confidence || 0.0;
      }

      recognitionStatus = jsonResult.RecognitionStatus || 'Success';
    } catch (error) {
      // Fallback: Use default confidence if JSON parsing fails
      confidence = 0.85;
    }

    return {
      text: result.text,
      confidence,
      offset: result.offset / 10000, // Convert from 100-nanosecond units to milliseconds
      duration: result.duration / 10000, // Convert from 100-nanosecond units to milliseconds
      language: result.properties.getProperty(
        sdk.PropertyId.SpeechServiceConnection_RecoLanguage,
      ),
      recognitionStatus,
    };
  }

  /**
   * Map SupportedLanguage enum to Azure language codes
   * Azure uses de-DE, fr-FR, it-IT (covers Swiss variants)
   */
  private mapLanguage(language: SupportedLanguage): string {
    const languageMap: Record<SupportedLanguage, string> = {
      [SupportedLanguage.FRENCH]: 'fr-FR', // Standard French covers fr-CH
      [SupportedLanguage.GERMAN]: 'de-DE', // Standard German covers de-CH
      [SupportedLanguage.ITALIAN]: 'it-IT', // Standard Italian covers it-CH
      [SupportedLanguage.ROMANSH]: 'de-DE', // Fallback to German (Romansh not supported by Azure)
    };

    return languageMap[language];
  }

  /**
   * Add phrase to phrase list (dynamic medical terminology)
   * @param phrase - Medical term or drug name to improve recognition
   */
  addPhrase(phrase: string): void {
    if (!this.phraseLists.includes(phrase)) {
      this.phraseLists.push(phrase);
    }
  }

  /**
   * Get current phrase lists (for debugging/monitoring)
   */
  getPhraseLists(): string[] {
    return [...this.phraseLists];
  }
}
