/**
 * Voice Service Types
 * Defines TypeScript interfaces and enums for voice recording and transcription
 */

export enum RecordingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TranscriptionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SupportedLanguage {
  FRENCH = 'fr-CH',
  GERMAN = 'de-CH',
  ITALIAN = 'it-CH',
  ROMANSH = 'rm-CH',
}

export interface VoiceRecordingMetadata {
  duration: number; // in seconds
  fileSize: number; // in bytes
  mimeType: string;
  sampleRate: number;
  bitRate?: number;
  encoding?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number; // 0-1
  language: SupportedLanguage;
  detectedLanguage?: SupportedLanguage;
  hasDoctor?: boolean;
  hasPharmaTerms?: boolean;
  keywords?: string[];
}

export interface StreamTranscriptionRequest {
  recordingId: string;
  userId: string;
  userRole: 'pharmacist' | 'doctor' | 'nurse' | 'patient';
  language: SupportedLanguage;
  context?: string;
}

export interface StreamTranscriptionResponse {
  recordingId: string;
  interim: boolean;
  text: string;
  confidence?: number;
  isFinal?: boolean;
}

export interface CreateRecordingDTO {
  userId: string;
  userRole: 'pharmacist' | 'doctor' | 'nurse' | 'patient';
  conversationId?: string;
  appointmentId?: string;
  consultationType: 'teleconsultation' | 'voice_note' | 'dictation';
  language: SupportedLanguage;
  metadata?: VoiceRecordingMetadata;
}

export interface UpdateTranscriptionDTO {
  recordingId: string;
  status: TranscriptionStatus;
  transcriptionText?: string;
  confidence?: number;
  detectedLanguage?: SupportedLanguage;
  error?: string;
  processingTime?: number;
}

export interface VoiceRecordingFilter {
  userId?: string;
  userRole?: string;
  conversationId?: string;
  appointmentId?: string;
  status?: RecordingStatus;
  language?: SupportedLanguage;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TranscriptionFilter {
  recordingId?: string;
  userId?: string;
  status?: TranscriptionStatus;
  hasError?: boolean;
  minConfidence?: number;
  language?: SupportedLanguage;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AITranscriptionServiceConfig {
  apiKey: string;
  apiBaseUrl: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface LanguageDetectionConfig {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  confidenceThreshold?: number;
}

export interface MedicalTerminologyConfig {
  customDictionary?: Map<string, string>;
  enableDoctorDetection?: boolean;
  enablePharmaTermDetection?: boolean;
  termsFile?: string;
}
