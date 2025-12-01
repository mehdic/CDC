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

export interface CreateRecordingDTO {
  userId: string;
  userRole: string;
  conversationId?: string;
  appointmentId?: string;
  consultationType: string;
  language: SupportedLanguage;
  metadata?: Record<string, any>;
}

export interface RecordingFilter {
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
  language?: SupportedLanguage;
  minConfidence?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: SupportedLanguage;
  detectedLanguage: SupportedLanguage;
  hasDoctor: boolean;
  hasPharmaTerms: boolean;
  keywords: string[];
}

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  duration?: number;
}

export interface MedicalAnalysis {
  doctor: {
    hasTerms: boolean;
    terms: string[];
  };
  pharma: {
    hasTerms: boolean;
    terms: string[];
  };
  allKeywords: string[];
}

export interface VoiceStatistics {
  totalRecordings: number;
  totalTranscriptions: number;
  completedRecordings: number;
  failedRecordings: number;
  avgConfidence: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
