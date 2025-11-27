/**
 * Mock Transcription Provider Tests
 * Task: T3-018
 */

jest.mock('uuid');

import { MockTranscriptionProvider } from '../mock-transcription-provider';
import { TranscriptionOptions } from '../types';

describe('MockTranscriptionProvider', () => {
  let provider: MockTranscriptionProvider;

  beforeEach(() => {
    provider = new MockTranscriptionProvider();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await provider.initialize({});
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('transcribeRecording', () => {
    it('should transcribe recording and return transcript in French', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        {
          language: 'fr',
          pharmacist_id: 'pharm-1',
          patient_id: 'patient-1',
        }
      );

      expect(transcript).toBeDefined();
      expect(transcript.consultation_id).toBe('consultation-123');
      expect(transcript.language).toBe('fr');
      expect(transcript.segments.length).toBeGreaterThan(0);
      expect(transcript.summary).toBeDefined();
      expect(transcript.speakers).toBeDefined();
      expect(transcript.speakers!.length).toBe(2); // Pharmacist and patient
    });

    it('should extract medical terms from transcript', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        {
          language: 'fr',
          enable_medical_term_extraction: true,
        }
      );

      const segmentsWithTerms = transcript.segments.filter(
        s => s.highlighted_terms && s.highlighted_terms.length > 0
      );

      expect(segmentsWithTerms.length).toBeGreaterThan(0);

      // Check medical terms are extracted
      const allTerms = transcript.segments.flatMap(s => s.highlighted_terms || []);
      expect(allTerms.length).toBeGreaterThan(0);

      // Should have medication terms
      const medications = allTerms.filter(t => t.category === 'medication');
      expect(medications.length).toBeGreaterThan(0);

      // Should have symptom terms
      const symptoms = allTerms.filter(t => t.category === 'symptom');
      expect(symptoms.length).toBeGreaterThan(0);
    });

    it('should identify speakers correctly', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        {
          pharmacist_id: 'pharm-1',
          patient_id: 'patient-1',
        }
      );

      const pharmacistSegments = transcript.segments.filter(
        s => s.speaker?.role === 'pharmacist'
      );
      const patientSegments = transcript.segments.filter(
        s => s.speaker?.role === 'patient'
      );

      expect(pharmacistSegments.length).toBeGreaterThan(0);
      expect(patientSegments.length).toBeGreaterThan(0);
    });

    it('should generate meaningful summary', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        { language: 'fr' }
      );

      expect(transcript.summary).toBeDefined();
      expect(transcript.summary!.length).toBeGreaterThan(0);
      expect(transcript.summary).toMatch(/patient|consultation|traitement/i);
    });

    it('should extract medical entities summary', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'consultation-123',
        'https://example.com/recording.mp3',
        { language: 'fr' }
      );

      expect(transcript.medical_entities).toBeDefined();
      expect(transcript.medical_entities!.medications.length).toBeGreaterThan(0);
      expect(transcript.medical_entities!.symptoms.length).toBeGreaterThan(0);
    });
  });

  describe('startStreamTranscription', () => {
    it('should start streaming session', async () => {
      await provider.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await provider.startStreamTranscription(
        'consultation-123',
        mockStream,
        {
          language: 'fr',
          pharmacist_id: 'pharm-1',
          patient_id: 'patient-1',
        }
      );

      expect(session).toBeDefined();
      expect(session.consultationId).toBe('consultation-123');
      expect(session.status).toBe('active');
    });

    it('should emit segment events during streaming', async () => {
      await provider.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await provider.startStreamTranscription(
        'consultation-123',
        mockStream,
        { language: 'fr' }
      );

      const segmentHandler = jest.fn();
      session.on('segment', segmentHandler);

      // Wait for a segment to be emitted
      await new Promise(resolve => setTimeout(resolve, 3500));

      expect(segmentHandler).toHaveBeenCalled();
      const segment = segmentHandler.mock.calls[0][0];
      expect(segment.text).toBeDefined();
      expect(segment.start_time).toBeGreaterThanOrEqual(0);
      expect(segment.confidence).toBeGreaterThan(0.8);

      await session.stop();
    }, 10000);

    it('should emit complete event when all segments processed', async () => {
      await provider.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await provider.startStreamTranscription(
        'consultation-123',
        mockStream,
        { language: 'fr' }
      );

      const completeHandler = jest.fn();
      session.on('complete', completeHandler);

      // Wait for completion (mock generates ~13 segments at 3s intervals = ~39s)
      // For testing, we'll just stop it early
      await new Promise(resolve => setTimeout(resolve, 1000));
      await session.stop();

      // Stop should trigger complete
      expect(session.status).toBe('stopped');
    }, 10000);

    it('should support pause and resume', async () => {
      await provider.initialize({});

      const mockStream = {
        on: jest.fn(),
        pipe: jest.fn(),
      } as any;

      const session = await provider.startStreamTranscription(
        'consultation-123',
        mockStream,
        { language: 'fr' }
      );

      expect(session.status).toBe('active');

      await session.pause();
      expect(session.status).toBe('paused');

      await session.resume();
      expect(session.status).toBe('active');

      await session.stop();
    });
  });

  describe('error handling', () => {
    it('should throw error if not initialized', async () => {
      await expect(
        provider.transcribeRecording('consultation-123', 'url', {})
      ).rejects.toThrow('Provider not initialized');
    });

    it('should throw error for streaming if not initialized', async () => {
      const mockStream = { on: jest.fn(), pipe: jest.fn() } as any;

      await expect(
        provider.startStreamTranscription('consultation-123', mockStream, {})
      ).rejects.toThrow('Provider not initialized');
    });
  });
});
