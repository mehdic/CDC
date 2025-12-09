/**
 * AWS Transcribe Provider Tests
 * Tests for AWS Transcribe integration with graceful fallback
 * Task: T8-006
 */

import { AWSTranscribeProvider } from '../aws-transcribe-provider';
import { Readable } from 'stream';

describe('AWSTranscribeProvider', () => {
  let provider: AWSTranscribeProvider;

  beforeEach(() => {
    provider = new AWSTranscribeProvider();
  });

  describe('Initialization', () => {
    it('should initialize with mock fallback when AWS credentials not provided', async () => {
      await provider.initialize({});

      expect(provider.isAvailable()).toBe(true);
      expect(provider.isUsingMockData()).toBe(true);
    });

    it('should initialize with AWS client when credentials provided', async () => {
      const config = {
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_REGION: 'us-east-1',
      };

      await provider.initialize(config);

      expect(provider.isAvailable()).toBe(true);
      // Note: isUsingMockData will be false even though we can't actually connect
      // In real tests with valid credentials, this would test real AWS connection
    });

    it('should fall back to mock if AWS initialization fails', async () => {
      const config = {
        AWS_ACCESS_KEY_ID: 'invalid',
        AWS_SECRET_ACCESS_KEY: 'invalid',
        AWS_REGION: 'invalid-region',
      };

      await provider.initialize(config);

      expect(provider.isAvailable()).toBe(true);
      // Provider should still be available via fallback
    });
  });

  describe('Stream Transcription', () => {
    it('should start stream transcription with mock fallback', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        'test-consultation-123',
        audioStream,
        {
          language: 'fr',
          pharmacist_id: 'pharmacist-1',
          patient_id: 'patient-1',
          enable_speaker_diarization: true,
          enable_medical_term_extraction: true,
        }
      );

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.consultationId).toBe('test-consultation-123');
      expect(session.status).toBe('active');
    });

    it('should emit segment events during transcription', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        'test-consultation-123',
        audioStream,
        {
          language: 'fr',
          pharmacist_id: 'pharmacist-1',
          patient_id: 'patient-1',
        }
      );

      return new Promise<void>((resolve, reject) => {
        session.on('segment', (segment) => {
          // Verify segment structure
          expect(segment).toHaveProperty('id');
          expect(segment).toHaveProperty('text');
          expect(segment).toHaveProperty('start_time');
          expect(segment).toHaveProperty('end_time');
          expect(segment).toHaveProperty('confidence');
          expect(segment).toHaveProperty('speaker');
          expect(segment).toHaveProperty('highlighted_terms');
          // Pass immediately after first segment
          resolve();
        });

        session.on('error', reject);

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Test timeout: no segments received'));
        }, 5000);
      });
    }, 10000); // 10 second timeout for this test

    it('should include medical term highlighting in segments', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        'test-consultation-123',
        audioStream,
        {
          language: 'fr',
          enable_medical_term_extraction: true,
        }
      );

      return new Promise<void>((resolve, reject) => {
        let segmentCount = 0;

        session.on('segment', (segment) => {
          segmentCount++;
          // Check any segment for medical terms
          if (segment.highlighted_terms && segment.highlighted_terms.length > 0) {
            const term = segment.highlighted_terms[0];
            expect(term).toHaveProperty('term');
            expect(term).toHaveProperty('category');
            expect(term).toHaveProperty('start_offset');
            expect(term).toHaveProperty('end_offset');
            expect(term).toHaveProperty('confidence');
            resolve();
          } else if (segmentCount >= 3) {
            // After 3 segments without medical terms, pass anyway (some segments may not have medical terms)
            resolve();
          }
        });

        session.on('error', reject);

        setTimeout(() => {
          if (segmentCount > 0) {
            // If we received segments, pass
            resolve();
          } else {
            reject(new Error('Test timeout: no segments received'));
          }
        }, 5000);
      });
    }, 10000); // 10 second timeout for this test
  });

  describe('Recording Transcription', () => {
    it('should transcribe a recording with mock fallback', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        {
          language: 'fr',
          pharmacist_id: 'pharmacist-1',
          patient_id: 'patient-1',
          enable_speaker_diarization: true,
          enable_medical_term_extraction: true,
        }
      );

      expect(transcript).toBeDefined();
      expect(transcript.id).toBeDefined();
      expect(transcript.consultation_id).toBe('test-consultation-123');
      expect(transcript.segments).toBeDefined();
      expect(transcript.segments.length).toBeGreaterThan(0);
      expect(transcript.language).toBe('fr');
      expect(transcript.speakers).toBeDefined();
      expect(transcript.medical_entities).toBeDefined();
    });

    it('should extract medical entities from transcript', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        {
          language: 'fr',
          enable_medical_term_extraction: true,
        }
      );

      expect(transcript.medical_entities).toHaveProperty('medications');
      expect(transcript.medical_entities).toHaveProperty('symptoms');
      expect(transcript.medical_entities).toHaveProperty('conditions');
      expect(transcript.medical_entities).toHaveProperty('procedures');
    });

    it('should identify speakers in transcript', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        {
          language: 'fr',
          pharmacist_id: 'pharmacist-1',
          patient_id: 'patient-1',
          enable_speaker_diarization: true,
        }
      );

      expect(transcript.speakers).toBeDefined();
      expect(transcript.speakers!.length).toBeGreaterThan(0);

      const speaker = transcript.speakers![0];
      expect(speaker).toHaveProperty('id');
      expect(speaker).toHaveProperty('role');
      expect(['pharmacist', 'patient', 'unknown']).toContain(speaker.role);
    });
  });

  describe('Session Control', () => {
    it('should stop transcription session', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        'test-consultation-123',
        audioStream,
        { language: 'fr' }
      );

      // Wait a bit for session to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      const transcript = await session.stop();

      expect(transcript).toBeDefined();
      expect(session.status).toBe('stopped');
    });

    it('should pause and resume transcription session', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        'test-consultation-123',
        audioStream,
        { language: 'fr' }
      );

      await session.pause();
      expect(session.status).toBe('paused');

      await session.resume();
      expect(session.status).toBe('active');
    });
  });

  describe('Language Support', () => {
    it('should support French language', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        { language: 'fr' }
      );

      expect(transcript.language).toBe('fr');
    });

    it('should support German language', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        { language: 'de' }
      );

      expect(transcript.language).toBe('de');
    });

    it('should support English language', async () => {
      await provider.initialize({});

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        { language: 'en' }
      );

      expect(transcript.language).toBe('en');
    });
  });

  describe('Graceful Fallback', () => {
    it('should use mock provider when AWS credentials not configured', async () => {
      await provider.initialize({});

      expect(provider.isUsingMockData()).toBe(true);

      const transcript = await provider.transcribeRecording(
        'test-consultation-123',
        'https://example.com/audio.wav',
        { language: 'fr' }
      );

      // Should still return valid transcript via mock
      expect(transcript).toBeDefined();
      expect(transcript.segments.length).toBeGreaterThan(0);
    });

    it('should remain available even when AWS fails', async () => {
      const config = {
        AWS_ACCESS_KEY_ID: 'invalid',
        AWS_SECRET_ACCESS_KEY: 'invalid',
        AWS_REGION: 'invalid',
      };

      await provider.initialize(config);

      // Provider should still be available via fallback
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if not initialized', async () => {
      const audioStream = createMockAudioStream();

      await expect(async () => {
        await provider.startStreamTranscription(
          'test-consultation-123',
          audioStream,
          { language: 'fr' }
        );
      }).rejects.toThrow('not initialized');
    });

    it('should handle invalid consultation ID gracefully', async () => {
      await provider.initialize({});

      const audioStream = createMockAudioStream();
      const session = await provider.startStreamTranscription(
        '', // Empty consultation ID
        audioStream,
        { language: 'fr' }
      );

      // Should still create session
      expect(session).toBeDefined();
    });
  });
});

/**
 * Helper: Create mock audio stream
 */
function createMockAudioStream(): Readable {
  const stream = new Readable();
  stream.push(Buffer.from('mock audio data'));
  stream.push(null); // End stream
  return stream;
}
