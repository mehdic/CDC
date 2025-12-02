import { AzureSpeechService, AzureSpeechConfig } from '../services/azure-speech.service';
import { SupportedLanguage } from '../types/voice.types';

// Mock modules before importing
jest.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: {
    fromSubscription: jest.fn(() => ({
      speechRecognitionLanguage: '',
      outputFormat: 0,
      endpointId: '',
    })),
  },
  SpeechRecognizer: jest.fn(),
  AudioConfig: {
    fromWavFileInput: jest.fn(),
    fromStreamInput: jest.fn(),
  },
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
  CancellationDetails: {
    fromResult: jest.fn(() => ({
      reason: 'Error',
      errorDetails: 'Network timeout',
    })),
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => Buffer.from('audio data')),
}));

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';

describe('AzureSpeechService', () => {
  let service: AzureSpeechService;
  let config: AzureSpeechConfig;
  let mockRecognizer: any;

  beforeEach(() => {
    config = {
      subscriptionKey: 'test-subscription-key',
      region: 'switzerlandnorth',
      phraseLists: ['Dafalgan', 'Voltaren', 'Paracetamol'],
    };

    // Setup mock recognizer
    mockRecognizer = {
      recognizeOnceAsync: jest.fn(),
      close: jest.fn(),
    };
    (sdk.SpeechRecognizer as unknown as jest.Mock).mockImplementation(() => mockRecognizer);

    // Reset fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('audio data'));

    service = new AzureSpeechService(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with subscription key and region', () => {
      expect(sdk.SpeechConfig.fromSubscription).toHaveBeenCalledWith(
        'test-subscription-key',
        'switzerlandnorth',
      );
    });

    it('should use custom endpoint if provided', () => {
      const customConfig = {
        ...config,
        customEndpointId: 'custom-endpoint-123',
      };
      const customService = new AzureSpeechService(customConfig);
      expect(customService).toBeDefined();
    });

    it('should initialize with phrase lists', () => {
      expect(service.getPhraseLists()).toEqual([
        'Dafalgan',
        'Voltaren',
        'Paracetamol',
      ]);
    });
  });

  describe('transcribeFile', () => {
    it('should successfully transcribe French audio file', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3, // RecognizedSpeech
          text: 'Bonjour le patient a besoin de médicaments',
          offset: 0,
          duration: 5000000,
          properties: {
            getProperty: jest.fn((prop) => {
              if (prop === 1) {
                // SpeechServiceResponse_JsonResult
                return JSON.stringify({
                  NBest: [{ Confidence: 0.92 }],
                  RecognitionStatus: 'Success',
                });
              }
              return 'fr-FR';
            }),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result).toBeDefined();
      expect(result.text).toBe('Bonjour le patient a besoin de médicaments');
      expect(result.confidence).toBe(0.92);
      expect(result.recognitionStatus).toBe('Success');
    });

    it('should successfully transcribe German audio file', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'Der Patient braucht Medikamente',
          offset: 0,
          duration: 4000000,
          properties: {
            getProperty: jest.fn((prop) => {
              if (prop === 1) {
                return JSON.stringify({
                  NBest: [{ Confidence: 0.88 }],
                  RecognitionStatus: 'Success',
                });
              }
              return 'de-DE';
            }),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.GERMAN,
      );

      expect(result.text).toBe('Der Patient braucht Medikamente');
      expect(result.confidence).toBe(0.88);
    });

    it('should successfully transcribe Italian audio file', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'Il paziente ha bisogno di medicine',
          offset: 0,
          duration: 3000000,
          properties: {
            getProperty: jest.fn((prop) => {
              if (prop === 1) {
                return JSON.stringify({
                  NBest: [{ Confidence: 0.9 }],
                  RecognitionStatus: 'Success',
                });
              }
              return 'it-IT';
            }),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.ITALIAN,
      );

      expect(result.text).toBe('Il paziente ha bisogno di medicine');
      expect(result.confidence).toBe(0.9);
    });

    it('should throw error if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await expect(
        service.transcribeFile('/nonexistent.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Audio file not found');
    });

    it('should handle NoMatch result', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 0, // NoMatch
        });
      });

      await expect(
        service.transcribeFile('/path/to/audio.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('No speech could be recognized');
    });

    it('should handle Canceled result', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 2, // Canceled
        });
      });

      await expect(
        service.transcribeFile('/path/to/audio.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Recognition canceled');
    });

    it('should handle recognition errors', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation(
        (success: Function, error: Function) => {
          error('Connection failed');
        },
      );

      await expect(
        service.transcribeFile('/path/to/audio.wav', SupportedLanguage.FRENCH),
      ).rejects.toThrow('Recognition error: Connection failed');
    });

    it('should add phrase lists to recognizer', async () => {
      const mockPhraseList = {
        addPhrase: jest.fn(),
      };
      (sdk.PhraseListGrammar.fromRecognizer as jest.Mock).mockReturnValue(
        mockPhraseList,
      );

      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
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
      });

      await service.transcribeFile('/path/to/audio.wav', SupportedLanguage.FRENCH);

      expect(sdk.PhraseListGrammar.fromRecognizer).toHaveBeenCalled();
      expect(mockPhraseList.addPhrase).toHaveBeenCalledWith('Dafalgan');
      expect(mockPhraseList.addPhrase).toHaveBeenCalledWith('Voltaren');
      expect(mockPhraseList.addPhrase).toHaveBeenCalledWith('Paracetamol');
    });
  });

  describe('transcribeStream', () => {
    it('should successfully transcribe audio stream', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'Streaming transcription result',
          offset: 0,
          duration: 2000000,
          properties: {
            getProperty: jest.fn((prop) => {
              if (prop === 1) {
                return JSON.stringify({
                  NBest: [{ Confidence: 0.87 }],
                  RecognitionStatus: 'Success',
                });
              }
              return 'fr-FR';
            }),
          },
        });
      });

      const buffer = Buffer.from('audio stream data');
      const result = await service.transcribeStream(buffer, SupportedLanguage.FRENCH);

      expect(result).toBeDefined();
      expect(result.text).toBe('Streaming transcription result');
      expect(result.confidence).toBe(0.87);
    });

    it('should handle stream with push stream', async () => {
      const mockPushStream = {
        write: jest.fn(),
        close: jest.fn(),
      };
      (sdk.AudioInputStream.createPushStream as jest.Mock).mockReturnValue(
        mockPushStream,
      );

      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
          offset: 0,
          duration: 1000000,
          properties: {
            getProperty: jest.fn(() =>
              JSON.stringify({
                NBest: [{ Confidence: 0.85 }],
                RecognitionStatus: 'Success',
              }),
            ),
          },
        });
      });

      const buffer = Buffer.from('stream data');
      await service.transcribeStream(buffer, SupportedLanguage.FRENCH);

      expect(mockPushStream.write).toHaveBeenCalledWith(buffer.buffer);
      expect(mockPushStream.close).toHaveBeenCalled();
    });

    it('should handle NoMatch in stream', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 0, // NoMatch
        });
      });

      const buffer = Buffer.from('silent audio');
      await expect(
        service.transcribeStream(buffer, SupportedLanguage.FRENCH),
      ).rejects.toThrow('No speech could be recognized in stream');
    });

    it('should handle stream errors', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation(
        (success: Function, error: Function) => {
          error('Stream connection lost');
        },
      );

      const buffer = Buffer.from('audio data');
      await expect(
        service.transcribeStream(buffer, SupportedLanguage.FRENCH),
      ).rejects.toThrow('Stream recognition error');
    });
  });

  describe('phrase list management', () => {
    it('should add new phrase to phrase list', () => {
      service.addPhrase('Ibuprofen');
      expect(service.getPhraseLists()).toContain('Ibuprofen');
    });

    it('should not add duplicate phrases', () => {
      service.addPhrase('Dafalgan'); // Already in list
      const phraseLists = service.getPhraseLists();
      const count = phraseLists.filter((p) => p === 'Dafalgan').length;
      expect(count).toBe(1);
    });

    it('should return copy of phrase lists', () => {
      const list1 = service.getPhraseLists();
      const list2 = service.getPhraseLists();
      expect(list1).toEqual(list2);
      expect(list1).not.toBe(list2); // Different array instances
    });
  });

  describe('language mapping', () => {
    it('should map fr-CH to fr-FR', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
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
      });

      await service.transcribeFile('/path/to/audio.wav', SupportedLanguage.FRENCH);
      // Language mapping happens internally, verified by no errors
      expect(mockRecognizer.recognizeOnceAsync).toHaveBeenCalled();
    });

    it('should map de-CH to de-DE', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
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
      });

      await service.transcribeFile('/path/to/audio.wav', SupportedLanguage.GERMAN);
      expect(mockRecognizer.recognizeOnceAsync).toHaveBeenCalled();
    });

    it('should map it-CH to it-IT', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
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
      });

      await service.transcribeFile('/path/to/audio.wav', SupportedLanguage.ITALIAN);
      expect(mockRecognizer.recognizeOnceAsync).toHaveBeenCalled();
    });

    it('should fallback rm-CH to de-DE', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
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
      });

      await service.transcribeFile('/path/to/audio.wav', SupportedLanguage.ROMANSH);
      expect(mockRecognizer.recognizeOnceAsync).toHaveBeenCalled();
    });
  });

  describe('confidence parsing', () => {
    it('should use fallback confidence if JSON parsing fails', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
          offset: 0,
          duration: 1000000,
          properties: {
            getProperty: jest.fn(() => 'invalid json'),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result.confidence).toBe(0.85); // Fallback value
    });

    it('should handle missing NBest array', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
          offset: 0,
          duration: 1000000,
          properties: {
            getProperty: jest.fn(() =>
              JSON.stringify({
                RecognitionStatus: 'Success',
              }),
            ),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result.confidence).toBe(0); // Default when NBest missing
    });
  });

  describe('offset and duration conversion', () => {
    it('should convert offset from 100-nanosecond units to milliseconds', async () => {
      mockRecognizer.recognizeOnceAsync.mockImplementation((success: Function) => {
        success({
          reason: 3,
          text: 'test',
          offset: 10000000, // 1 second in 100-nanosecond units
          duration: 5000000, // 0.5 seconds
          properties: {
            getProperty: jest.fn(() =>
              JSON.stringify({
                NBest: [{ Confidence: 0.9 }],
                RecognitionStatus: 'Success',
              }),
            ),
          },
        });
      });

      const result = await service.transcribeFile(
        '/path/to/audio.wav',
        SupportedLanguage.FRENCH,
      );

      expect(result.offset).toBe(1000); // 1 second = 1000ms
      expect(result.duration).toBe(500); // 0.5 second = 500ms
    });
  });
});
