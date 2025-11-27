/**
 * Mock Transcription Provider
 * Simulates realistic transcription behavior for development and testing
 * Task: T3-015
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseTranscriptionProvider } from './transcription-provider.interface';
import {
  Transcript,
  TranscriptSegment,
  TranscriptionOptions,
  TranscriptionSession,
  Speaker,
  MedicalTerm,
} from './types';

/**
 * Mock transcription provider for development
 * Generates realistic French medical consultation transcripts
 */
export class MockTranscriptionProvider extends BaseTranscriptionProvider {
  readonly name = 'mock';

  private activeSession: MockTranscriptionSession | null = null;

  async initialize(config: Record<string, any>): Promise<void> {
    this.config = config;
    this.initialized = true;
    console.log('[MockTranscriptionProvider] Initialized');
  }

  async startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    console.log(`[MockTranscriptionProvider] Starting stream transcription for consultation ${consultationId}`);

    this.activeSession = new MockTranscriptionSession(
      consultationId,
      options.pharmacist_id || 'unknown-pharmacist',
      options.patient_id || 'unknown-patient',
      options
    );

    // Start generating mock segments
    this.activeSession.start();

    return this.activeSession;
  }

  async transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    console.log(`[MockTranscriptionProvider] Transcribing recording for consultation ${consultationId}: ${audioUrl}`);

    // Generate a complete mock transcript
    const segments = this.generateMockSegments(
      options.pharmacist_id || 'unknown-pharmacist',
      options.patient_id || 'unknown-patient',
      options.language || 'fr'
    );

    const transcript: Transcript = {
      id: uuidv4(),
      consultation_id: consultationId,
      segments,
      language: options.language || 'fr',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      summary: this.generateSummary(segments),
      speakers: this.extractSpeakers(segments),
      medical_entities: this.extractMedicalEntities(segments),
    };

    return transcript;
  }

  /**
   * Generate realistic mock transcript segments
   * Simulates a typical French-language pharmacy consultation
   */
  private generateMockSegments(
    pharmacistId: string,
    patientId: string,
    language: string
  ): TranscriptSegment[] {
    const pharmacist: Speaker = {
      id: pharmacistId,
      name: 'Dr. Martin',
      role: 'pharmacist',
    };

    const patient: Speaker = {
      id: patientId,
      name: 'Patient',
      role: 'patient',
    };

    // French medical consultation dialogue
    const dialogues = language === 'fr' ? [
      {
        speaker: pharmacist,
        text: 'Bonjour. Comment puis-je vous aider aujourd\'hui?',
        start: 0,
        end: 3.5,
      },
      {
        speaker: patient,
        text: 'Bonjour docteur. J\'ai des maux de tête depuis trois jours maintenant.',
        start: 4,
        end: 8.5,
      },
      {
        speaker: pharmacist,
        text: 'Je vois. Pouvez-vous décrire la douleur? Est-ce une douleur lancinante ou sourde?',
        start: 9,
        end: 14,
      },
      {
        speaker: patient,
        text: 'C\'est plutôt une douleur sourde, localisée au niveau du front. Elle s\'aggrave en fin de journée.',
        start: 14.5,
        end: 21,
      },
      {
        speaker: pharmacist,
        text: 'D\'accord. Avez-vous de la fièvre? Prenez-vous actuellement des médicaments?',
        start: 21.5,
        end: 26,
      },
      {
        speaker: patient,
        text: 'Non, pas de fièvre. Je prends du paracétamol 500mg de temps en temps, mais ça n\'aide pas beaucoup.',
        start: 26.5,
        end: 33,
      },
      {
        speaker: pharmacist,
        text: 'Je comprends. Avez-vous des allergies médicamenteuses connues?',
        start: 33.5,
        end: 37.5,
      },
      {
        speaker: patient,
        text: 'Non, aucune allergie.',
        start: 38,
        end: 40,
      },
      {
        speaker: pharmacist,
        text: 'Parfait. Je vais vous prescrire de l\'ibuprofène 400mg. Prenez un comprimé deux fois par jour pendant cinq jours, de préférence après les repas.',
        start: 40.5,
        end: 51,
      },
      {
        speaker: patient,
        text: 'D\'accord. Y a-t-il des effets secondaires que je devrais surveiller?',
        start: 51.5,
        end: 55.5,
      },
      {
        speaker: pharmacist,
        text: 'L\'ibuprofène peut parfois causer des douleurs à l\'estomac. Si vous ressentez des nausées ou des douleurs abdominales, arrêtez le traitement et contactez-moi.',
        start: 56,
        end: 65,
      },
      {
        speaker: patient,
        text: 'Très bien. Merci docteur.',
        start: 65.5,
        end: 67.5,
      },
      {
        speaker: pharmacist,
        text: 'Si les symptômes persistent après cinq jours ou s\'aggravent, revenez me voir. Prenez soin de vous.',
        start: 68,
        end: 75,
      },
    ] : [
      {
        speaker: pharmacist,
        text: 'Hello. How can I help you today?',
        start: 0,
        end: 2.5,
      },
      {
        speaker: patient,
        text: 'Hi doctor. I\'ve had headaches for three days now.',
        start: 3,
        end: 6.5,
      },
      {
        speaker: pharmacist,
        text: 'I see. Can you describe the pain? Is it throbbing or dull?',
        start: 7,
        end: 11,
      },
      {
        speaker: patient,
        text: 'It\'s more of a dull pain, located in the forehead area. It gets worse in the evening.',
        start: 11.5,
        end: 17,
      },
      {
        speaker: pharmacist,
        text: 'Okay. Do you have a fever? Are you currently taking any medications?',
        start: 17.5,
        end: 21.5,
      },
      {
        speaker: patient,
        text: 'No fever. I take paracetamol 500mg occasionally, but it doesn\'t help much.',
        start: 22,
        end: 27,
      },
      {
        speaker: pharmacist,
        text: 'I understand. Do you have any known drug allergies?',
        start: 27.5,
        end: 30.5,
      },
      {
        speaker: patient,
        text: 'No, no allergies.',
        start: 31,
        end: 32.5,
      },
      {
        speaker: pharmacist,
        text: 'Perfect. I\'m going to prescribe ibuprofen 400mg. Take one tablet twice daily for five days, preferably after meals.',
        start: 33,
        end: 42,
      },
      {
        speaker: patient,
        text: 'Okay. Are there any side effects I should watch for?',
        start: 42.5,
        end: 45.5,
      },
      {
        speaker: pharmacist,
        text: 'Ibuprofen can sometimes cause stomach upset. If you experience nausea or abdominal pain, stop the treatment and contact me.',
        start: 46,
        end: 54,
      },
      {
        speaker: patient,
        text: 'All right. Thank you, doctor.',
        start: 54.5,
        end: 56.5,
      },
      {
        speaker: pharmacist,
        text: 'If symptoms persist after five days or worsen, please come back. Take care.',
        start: 57,
        end: 62,
      },
    ];

    // Convert to transcript segments with medical term highlighting
    return dialogues.map(dialogue => ({
      id: uuidv4(),
      text: dialogue.text,
      start_time: dialogue.start,
      end_time: dialogue.end,
      confidence: 0.88 + Math.random() * 0.10, // 0.88-0.98
      speaker: dialogue.speaker,
      highlighted_terms: this.extractTermsFromText(dialogue.text, language),
    }));
  }

  /**
   * Extract medical terms from text segment
   */
  private extractTermsFromText(text: string, language: string): MedicalTerm[] {
    const terms: MedicalTerm[] = [];

    // French medical term patterns
    const patterns = language === 'fr' ? {
      medication: /(ibuprofène|paracétamol|aspirine|amoxicilline)/gi,
      symptom: /(maux de tête|douleur|fièvre|nausées|fatigue)/gi,
      dosage: /(\d+\s?mg)/gi,
      frequency: /(deux fois par jour|trois fois par jour|une fois par jour)/gi,
      duration: /(pendant \d+ jours?)/gi,
      allergy: /(allergie)/gi,
    } : {
      medication: /(ibuprofen|paracetamol|aspirin|amoxicillin)/gi,
      symptom: /(headache|pain|fever|nausea|fatigue)/gi,
      dosage: /(\d+\s?mg)/gi,
      frequency: /(twice daily|three times daily|once daily)/gi,
      duration: /(for \d+ days?)/gi,
      allergy: /(allergy)/gi,
    };

    Object.entries(patterns).forEach(([category, pattern]) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          terms.push({
            term: match[0],
            category: category as any,
            start_offset: match.index,
            end_offset: match.index + match[0].length,
            confidence: 0.85 + Math.random() * 0.10,
          });
        }
      }
    });

    return terms;
  }

  /**
   * Generate consultation summary from segments
   */
  private generateSummary(segments: TranscriptSegment[]): string {
    const fullText = segments.map(s => s.text).join(' ');

    // Extract key information
    const medications = segments
      .flatMap(s => s.highlighted_terms || [])
      .filter(t => t.category === 'medication')
      .map(t => t.term);

    const symptoms = segments
      .flatMap(s => s.highlighted_terms || [])
      .filter(t => t.category === 'symptom')
      .map(t => t.term);

    // Build summary
    const summary = [];
    if (symptoms.length > 0) {
      summary.push(`Patient présente: ${symptoms[0]}`);
    }
    if (medications.length > 0) {
      summary.push(`Traitement prescrit: ${medications[0]}`);
    }

    return summary.join('. ') || 'Consultation terminée.';
  }

  /**
   * Extract unique speakers from segments
   */
  private extractSpeakers(segments: TranscriptSegment[]): Speaker[] {
    const speakerMap = new Map<string, Speaker>();

    segments.forEach(segment => {
      if (segment.speaker) {
        speakerMap.set(segment.speaker.id, segment.speaker);
      }
    });

    return Array.from(speakerMap.values());
  }

  /**
   * Extract medical entities summary
   */
  private extractMedicalEntities(segments: TranscriptSegment[]) {
    const terms = segments.flatMap(s => s.highlighted_terms || []);

    return {
      medications: [...new Set(terms.filter(t => t.category === 'medication').map(t => t.term))],
      symptoms: [...new Set(terms.filter(t => t.category === 'symptom').map(t => t.term))],
      conditions: [...new Set(terms.filter(t => t.category === 'condition').map(t => t.term))],
      procedures: [...new Set(terms.filter(t => t.category === 'procedure').map(t => t.term))],
    };
  }
}

/**
 * Mock transcription session for streaming
 */
class MockTranscriptionSession extends EventEmitter implements TranscriptionSession {
  readonly id: string;
  readonly consultationId: string;
  status: 'active' | 'paused' | 'stopped' = 'active';

  private segments: TranscriptSegment[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private currentSegmentIndex = 0;

  constructor(
    consultationId: string,
    private pharmacistId: string,
    private patientId: string,
    private options: TranscriptionOptions
  ) {
    super();
    this.id = uuidv4();
    this.consultationId = consultationId;
  }

  /**
   * Start generating mock segments periodically
   */
  start(): void {
    console.log(`[MockTranscriptionSession] Starting session ${this.id}`);

    // Generate segments (reuse mock provider logic)
    const provider = new MockTranscriptionProvider();
    this.segments = (provider as any).generateMockSegments(
      this.pharmacistId,
      this.patientId,
      this.options.language || 'fr'
    );

    // Emit segments periodically (simulate real-time)
    this.intervalId = setInterval(() => {
      if (this.status === 'active' && this.currentSegmentIndex < this.segments.length) {
        const segment = this.segments[this.currentSegmentIndex];
        this.emit('segment', segment);
        this.currentSegmentIndex++;

        // Complete when all segments emitted
        if (this.currentSegmentIndex >= this.segments.length) {
          this.completeSession();
        }
      }
    }, 3000); // Emit a segment every 3 seconds
  }

  async stop(): Promise<Transcript> {
    console.log(`[MockTranscriptionSession] Stopping session ${this.id}`);
    this.status = 'stopped';

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    return this.buildTranscript();
  }

  async pause(): Promise<void> {
    console.log(`[MockTranscriptionSession] Pausing session ${this.id}`);
    this.status = 'paused';
  }

  async resume(): Promise<void> {
    console.log(`[MockTranscriptionSession] Resuming session ${this.id}`);
    this.status = 'active';
  }

  private completeSession(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const transcript = this.buildTranscript();
    this.emit('complete', transcript);
    this.status = 'stopped';
  }

  private buildTranscript(): Transcript {
    const provider = new MockTranscriptionProvider();

    return {
      id: uuidv4(),
      consultation_id: this.consultationId,
      segments: this.segments,
      language: this.options.language || 'fr',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      summary: (provider as any).generateSummary(this.segments),
      speakers: (provider as any).extractSpeakers(this.segments),
      medical_entities: (provider as any).extractMedicalEntities(this.segments),
    };
  }
}
