/**
 * Transcription Service Tests
 * Task: T3-018
 */

jest.mock('uuid');

import { TranscriptionService } from '../transcription-service';
import { MockTranscriptionProvider } from '../mock-transcription-provider';
import { TranscriptStorageService } from '../transcript-storage';
import { Transcript } from '../types';

// Mock storage to avoid file I/O in tests
jest.mock('../transcript-storage');

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let mockProvider: MockTranscriptionProvider;
  let mockStorage: jest.Mocked<TranscriptStorageService>;

  beforeEach(() => {
    mockProvider = new MockTranscriptionProvider();
    mockStorage = new TranscriptStorageService() as jest.Mocked<TranscriptStorageService>;

    // Mock storage methods
    mockStorage.saveTranscript = jest.fn().mockResolvedValue(undefined);
    mockStorage.getByConsultationId = jest.fn().mockResolvedValue(null);
    mockStorage.search = jest.fn().mockResolvedValue([]);
    mockStorage.updateSegment = jest.fn().mockResolvedValue(undefined);
    mockStorage.getAuditLog = jest.fn().mockResolvedValue([]);

    service = new TranscriptionService(mockProvider, mockStorage);
  });

  afterEach(() => {
    service.close();
  });

  describe('initialize', () => {
    it('should initialize service and provider', async () => {
      await service.initialize({});

      expect(mockProvider.isAvailable()).toBe(true);
    });
  });

  describe('transcribeRecording', () => {
    it('should transcribe recording and save to storage', async () => {
      await service.initialize({});

      const transcript = await service.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        { language: 'fr' },
        'user-123',
        'Dr. Martin'
      );

      expect(transcript).toBeDefined();
      expect(transcript.consultation_id).toBe('consultation-123');
      expect(mockStorage.saveTranscript).toHaveBeenCalledWith(
        transcript,
        'user-123',
        'Dr. Martin'
      );
    });

    it('should throw error if provider not available', async () => {
      // Don't initialize
      await expect(
        service.transcribeRecording(
          'consultation-123',
          'url',
          {},
          'user-123',
          'User'
        )
      ).rejects.toThrow('Transcription provider not available');
    });
  });

  describe('startStreamTranscription', () => {
    it('should start streaming session', async () => {
      await service.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await service.startStreamTranscription(
        'consultation-123',
        mockStream,
        { language: 'fr' },
        'user-123',
        'Dr. Martin'
      );

      expect(session).toBeDefined();
      expect(session.consultationId).toBe('consultation-123');

      // Session should be tracked
      const activeSession = service.getActiveSession('consultation-123');
      expect(activeSession).toBe(session);

      await session.stop();
    });

    it('should save transcript when session completes', async () => {
      await service.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await service.startStreamTranscription(
        'consultation-123',
        mockStream,
        { language: 'fr' },
        'user-123',
        'Dr. Martin'
      );

      // Trigger complete event
      const transcript: Transcript = {
        id: 'transcript-123',
        consultation_id: 'consultation-123',
        segments: [],
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (session as any).emit('complete', transcript);

      // Wait for async handler
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockStorage.saveTranscript).toHaveBeenCalledWith(
        transcript,
        'user-123',
        'Dr. Martin'
      );
    });
  });

  describe('getTranscript', () => {
    it('should retrieve transcript from storage', async () => {
      const mockTranscript: Transcript = {
        id: 'transcript-123',
        consultation_id: 'consultation-123',
        segments: [],
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockStorage.getByConsultationId.mockResolvedValue(mockTranscript);

      const transcript = await service.getTranscript(
        'consultation-123',
        'user-123',
        'User'
      );

      expect(transcript).toBe(mockTranscript);
      expect(mockStorage.getByConsultationId).toHaveBeenCalledWith(
        'consultation-123',
        'user-123',
        'User'
      );
    });
  });

  describe('searchTranscripts', () => {
    it('should search transcripts', async () => {
      const mockResults = [
        {
          transcript: {} as Transcript,
          consultation_id: 'consultation-123',
          matches: [],
          relevance_score: 1.0,
        },
      ];

      mockStorage.search.mockResolvedValue(mockResults);

      const results = await service.searchTranscripts(
        { search_text: 'test' },
        'user-123',
        'User'
      );

      expect(results).toBe(mockResults);
      expect(mockStorage.search).toHaveBeenCalled();
    });
  });

  describe('updateSegment', () => {
    it('should update transcript segment', async () => {
      await service.updateSegment(
        'consultation-123',
        'segment-1',
        'Updated text',
        'user-123',
        'User',
        'Correction'
      );

      expect(mockStorage.updateSegment).toHaveBeenCalledWith(
        'consultation-123',
        'segment-1',
        'Updated text',
        'user-123',
        'User',
        'Correction'
      );
    });
  });

  describe('stopSession', () => {
    it('should stop active session and save transcript', async () => {
      await service.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await service.startStreamTranscription(
        'consultation-123',
        mockStream,
        {},
        'user-123',
        'User'
      );

      const transcript = await service.stopSession(
        'consultation-123',
        'user-123',
        'User'
      );

      expect(transcript).toBeDefined();
      expect(mockStorage.saveTranscript).toHaveBeenCalled();

      // Session should be removed
      const activeSession = service.getActiveSession('consultation-123');
      expect(activeSession).toBeUndefined();
    });

    it('should return null if no active session', async () => {
      const transcript = await service.stopSession(
        'non-existent',
        'user-123',
        'User'
      );

      expect(transcript).toBeNull();
    });
  });

  describe('getAuditLog', () => {
    it('should retrieve audit log from storage', async () => {
      const mockAuditLog = [
        {
          id: 'audit-1',
          action: 'READ',
          user_id: 'user-123',
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorage.getAuditLog.mockResolvedValue(mockAuditLog);

      const auditLog = await service.getAuditLog('consultation-123');

      expect(auditLog).toBe(mockAuditLog);
      expect(mockStorage.getAuditLog).toHaveBeenCalledWith('consultation-123');
    });
  });

  describe('close', () => {
    it('should stop all active sessions and close storage', async () => {
      await service.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      await service.startStreamTranscription(
        'consultation-1',
        mockStream,
        {},
        'user-123',
        'User'
      );
      await service.startStreamTranscription(
        'consultation-2',
        mockStream,
        {},
        'user-123',
        'User'
      );

      service.close();

      expect(service.getActiveSession('consultation-1')).toBeUndefined();
      expect(service.getActiveSession('consultation-2')).toBeUndefined();
    });
  });
});
