/**
 * Transcription Service Types
 * Defines interfaces for the transcription service
 * Task: T3-014
 */

/**
 * Speaker information for diarization
 */
export interface Speaker {
  id: string;
  name?: string;
  role?: 'pharmacist' | 'patient' | 'unknown';
}

/**
 * Transcript segment with timestamp and speaker
 */
export interface TranscriptSegment {
  id: string;
  text: string;
  start_time: number; // seconds from consultation start
  end_time: number;
  confidence: number; // 0-1
  speaker?: Speaker;
  highlighted_terms?: MedicalTerm[];
}

/**
 * Medical term extracted from transcript
 */
export interface MedicalTerm {
  term: string;
  category: 'medication' | 'symptom' | 'dosage' | 'frequency' | 'duration' | 'condition' | 'vital' | 'route' | 'anatomy' | 'procedure' | 'allergy';
  start_offset: number; // character offset in segment text
  end_offset: number;
  confidence: number;
}

/**
 * Complete transcript for a consultation
 */
export interface Transcript {
  id: string;
  consultation_id: string;
  segments: TranscriptSegment[];
  language: string; // ISO 639-1 code (e.g., 'fr' for French)
  created_at: string;
  updated_at: string;
  summary?: string;
  speakers?: Speaker[];
  medical_entities?: {
    medications: string[];
    symptoms: string[];
    conditions: string[];
    procedures: string[];
  };
}

/**
 * Transcription request options
 */
export interface TranscriptionOptions {
  language?: string; // Default: 'fr' (French for Swiss market)
  enable_speaker_diarization?: boolean; // Default: true
  enable_medical_term_extraction?: boolean; // Default: true
  audio_source?: 'stream' | 'recording'; // Default: 'stream'
  pharmacist_id?: string; // For speaker labeling
  patient_id?: string; // For speaker labeling
}

/**
 * Real-time transcription event
 */
export interface TranscriptionEvent {
  type: 'segment' | 'final' | 'error';
  data: TranscriptSegment | Transcript | { error: string };
  timestamp: number;
}

/**
 * Provider-agnostic transcription interface
 */
export interface TranscriptionProvider {
  /**
   * Provider name (e.g., 'mock', 'aws-transcribe', 'google-speech')
   */
  readonly name: string;

  /**
   * Initialize provider with configuration
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Start real-time transcription from audio stream
   */
  startStreamTranscription(
    consultationId: string,
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions
  ): Promise<TranscriptionSession>;

  /**
   * Transcribe a recorded audio file
   */
  transcribeRecording(
    consultationId: string,
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<Transcript>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): boolean;
}

/**
 * Active transcription session for streaming
 */
export interface TranscriptionSession {
  id: string;
  consultationId: string;
  status: 'active' | 'paused' | 'stopped';

  /**
   * Stop transcription
   */
  stop(): Promise<Transcript>;

  /**
   * Pause transcription
   */
  pause(): Promise<void>;

  /**
   * Resume transcription
   */
  resume(): Promise<void>;

  /**
   * Subscribe to transcription events
   */
  on(event: 'segment' | 'error' | 'complete', callback: (data: any) => void): void;
}

/**
 * Transcript storage record
 */
export interface TranscriptRecord {
  id: string;
  consultation_id: string;
  encrypted_content: string; // AES-256 encrypted JSON
  encryption_key_id: string; // Reference to encryption key
  language: string;
  total_segments: number;
  duration_seconds: number;
  speakers_count: number;
  created_at: string;
  updated_at: string;
  is_edited: boolean; // True if pharmacist made corrections
  edit_history?: EditHistoryEntry[];
}

/**
 * Edit history for transcript corrections
 */
export interface EditHistoryEntry {
  id: string;
  edited_at: string;
  edited_by_user_id: string;
  edited_by_name: string;
  segment_id: string;
  previous_text: string;
  new_text: string;
  reason?: string;
}

/**
 * Transcript search query
 */
export interface TranscriptSearchQuery {
  consultation_id?: string;
  patient_id?: string;
  pharmacist_id?: string;
  search_text?: string; // Full-text search in transcript
  medical_term?: string; // Search for specific medical term
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Transcript search result
 */
export interface TranscriptSearchResult {
  transcript: Transcript;
  consultation_id: string;
  matches: Array<{
    segment_id: string;
    text: string;
    context: string; // Surrounding text
    timestamp: number;
  }>;
  relevance_score: number;
}
