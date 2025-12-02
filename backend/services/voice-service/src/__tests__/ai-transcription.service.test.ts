import { AITranscriptionService, AITranscriptionConfig } from '../services/ai-transcription.service';
import { SupportedLanguage } from '../types/voice.types';
import * as fs from 'fs';

// Mock Azure Speech SDK
jest.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: {
    fromSubscription: jest.fn(() => ({
      speechRecognitionLanguage: '',
      outputFormat: 0,
      endpointId: '',
    })),
  },
  AudioConfig: {
    fromWavFileInput: jest.fn(),
    fromStreamInput: jest.fn(),
  },
  SpeechRecognizer: jest.fn().mockImplementation(() => ({
    recognizeOnceAsync: jest.fn((success, error) => {
      // Mock successful recognition
      success({
        reason: 3, // RecognizedSpeech
        text: 'Le patient a besoin de Dafalgan 500mg trois fois par jour',
        offset: 0,
        duration: 5000000,
        properties: {
          getProperty: jest.fn(() =>
            JSON.stringify({
              NBest: [{ Confidence: 0.92 }],
              RecognitionStatus: 'Success',
            }),
          ),
        },
      });
    }),
    close: jest.fn(),
  })),
  AudioInputStream: {
    createPushStream: jest.fn(() => ({
      write: jest.fn(),
      close: jest.fn(),
    })),
  },
  PhraseListGrammar: {
    fromRecognizer: jest.fn(() => ({
      addPhrase: jest.fn(),
    })),
  },
  OutputFormat: {
    Detailed: 1,
  },
  ResultReason: {
    RecognizedSpeech: 3,
    NoMatch: 0,
    Canceled: 2,
  },
  PropertyId: {
    SpeechServiceResponse_JsonResult: 1,
    SpeechServiceConnection_RecoLanguage: 2,
  },
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => Buffer.from('mock audio data')),
  statSync: jest.fn(() => ({
    size: 1024 * 1024, // 1MB
  })),
}));

describe('AITranscriptionService', () => {
  let service: AITranscriptionService;
  let config: AITranscriptionConfig;

  beforeEach(() => {
    // Reset SDK mocks before each test
    const sdk = require('microsoft-cognitiveservices-speech-sdk');
    sdk.SpeechRecognizer.mockImplementation(() => ({
      recognizeOnceAsync: jest.fn((success, error) => {
        // Default success behavior
        success({
          reason: 3, // RecognizedSpeech
          text: 'Le patient a besoin de Dafalgan 500mg trois fois par jour',
          offset: 0,
          duration: 5000000,
          properties: {
            getProperty: jest.fn(() =>
              JSON.stringify({
                NBest: [{ Confidence: 0.92 }],
                RecognitionStatus: 'Success',
              }),
            ),
          },
        });
      }),
      close: jest.fn(),
    }));

    config = {
      azureSubscriptionKey: 'test-key',
      azureRegion: 'switzerlandnorth',
      maxRetries: 3,
      confidenceThreshold: 0.85,
    };
    service = new AITranscriptionService(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe French audio file', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result).toBeDefined();
      expect(result.text).toContain('patient');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.language).toBe(SupportedLanguage.FRENCH);
      expect(result.hasPharmaTerms).toBe(true); // 'Dafalgan' detected
    });

    it('should successfully transcribe German audio file', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.GERMAN,
      );

      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.GERMAN);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should successfully transcribe Italian audio file', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.ITALIAN,
      );

      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.ITALIAN);
    });

    it('should detect medical terminology in transcription', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result.hasDoctor).toBe(true); // 'patient' is doctor term
      expect(result.hasPharmaTerms).toBe(true); // 'Dafalgan' is pharma term
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should fail validation for non-existent file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.transcribeAudio('/nonexistent/file.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Audio validation failed');
    });

    it('should fail validation for unsupported format', async () => {
      await expect(
        service.transcribeAudio('/path/to/audio.avi', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Audio validation failed');
    });

    it('should fail validation for file too large', async () => {
      (fs.statSync as jest.Mock).mockReturnValueOnce({
        size: 30 * 1024 * 1024, // 30MB
      });

      await expect(
        service.transcribeAudio('/path/to/large.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Audio validation failed');
    });

    it('should warn on low confidence transcription', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock low confidence result
      const sdk = require('microsoft-cognitiveservices-speech-sdk');
      sdk.SpeechRecognizer.mockImplementationOnce(() => ({
        recognizeOnceAsync: jest.fn((success) => {
          success({
            reason: 3,
            text: 'unclear audio',
            offset: 0,
            duration: 1000000,
            properties: {
              getProperty: jest.fn(() =>
                JSON.stringify({
                  NBest: [{ Confidence: 0.65 }],
                  RecognitionStatus: 'Success',
                }),
              ),
            },
          });
        }),
        close: jest.fn(),
      }));

      await service.transcribeAudio('/path/to/unclear.wav', SupportedLanguage.FRENCH);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low confidence transcription'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('transcribeStream', () => {
    it('should successfully transcribe audio stream', async () => {
      const buffer = Buffer.from('mock audio stream data');
      const result = await service.transcribeStream(buffer, SupportedLanguage.FRENCH);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.language).toBe(SupportedLanguage.FRENCH);
    });

    it('should detect medical terms in stream transcription', async () => {
      const buffer = Buffer.from('mock audio stream');
      const result = await service.transcribeStream(buffer, SupportedLanguage.FRENCH);

      expect(result.hasDoctor).toBeDefined();
      expect(result.hasPharmaTerms).toBeDefined();
      expect(result.keywords).toBeDefined();
    });

    it('should handle stream transcription errors', async () => {
      const sdk = require('microsoft-cognitiveservices-speech-sdk');
      sdk.SpeechRecognizer.mockImplementationOnce(() => ({
        recognizeOnceAsync: jest.fn((success, error) => {
          error('Network error');
        }),
        close: jest.fn(),
      }));

      const buffer = Buffer.from('mock audio');
      await expect(
        service.transcribeStream(buffer, SupportedLanguage.FRENCH),
      ).rejects.toThrow('Stream transcription failed');
    });
  });

  describe('validateAudioFile', () => {
    it('should validate supported audio formats', async () => {
      const formats = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

      for (const format of formats) {
        const result = await service.validateAudioFile(`/path/to/audio${format}`);
        expect(result.valid).toBe(true);
        expect(result.format).toBe(format);
      }
    });

    it('should reject unsupported formats', async () => {
      const result = await service.validateAudioFile('/path/to/video.mp4');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid format');
    });

    it('should reject non-existent files', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const result = await service.validateAudioFile('/nonexistent.wav');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should reject files exceeding size limit', async () => {
      (fs.statSync as jest.Mock).mockReturnValueOnce({
        size: 30 * 1024 * 1024, // 30MB
      });

      const result = await service.validateAudioFile('/path/to/large.wav');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });
  });

  describe('medical phrase management', () => {
    it('should add custom medical phrase', () => {
      expect(() => service.addMedicalPhrase('Ibuprofen')).not.toThrow();
    });

    it('should get confidence threshold', () => {
      const threshold = service.getConfidenceThreshold();
      expect(threshold).toBe(0.85);
    });

    it('should update confidence threshold', () => {
      service.setConfidenceThreshold(0.9);
      expect(service.getConfidenceThreshold()).toBe(0.9);
    });

    it('should reject invalid confidence threshold', () => {
      expect(() => service.setConfidenceThreshold(-0.1)).toThrow(
        'Confidence threshold must be between 0 and 1',
      );
      expect(() => service.setConfidenceThreshold(1.5)).toThrow(
        'Confidence threshold must be between 0 and 1',
      );
    });
  });

  describe('retry logic', () => {
    it('should retry on transient failures', async () => {
      const sdk = require('microsoft-cognitiveservices-speech-sdk');
      let attemptCount = 0;

      sdk.SpeechRecognizer.mockImplementation(() => ({
        recognizeOnceAsync: jest.fn((success, error) => {
          attemptCount++;
          if (attemptCount < 2) {
            error('Transient network error');
          } else {
            success({
              reason: 3,
              text: 'success after retry',
              offset: 0,
              duration: 1000000,
              properties: {
                getProperty: jest.fn(() =>
                  JSON.stringify({
                    NBest: [{ Confidence: 0.9 }],
                    RecognitionStatus: 'Success',
                  }),
                ),
              },
            });
          }
        }),
        close: jest.fn(),
      }));

      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result).toBeDefined();
      expect(result.text).toBe('success after retry');
      expect(attemptCount).toBe(2);
    });

    it('should fail after max retries exceeded', async () => {
      const sdk = require('microsoft-cognitiveservices-speech-sdk');

      sdk.SpeechRecognizer.mockImplementation(() => ({
        recognizeOnceAsync: jest.fn((success, error) => {
          error('Persistent error');
        }),
        close: jest.fn(),
      }));

      await expect(
        service.transcribeAudio('/path/to/audio.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Transcription failed after 3 retries');
    });
  });

  describe('Swiss language support', () => {
    it('should support French language', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );
      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.FRENCH);
    });

    it('should support German language', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.GERMAN,
      );
      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.GERMAN);
    });

    it('should support Italian language', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.ITALIAN,
      );
      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.ITALIAN);
    });

    it('should support Romansh language', async () => {
      const result = await service.transcribeAudio(
        '/path/to/audio.wav',
        SupportedLanguage.ROMANSH,
      );
      expect(result).toBeDefined();
      expect(result.language).toBe(SupportedLanguage.ROMANSH);
    });
  });

  describe('medical terminology detection', () => {
    it('should detect Swiss-specific medical terms', async () => {
      // Mock result with Swiss terms
      const sdk = require('microsoft-cognitiveservices-speech-sdk');
      sdk.SpeechRecognizer.mockImplementationOnce(() => ({
        recognizeOnceAsync: jest.fn((success) => {
          success({
            reason: 3,
            text: 'Prescription via Swissmedic pour Dafalgan et consultation Santésuisse',
            offset: 0,
            duration: 5000000,
            properties: {
              getProperty: jest.fn(() =>
                JSON.stringify({
                  NBest: [{ Confidence: 0.95 }],
                  RecognitionStatus: 'Success',
                }),
              ),
            },
          });
        }),
        close: jest.fn(),
      }));

      const result = await service.transcribeAudio(
        '/path/to/swiss.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result.hasPharmaTerms).toBe(true);
      expect(result.keywords).toContain('dafalgan');
      expect(result.keywords).toContain('prescription');
      expect(result.keywords).toContain('consultation');
    });
  });
});
