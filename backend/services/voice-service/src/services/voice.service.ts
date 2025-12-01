/**
 * Voice Service
 * Main business logic for voice recording and transcription management
 */

import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { VoiceRecording } from '../entities/VoiceRecording';
import { Transcription } from '../entities/Transcription';
import {
  CreateRecordingDTO,
  UpdateTranscriptionDTO,
  VoiceRecordingFilter,
  TranscriptionFilter,
  RecordingStatus,
  TranscriptionStatus,
  SupportedLanguage,
} from '../types/voice.types';
import { AITranscriptionService } from './ai-transcription.service';
import { LanguageDetectionService } from './language-detection.service';
import { MedicalTerminologyService } from './medical-terminology.service';

export class VoiceService {
  constructor(
    private recordingRepository: Repository<VoiceRecording>,
    private transcriptionRepository: Repository<Transcription>,
    private aiService: AITranscriptionService,
    private languageService: LanguageDetectionService,
    private medicalService: MedicalTerminologyService,
  ) {}

  /**
   * Create a new voice recording
   */
  async createRecording(dto: CreateRecordingDTO, fileUrl: string, fileName: string): Promise<VoiceRecording> {
    const recording = this.recordingRepository.create({
      id: uuidv4(),
      userId: dto.userId,
      userRole: dto.userRole,
      conversationId: dto.conversationId,
      appointmentId: dto.appointmentId,
      consultationType: dto.consultationType,
      language: dto.language,
      fileUrl,
      fileName,
      metadata: dto.metadata,
      status: RecordingStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.recordingRepository.save(recording);
  }

  /**
   * Get recording by ID
   */
  async getRecordingById(id: string): Promise<VoiceRecording | null> {
    return this.recordingRepository.findOne({
      where: { id },
    });
  }

  /**
   * List recordings with filters
   */
  async listRecordings(filter: VoiceRecordingFilter): Promise<{ data: VoiceRecording[]; total: number }> {
    const query = this.recordingRepository.createQueryBuilder('recording');

    if (filter.userId) {
      query.andWhere('recording.userId = :userId', { userId: filter.userId });
    }
    if (filter.userRole) {
      query.andWhere('recording.userRole = :userRole', { userRole: filter.userRole });
    }
    if (filter.conversationId) {
      query.andWhere('recording.conversationId = :conversationId', { conversationId: filter.conversationId });
    }
    if (filter.appointmentId) {
      query.andWhere('recording.appointmentId = :appointmentId', { appointmentId: filter.appointmentId });
    }
    if (filter.status) {
      query.andWhere('recording.status = :status', { status: filter.status });
    }
    if (filter.language) {
      query.andWhere('recording.language = :language', { language: filter.language });
    }
    if (filter.startDate) {
      query.andWhere('recording.createdAt >= :startDate', { startDate: filter.startDate });
    }
    if (filter.endDate) {
      query.andWhere('recording.createdAt <= :endDate', { endDate: filter.endDate });
    }

    query.orderBy('recording.createdAt', 'DESC');

    const limit = filter.limit || 20;
    const offset = filter.offset || 0;

    query.take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  /**
   * Process recording and generate transcription
   */
  async processRecording(recordingId: string): Promise<Transcription> {
    const recording = await this.getRecordingById(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    try {
      // Update recording status
      recording.status = RecordingStatus.PROCESSING;
      recording.updatedAt = new Date();
      await this.recordingRepository.save(recording);

      // Create transcription record
      const transcription = this.transcriptionRepository.create({
        id: uuidv4(),
        recordingId,
        userId: recording.userId,
        userRole: recording.userRole,
        status: TranscriptionStatus.IN_PROGRESS,
        requestedLanguage: recording.language,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.transcriptionRepository.save(transcription);

      // Validate audio file
      const validation = await this.aiService.validateAudioFile(recording.fileUrl);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid audio file');
      }

      // Transcribe audio
      const startTime = Date.now();
      const result = await this.aiService.transcribeAudio(recording.fileUrl, recording.language);
      const processingTime = Date.now() - startTime;

      // Detect language if not matched
      let detectedLanguage = result.detectedLanguage || recording.language;
      if (!this.languageService.isSupported(detectedLanguage)) {
        detectedLanguage = recording.language;
      }

      // Analyze medical content
      const medicalAnalysis = this.medicalService.analyzeMedicalContent(result.text);

      // Update transcription with results
      transcription.text = result.text;
      transcription.confidence = result.confidence;
      transcription.detectedLanguage = detectedLanguage;
      transcription.hasDoctor = medicalAnalysis.doctor.hasTerms;
      transcription.hasPharmaTerms = medicalAnalysis.pharma.hasTerms;
      transcription.keywords = medicalAnalysis.allKeywords;
      transcription.status = TranscriptionStatus.COMPLETED;
      transcription.processingTime = processingTime;
      transcription.completedAt = new Date();
      transcription.updatedAt = new Date();
      transcription.metadata = {
        aiModel: 'whisper-1',
        processingDuration: processingTime,
        retryCount: 0,
      };

      await this.transcriptionRepository.save(transcription);

      // Update recording status
      recording.status = RecordingStatus.COMPLETED;
      recording.completedAt = new Date();
      recording.updatedAt = new Date();
      await this.recordingRepository.save(recording);

      return transcription;
    } catch (error) {
      // Mark as failed
      recording.status = RecordingStatus.FAILED;
      recording.error = error instanceof Error ? error.message : String(error);
      recording.updatedAt = new Date();
      await this.recordingRepository.save(recording);

      const transcription = await this.transcriptionRepository.findOne({
        where: { recordingId },
      });

      if (transcription) {
        transcription.status = TranscriptionStatus.FAILED;
        transcription.error = error instanceof Error ? error.message : String(error);
        transcription.updatedAt = new Date();
        await this.transcriptionRepository.save(transcription);
      }

      throw error;
    }
  }

  /**
   * Get transcription by ID
   */
  async getTranscriptionById(id: string): Promise<Transcription | null> {
    return this.transcriptionRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get transcription by recording ID
   */
  async getTranscriptionByRecordingId(recordingId: string): Promise<Transcription | null> {
    return this.transcriptionRepository.findOne({
      where: { recordingId },
    });
  }

  /**
   * List transcriptions with filters
   */
  async listTranscriptions(filter: TranscriptionFilter): Promise<{ data: Transcription[]; total: number }> {
    const query = this.transcriptionRepository.createQueryBuilder('transcription');

    if (filter.recordingId) {
      query.andWhere('transcription.recordingId = :recordingId', { recordingId: filter.recordingId });
    }
    if (filter.userId) {
      query.andWhere('transcription.userId = :userId', { userId: filter.userId });
    }
    if (filter.status) {
      query.andWhere('transcription.status = :status', { status: filter.status });
    }
    if (filter.language) {
      query.andWhere('transcription.detectedLanguage = :language', { language: filter.language });
    }
    if (filter.minConfidence !== undefined) {
      query.andWhere('transcription.confidence >= :minConfidence', { minConfidence: filter.minConfidence });
    }
    if (filter.startDate) {
      query.andWhere('transcription.createdAt >= :startDate', { startDate: filter.startDate });
    }
    if (filter.endDate) {
      query.andWhere('transcription.createdAt <= :endDate', { endDate: filter.endDate });
    }

    query.orderBy('transcription.createdAt', 'DESC');

    const limit = filter.limit || 20;
    const offset = filter.offset || 0;

    query.take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  /**
   * Delete recording and associated transcription
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = await this.getRecordingById(recordingId);
    if (!recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    // Delete associated transcription
    const transcription = await this.getTranscriptionByRecordingId(recordingId);
    if (transcription) {
      await this.transcriptionRepository.remove(transcription);
    }

    // Delete recording
    await this.recordingRepository.remove(recording);
  }

  /**
   * Get processing statistics
   */
  async getStatistics() {
    const totalRecordings = await this.recordingRepository.count();
    const totalTranscriptions = await this.transcriptionRepository.count();
    const completedRecordings = await this.recordingRepository.count({
      where: { status: RecordingStatus.COMPLETED },
    });
    const failedRecordings = await this.recordingRepository.count({
      where: { status: RecordingStatus.FAILED },
    });

    const avgConfidence = await this.transcriptionRepository
      .createQueryBuilder()
      .select('AVG(confidence)', 'avg')
      .where('status = :status', { status: TranscriptionStatus.COMPLETED })
      .getRawOne();

    return {
      totalRecordings,
      totalTranscriptions,
      completedRecordings,
      failedRecordings,
      avgConfidence: avgConfidence?.avg ? parseFloat(avgConfidence.avg) : 0,
    };
  }
}
