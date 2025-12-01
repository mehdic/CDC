import { VoiceService } from '../services/voice.service';
import {
  RecordingStatus,
  TranscriptionStatus,
  SupportedLanguage,
} from '../types/voice.types';
import { Repository } from 'typeorm';
import { VoiceRecording } from '../entities/VoiceRecording';
import { Transcription } from '../entities/Transcription';

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let recordingRepository: jest.Mocked<Repository<VoiceRecording>>;
  let transcriptionRepository: jest.Mocked<Repository<Transcription>>;
  let aiService: any;
  let languageService: any;
  let medicalService: any;

  beforeEach(() => {
    // Create mock repositories
    recordingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    transcriptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    // Create mock services
    aiService = {
      validateAudioFile: jest.fn(),
      transcribeAudio: jest.fn(),
      transcribeStream: jest.fn(),
    };

    languageService = {
      detectLanguage: jest.fn(),
      isSupported: jest.fn().mockReturnValue(true),
      getSupportedLanguages: jest.fn(),
      getDefaultLanguage: jest.fn(),
    };

    medicalService = {
      analyzeMedicalContent: jest.fn(),
      hasDoctorTerms: jest.fn(),
      hasPharmaTerms: jest.fn(),
    };

    voiceService = new VoiceService(
      recordingRepository,
      transcriptionRepository,
      aiService,
      languageService,
      medicalService,
    );
  });

  describe('createRecording', () => {
    it('should create a voice recording with valid data', async () => {
      const mockRecording: any = {
        id: 'test-id',
        userId: 'user-123',
        userRole: 'pharmacist',
        status: RecordingStatus.PENDING,
      };

      recordingRepository.create.mockReturnValue(mockRecording);
      recordingRepository.save.mockResolvedValue(mockRecording);

      const result = await voiceService.createRecording(
        {
          userId: 'user-123',
          userRole: 'pharmacist',
          consultationType: 'teleconsultation',
          language: SupportedLanguage.FRENCH,
        },
        'file://recording.wav',
        'recording.wav',
      );

      expect(recordingRepository.create).toHaveBeenCalled();
      expect(recordingRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(RecordingStatus.PENDING);
    });

    it('should set default recording status to PENDING', async () => {
      const mockRecording: any = {
        id: 'test-id',
        status: RecordingStatus.PENDING,
      };

      recordingRepository.create.mockReturnValue(mockRecording);
      recordingRepository.save.mockResolvedValue(mockRecording);

      await voiceService.createRecording(
        {
          userId: 'user-123',
          userRole: 'doctor',
          consultationType: 'voice-note',
          language: SupportedLanguage.GERMAN,
        },
        'file://recording.wav',
        'recording.wav',
      );

      const createCall = (recordingRepository.create.mock.calls[0][0] as any);
      expect(createCall.status).toBe(RecordingStatus.PENDING);
    });

    it('should include file metadata in recording', async () => {
      const mockRecording: any = { id: 'test-id' };
      recordingRepository.create.mockReturnValue(mockRecording);
      recordingRepository.save.mockResolvedValue(mockRecording);

      const metadata = { duration: 60, quality: 'high' };

      await voiceService.createRecording(
        {
          userId: 'user-123',
          userRole: 'nurse',
          consultationType: 'dictation',
          language: SupportedLanguage.ITALIAN,
          metadata,
        },
        'file://recording.wav',
        'recording.wav',
      );

      const createCall = (recordingRepository.create.mock.calls[0][0] as any);
      expect(createCall.metadata).toEqual(metadata);
    });
  });

  describe('getRecordingById', () => {
    it('should return recording when found', async () => {
      const mockRecording: any = { id: 'test-id', userId: 'user-123' };
      recordingRepository.findOne.mockResolvedValue(mockRecording);

      const result = await voiceService.getRecordingById('test-id');

      expect(recordingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockRecording);
    });

    it('should return null when recording not found', async () => {
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

      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([mockRecordings, 2]),
      };

      recordingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await voiceService.listRecordings({
        userId: 'user-123',
        limit: 20,
        offset: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should apply filters to listing', async () => {
      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      recordingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await voiceService.listRecordings({
        userId: 'user-123',
        status: RecordingStatus.COMPLETED,
        language: SupportedLanguage.FRENCH,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'recording.userId = :userId',
        { userId: 'user-123' },
      );
    });
  });

  describe('processRecording', () => {
    it('should process recording and create transcription', async () => {
      const mockRecording: any = {
        id: 'rec-123',
        userId: 'user-123',
        userRole: 'pharmacist',
        fileUrl: 'file://recording.wav',
        language: SupportedLanguage.FRENCH,
        status: RecordingStatus.PENDING,
        save: jest.fn(),
      };

      const mockTranscription: any = {
        id: 'trans-123',
        recordingId: 'rec-123',
        status: TranscriptionStatus.PENDING,
      };

      recordingRepository.findOne.mockResolvedValue(mockRecording);
      recordingRepository.save.mockResolvedValue(mockRecording);
      transcriptionRepository.create.mockReturnValue(mockTranscription);
      transcriptionRepository.save.mockResolvedValue(mockTranscription);

      aiService.validateAudioFile.mockResolvedValue({ valid: true });
      aiService.transcribeAudio.mockResolvedValue({
        text: 'Test transcription',
        confidence: 0.95,
        language: SupportedLanguage.FRENCH,
        detectedLanguage: SupportedLanguage.FRENCH,
        hasDoctor: true,
        hasPharmaTerms: true,
        keywords: ['doctor', 'medication'],
      });

      medicalService.analyzeMedicalContent.mockReturnValue({
        doctor: { hasTerms: true, terms: ['doctor'] },
        pharma: { hasTerms: true, terms: ['medication'] },
        allKeywords: ['doctor', 'medication'],
      });

      const result = await voiceService.processRecording('rec-123');

      expect(recordingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'rec-123' },
      });
      expect(aiService.validateAudioFile).toHaveBeenCalled();
      expect(aiService.transcribeAudio).toHaveBeenCalled();
      expect(transcriptionRepository.save).toHaveBeenCalled();
    });

    it('should throw error when recording not found', async () => {
      recordingRepository.findOne.mockResolvedValue(null);

      await expect(voiceService.processRecording('nonexistent')).rejects.toThrow(
        'Recording not found: nonexistent',
      );
    });

    it('should mark recording as FAILED on error', async () => {
      const mockRecording: any = {
        id: 'rec-123',
        userId: 'user-123',
        status: RecordingStatus.PENDING,
      };

      recordingRepository.findOne.mockResolvedValue(mockRecording);
      recordingRepository.save.mockResolvedValue(mockRecording);
      transcriptionRepository.create.mockReturnValue({});
      transcriptionRepository.save.mockResolvedValue({});

      aiService.validateAudioFile.mockRejectedValue(
        new Error('Invalid audio file'),
      );

      await expect(voiceService.processRecording('rec-123')).rejects.toThrow(
        'Invalid audio file',
      );

      // Check that recording was marked as failed
      const saveCall = recordingRepository.save.mock.calls.find(
        (call: any) => call[0].status === RecordingStatus.FAILED,
      );
      expect(saveCall).toBeDefined();
    });
  });

  describe('getTranscriptionById', () => {
    it('should return transcription when found', async () => {
      const mockTranscription: any = {
        id: 'trans-123',
        recordingId: 'rec-123',
      };

      transcriptionRepository.findOne.mockResolvedValue(mockTranscription);

      const result = await voiceService.getTranscriptionById('trans-123');

      expect(result).toEqual(mockTranscription);
    });

    it('should return null when transcription not found', async () => {
      transcriptionRepository.findOne.mockResolvedValue(null);

      const result = await voiceService.getTranscriptionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTranscriptionByRecordingId', () => {
    it('should return transcription for recording', async () => {
      const mockTranscription: any = {
        id: 'trans-123',
        recordingId: 'rec-123',
      };

      transcriptionRepository.findOne.mockResolvedValue(mockTranscription);

      const result = await voiceService.getTranscriptionByRecordingId('rec-123');

      expect(transcriptionRepository.findOne).toHaveBeenCalledWith({
        where: { recordingId: 'rec-123' },
      });
      expect(result).toEqual(mockTranscription);
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording and associated transcription', async () => {
      const mockRecording: any = { id: 'rec-123' };
      const mockTranscription: any = { id: 'trans-123' };

      recordingRepository.findOne.mockResolvedValue(mockRecording);
      transcriptionRepository.findOne.mockResolvedValue(mockTranscription);
      recordingRepository.remove.mockResolvedValue(undefined);
      transcriptionRepository.remove.mockResolvedValue(undefined);

      await voiceService.deleteRecording('rec-123');

      expect(transcriptionRepository.remove).toHaveBeenCalledWith(mockTranscription);
      expect(recordingRepository.remove).toHaveBeenCalledWith(mockRecording);
    });

    it('should throw error when recording not found', async () => {
      recordingRepository.findOne.mockResolvedValue(null);

      await expect(voiceService.deleteRecording('nonexistent')).rejects.toThrow(
        'Recording not found: nonexistent',
      );
    });
  });

  describe('getStatistics', () => {
    it('should return voice statistics', async () => {
      recordingRepository.count.mockResolvedValue(100);
      transcriptionRepository.count.mockResolvedValue(95);

      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '0.92' }),
      };

      transcriptionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const stats = await voiceService.getStatistics();

      expect(stats.totalRecordings).toBe(100);
      expect(stats.totalTranscriptions).toBe(95);
      expect(stats.avgConfidence).toBe(0.92);
    });
  });
});
