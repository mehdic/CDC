/**
 * Voice Service Unit Tests
 * Tests for voice recording and transcription service
 */

import { Repository } from 'typeorm';
import { VoiceService } from '../../services/voice.service';
import { AITranscriptionService } from '../../services/ai-transcription.service';
import { LanguageDetectionService } from '../../services/language-detection.service';
import { MedicalTerminologyService } from '../../services/medical-terminology.service';
import { VoiceRecording } from '../../entities/VoiceRecording';
import { Transcription } from '../../entities/Transcription';
import {
  RecordingStatus,
  TranscriptionStatus,
  SupportedLanguage,
} from '../../types/voice.types';

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let recordingRepository: jest.Mocked<Repository<VoiceRecording>>;
  let transcriptionRepository: jest.Mocked<Repository<Transcription>>;
  let aiService: jest.Mocked<AITranscriptionService>;
  let languageService: LanguageDetectionService;
  let medicalService: MedicalTerminologyService;

  beforeEach(() => {
    recordingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
    } as any;

    transcriptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
    } as any;

    aiService = {
      transcribeAudio: jest.fn(),
      validateAudioFile: jest.fn(),
      getSupportedLanguages: jest.fn(),
    } as any;

    languageService = new LanguageDetectionService();
    medicalService = new MedicalTerminologyService();

    voiceService = new VoiceService(
      recordingRepository,
      transcriptionRepository,
      aiService,
      languageService,
      medicalService,
    );
  });

  describe('createRecording', () => {
    it('should create a new recording with valid data', async () => {
      const mockRecording = {
        id: 'recording-123',
        userId: 'user-123',
        userRole: 'pharmacist',
        consultationType: 'teleconsultation',
        language: SupportedLanguage.FRENCH,
        status: RecordingStatus.PENDING,
        fileUrl: 'https://example.com/recordings/audio.wav',
        fileName: 'audio.wav',
      };

      recordingRepository.create.mockReturnValue(mockRecording as any);
      recordingRepository.save.mockResolvedValue(mockRecording as any);

      const result = await voiceService.createRecording(
        {
          userId: 'user-123',
          userRole: 'pharmacist',
          consultationType: 'teleconsultation',
          language: SupportedLanguage.FRENCH,
        },
        'https://example.com/recordings/audio.wav',
        'audio.wav',
      );

      expect(result).toEqual(mockRecording);
      expect(recordingRepository.create).toHaveBeenCalled();
      expect(recordingRepository.save).toHaveBeenCalledWith(mockRecording);
    });
  });

  describe('getRecordingById', () => {
    it('should return recording if found', async () => {
      const mockRecording = {
        id: 'recording-123',
        userId: 'user-123',
      };

      recordingRepository.findOne.mockResolvedValue(mockRecording as any);

      const result = await voiceService.getRecordingById('recording-123');

      expect(result).toEqual(mockRecording);
      expect(recordingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
      });
    });

    it('should return null if recording not found', async () => {
      recordingRepository.findOne.mockResolvedValue(null);

      const result = await voiceService.getRecordingById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listRecordings', () => {
    it('should list recordings with pagination', async () => {
      const mockRecordings = [
        { id: 'rec-1', userId: 'user-123' },
        { id: 'rec-2', userId: 'user-123' },
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockRecordings, 2]),
      };

      recordingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await voiceService.listRecordings({
        userId: 'user-123',
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        data: mockRecordings,
        total: 2,
      });
    });
  });

  describe('processRecording', () => {
    it('should process recording and create transcription', async () => {
      const mockRecording = {
        id: 'recording-123',
        userId: 'user-123',
        userRole: 'pharmacist',
        language: SupportedLanguage.FRENCH,
        status: RecordingStatus.PENDING,
        fileUrl: 'https://example.com/audio.wav',
        save: jest.fn(),
      };

      const mockTranscription = {
        id: 'trans-123',
        recordingId: 'recording-123',
        userId: 'user-123',
        userRole: 'pharmacist',
        status: TranscriptionStatus.COMPLETED,
        save: jest.fn(),
      };

      recordingRepository.findOne.mockResolvedValue(mockRecording as any);
      recordingRepository.save.mockResolvedValue(mockRecording as any);
      transcriptionRepository.create.mockReturnValue(mockTranscription as any);
      transcriptionRepository.save.mockResolvedValue(mockTranscription as any);

      aiService.validateAudioFile.mockResolvedValue({ valid: true });
      aiService.transcribeAudio.mockResolvedValue({
        text: 'Patient reports fever and cough',
        confidence: 0.95,
        language: SupportedLanguage.FRENCH,
        detectedLanguage: SupportedLanguage.FRENCH,
        hasDoctor: true,
        hasPharmaTerms: false,
        keywords: [],
      });

      const result = await voiceService.processRecording('recording-123');

      expect(result.status).toBe(TranscriptionStatus.COMPLETED);
      expect(result.text).toBe('Patient reports fever and cough');
    });

    it('should handle transcription failure gracefully', async () => {
      const mockRecording = {
        id: 'recording-123',
        userId: 'user-123',
        status: RecordingStatus.PENDING,
        fileUrl: 'https://example.com/audio.wav',
      };

      recordingRepository.findOne.mockResolvedValue(mockRecording as any);
      aiService.validateAudioFile.mockResolvedValue({ valid: false, error: 'Invalid file' });

      await expect(voiceService.processRecording('recording-123')).rejects.toThrow('Invalid file');
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording and associated transcription', async () => {
      const mockRecording = { id: 'recording-123' };
      const mockTranscription = { id: 'trans-123', recordingId: 'recording-123' };

      recordingRepository.findOne.mockResolvedValue(mockRecording as any);
      transcriptionRepository.findOne.mockResolvedValue(mockTranscription as any);
      transcriptionRepository.remove.mockResolvedValue({} as any);
      recordingRepository.remove.mockResolvedValue({} as any);

      await voiceService.deleteRecording('recording-123');

      expect(transcriptionRepository.remove).toHaveBeenCalledWith(mockTranscription);
      expect(recordingRepository.remove).toHaveBeenCalledWith(mockRecording);
    });

    it('should throw error if recording not found', async () => {
      recordingRepository.findOne.mockResolvedValue(null);

      await expect(voiceService.deleteRecording('nonexistent')).rejects.toThrow('Recording not found');
    });
  });

  describe('getStatistics', () => {
    it('should return service statistics', async () => {
      recordingRepository.count.mockResolvedValue(100);
      transcriptionRepository.count.mockResolvedValue(100);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '0.92' }),
      };

      transcriptionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const stats = await voiceService.getStatistics();

      expect(stats.totalRecordings).toBe(100);
      expect(stats.totalTranscriptions).toBe(100);
      expect(stats.avgConfidence).toBe(0.92);
    });
  });
});

describe('LanguageDetectionService', () => {
  let languageService: LanguageDetectionService;

  beforeEach(() => {
    languageService = new LanguageDetectionService();
  });

  describe('detectLanguage', () => {
    it('should detect French language', () => {
      const text = 'Bonjour, je suis un patient. Je me suis senti mal hier. Le docteur m\'a prescrit des médicaments.';
      const result = languageService.detectLanguage(text);

      expect(result.language).toBe(SupportedLanguage.FRENCH);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect German language', () => {
      const text = 'Guten Tag, ich bin ein Patient. Ich fühlte mich gestern unwohl. Der Arzt hat mir Medikamente verschrieben.';
      const result = languageService.detectLanguage(text);

      expect(result.language).toBe(SupportedLanguage.GERMAN);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should handle short text with default language', () => {
      const result = languageService.detectLanguage('Hi');

      expect(result.language).toBe(SupportedLanguage.FRENCH);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported languages', () => {
      expect(languageService.isSupported(SupportedLanguage.FRENCH)).toBe(true);
      expect(languageService.isSupported(SupportedLanguage.GERMAN)).toBe(true);
      expect(languageService.isSupported(SupportedLanguage.ITALIAN)).toBe(true);
    });
  });
});

describe('MedicalTerminologyService', () => {
  let medicalService: MedicalTerminologyService;

  beforeEach(() => {
    medicalService = new MedicalTerminologyService();
  });

  describe('detectDoctorTerms', () => {
    it('should detect doctor-related medical terms', () => {
      const text =
        'Le patient a une infection virale. Le diagnostic est pneumonie. J\'ai prescrit des antibiotiques.';
      const result = medicalService.detectDoctorTerms(text);

      expect(result.hasTerms).toBe(true);
      expect(result.terms.length).toBeGreaterThan(0);
      expect(result.terms).toContain('infection');
      expect(result.terms).toContain('diagnostic');
    });

    it('should return empty for non-medical text', () => {
      const text = 'This is a simple conversation about weather';
      const result = medicalService.detectDoctorTerms(text);

      expect(result.hasTerms).toBe(false);
      expect(result.terms.length).toBe(0);
    });
  });

  describe('detectPharmaTerms', () => {
    it('should detect pharmaceutical terms', () => {
      const text =
        'Prenez 2 comprimés de médicament trois fois par jour. Le dosage recommandé est 500mg. C\'est un anti-inflammatoire.';
      const result = medicalService.detectPharmaTerms(text);

      expect(result.hasTerms).toBe(true);
      expect(result.terms.length).toBeGreaterThan(0);
      expect(result.terms).toContain('médicament');
      expect(result.terms).toContain('comprimés');
    });
  });

  describe('extractKeywords', () => {
    it('should extract medical keywords from text', () => {
      const text =
        'Patient diagnosed with hypertension. Prescribed antihypertensive medication. Take 1 tablet daily.';
      const keywords = medicalService.extractKeywords(text);

      expect(keywords.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeMedicalContent', () => {
    it('should provide comprehensive medical analysis', () => {
      const text = 'Patient has diabetes. Prescribed insulin injections and antidiabetic medication.';
      const analysis = medicalService.analyzeMedicalContent(text);

      expect(analysis).toHaveProperty('doctor');
      expect(analysis).toHaveProperty('pharma');
      expect(analysis).toHaveProperty('allKeywords');
    });
  });
});
