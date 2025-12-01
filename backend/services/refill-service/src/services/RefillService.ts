/**
 * Refill Service
 * Core business logic for prescription refill management
 * Tasks: T2-101, T2-103, T2-104, T2-105
 */

import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateRefillRequestDTO,
  ApproveRefillRequestDTO,
  DenyRefillRequestDTO,
  FillRefillRequestDTO,
  RefillRequestResponse,
  RefillHistoryResponse,
  EligibilityCheckResult,
  PrescriptionData,
} from '../types/refill.types';
import { RefillRequest, RefillStatus } from '../models/RefillRequest';
import { RefillHistory } from '../models/RefillHistory';
import { EligibilityService } from './EligibilityService';

export class RefillService {
  private refillRequestRepo: Repository<RefillRequest>;
  private refillHistoryRepo: Repository<RefillHistory>;
  private eligibilityService: EligibilityService;

  constructor(
    dataSource: DataSource,
    eligibilityService?: EligibilityService
  ) {
    this.refillRequestRepo = dataSource.getRepository(RefillRequest);
    this.refillHistoryRepo = dataSource.getRepository(RefillHistory);
    this.eligibilityService = eligibilityService || new EligibilityService();
  }

  /**
   * Create a new refill request from patient
   * Task: T2-101
   */
  async createRefillRequest(
    request: CreateRefillRequestDTO,
    prescription: PrescriptionData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RefillRequestResponse> {
    // Validate inputs
    if (!request.prescriptionId || !request.patientId || !request.pharmacyId) {
      throw new Error('Missing required fields: prescriptionId, patientId, pharmacyId');
    }

    // Check eligibility
    const eligibility = await this.eligibilityService.checkEligibility(
      prescription
    );

    if (!eligibility.isEligible) {
      throw new Error(
        `Prescription is not eligible for refill: ${eligibility.errors?.join(', ')}`
      );
    }

    // Create refill request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

    const refillRequest = new RefillRequest();
    refillRequest.id = uuidv4();
    refillRequest.prescriptionId = request.prescriptionId;
    refillRequest.patientId = request.patientId;
    refillRequest.pharmacyId = request.pharmacyId;
    refillRequest.quantityRequested = request.quantityRequested || 1;
    refillRequest.expiresAt = expiresAt;
    refillRequest.eligibilityCheckResult = eligibility;

    // Determine if auto-approve based on eligibility
    if (!eligibility.requiresManualApproval) {
      refillRequest.status = 'approved';
      refillRequest.decisionType = 'auto_approved';
      refillRequest.approvedAt = new Date();
    } else {
      refillRequest.status = 'pending';
    }

    // Save to database
    const saved = await this.refillRequestRepo.save(refillRequest);

    // Log to history
    await this.recordHistory({
      refillRequestId: saved.id,
      prescriptionId: request.prescriptionId,
      patientId: request.patientId,
      pharmacyId: request.pharmacyId,
      action: 'requested',
      details: {
        quantityRequested: request.quantityRequested || 1,
        autoApproved: !eligibility.requiresManualApproval,
      },
      ipAddress,
      userAgent,
    });

    return this.mapToResponse(saved);
  }

  /**
   * Approve a refill request (pharmacist action)
   * Task: T2-104
   */
  async approveRefill(
    request: ApproveRefillRequestDTO,
    ipAddress?: string
  ): Promise<RefillRequestResponse> {
    if (!request.refillRequestId || !request.pharmacistId) {
      throw new Error('Missing refillRequestId or pharmacistId');
    }

    const refillRequest = await this.refillRequestRepo.findOne({
      where: { id: request.refillRequestId },
    });

    if (!refillRequest) {
      throw new Error(`Refill request ${request.refillRequestId} not found`);
    }

    if (refillRequest.status !== 'pending') {
      throw new Error(
        `Cannot approve refill with status "${refillRequest.status}"`
      );
    }

    // Update refill request
    refillRequest.status = 'approved';
    refillRequest.decisionType = 'manual_reviewed';
    refillRequest.approvedAt = new Date();
    refillRequest.pharmacistId = request.pharmacistId;
    refillRequest.pharmacistNotes = request.notes;

    const saved = await this.refillRequestRepo.save(refillRequest);

    // Log to history
    await this.recordHistory({
      refillRequestId: saved.id,
      prescriptionId: saved.prescriptionId,
      patientId: saved.patientId,
      pharmacyId: saved.pharmacyId,
      pharmacistId: request.pharmacistId,
      action: 'approved',
      details: {
        notes: request.notes,
      },
      ipAddress,
    });

    return this.mapToResponse(saved);
  }

  /**
   * Deny a refill request with reason
   * Task: T2-104
   */
  async denyRefill(
    request: DenyRefillRequestDTO,
    ipAddress?: string
  ): Promise<RefillRequestResponse> {
    if (!request.refillRequestId || !request.pharmacistId || !request.denialReason) {
      throw new Error('Missing required fields');
    }

    const refillRequest = await this.refillRequestRepo.findOne({
      where: { id: request.refillRequestId },
    });

    if (!refillRequest) {
      throw new Error(`Refill request ${request.refillRequestId} not found`);
    }

    if (refillRequest.status !== 'pending') {
      throw new Error(
        `Cannot deny refill with status "${refillRequest.status}"`
      );
    }

    // Update refill request
    refillRequest.status = 'denied';
    refillRequest.decisionType = 'denied';
    refillRequest.pharmacistId = request.pharmacistId;
    refillRequest.denialReason = request.denialReason;

    const saved = await this.refillRequestRepo.save(refillRequest);

    // Log to history
    await this.recordHistory({
      refillRequestId: saved.id,
      prescriptionId: saved.prescriptionId,
      patientId: saved.patientId,
      pharmacyId: saved.pharmacyId,
      pharmacistId: request.pharmacistId,
      action: 'denied',
      details: {
        reason: request.denialReason,
      },
      ipAddress,
    });

    return this.mapToResponse(saved);
  }

  /**
   * Mark a refill as filled/dispensed
   * Task: T2-105
   */
  async fillRefill(
    request: FillRefillRequestDTO,
    ipAddress?: string
  ): Promise<RefillRequestResponse> {
    if (
      !request.refillRequestId ||
      !request.pharmacistId ||
      !request.quantityFilled
    ) {
      throw new Error('Missing required fields');
    }

    const refillRequest = await this.refillRequestRepo.findOne({
      where: { id: request.refillRequestId },
    });

    if (!refillRequest) {
      throw new Error(`Refill request ${request.refillRequestId} not found`);
    }

    if (refillRequest.status !== 'approved') {
      throw new Error(
        `Cannot fill refill with status "${refillRequest.status}". Must be approved first.`
      );
    }

    if (request.quantityFilled > refillRequest.quantityRequested) {
      throw new Error(
        `Cannot fill ${request.quantityFilled} units. Requested: ${refillRequest.quantityRequested}`
      );
    }

    // Update refill request
    refillRequest.status = 'filled';
    refillRequest.filledAt = request.filledAt || new Date();

    const saved = await this.refillRequestRepo.save(refillRequest);

    // Log to history
    await this.recordHistory({
      refillRequestId: saved.id,
      prescriptionId: saved.prescriptionId,
      patientId: saved.patientId,
      pharmacyId: saved.pharmacyId,
      pharmacistId: request.pharmacistId,
      action: 'filled',
      quantity: request.quantityFilled,
      ipAddress,
    });

    return this.mapToResponse(saved);
  }

  /**
   * Get refill request by ID
   */
  async getRefillRequest(refillRequestId: string): Promise<RefillRequestResponse | null> {
    const refillRequest = await this.refillRequestRepo.findOne({
      where: { id: refillRequestId },
    });

    if (!refillRequest) {
      return null;
    }

    return this.mapToResponse(refillRequest);
  }

  /**
   * Get all refill requests for a patient
   */
  async getPatientRefills(
    patientId: string,
    status?: RefillStatus,
    limit: number = 50
  ): Promise<RefillRequestResponse[]> {
    const query = this.refillRequestRepo
      .createQueryBuilder('r')
      .where('r.patientId = :patientId', { patientId });

    if (status) {
      query.andWhere('r.status = :status', { status });
    }

    const refillRequests = await query
      .orderBy('r.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return refillRequests.map((r) => this.mapToResponse(r));
  }

  /**
   * Get all refill requests for a pharmacy pending approval
   */
  async getPharmacyPendingRefills(
    pharmacyId: string,
    limit: number = 50
  ): Promise<RefillRequestResponse[]> {
    const refillRequests = await this.refillRequestRepo
      .createQueryBuilder('r')
      .where('r.pharmacyId = :pharmacyId', { pharmacyId })
      .andWhere('r.status = :status', { status: 'pending' })
      .orderBy('r.createdAt', 'ASC')
      .limit(limit)
      .getMany();

    return refillRequests.map((r) => this.mapToResponse(r));
  }

  /**
   * Get refill history for a prescription
   */
  async getRefillHistory(
    prescriptionId: string,
    limit: number = 100
  ): Promise<RefillHistoryResponse[]> {
    const history = await this.refillHistoryRepo
      .createQueryBuilder('h')
      .where('h.prescriptionId = :prescriptionId', { prescriptionId })
      .orderBy('h.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return history.map((h) => this.mapHistoryToResponse(h));
  }

  /**
   * Get refill history for a patient
   */
  async getPatientRefillHistory(
    patientId: string,
    limit: number = 100
  ): Promise<RefillHistoryResponse[]> {
    const history = await this.refillHistoryRepo
      .createQueryBuilder('h')
      .where('h.patientId = :patientId', { patientId })
      .orderBy('h.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return history.map((h) => this.mapHistoryToResponse(h));
  }

  /**
   * Mark expired refill requests as expired
   * Usually runs as a scheduled task
   */
  async expireOldRefillRequests(currentDate: Date = new Date()): Promise<number> {
    const result = await this.refillRequestRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'expired' as RefillStatus })
      .where('status = :status', { status: 'pending' })
      .andWhere('expiresAt < :currentDate', { currentDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Record action to refill history
   */
  private async recordHistory(historyData: {
    refillRequestId?: string;
    prescriptionId: string;
    patientId: string;
    pharmacyId: string;
    pharmacistId?: string;
    action: string;
    quantity?: number;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const history = new RefillHistory();
    history.id = uuidv4();
    history.refillRequestId = historyData.refillRequestId;
    history.prescriptionId = historyData.prescriptionId;
    history.patientId = historyData.patientId;
    history.pharmacyId = historyData.pharmacyId;
    history.pharmacistId = historyData.pharmacistId;
    history.action = historyData.action as any;
    history.quantity = historyData.quantity;
    history.details = historyData.details;
    history.ipAddress = historyData.ipAddress;
    history.userAgent = historyData.userAgent;

    await this.refillHistoryRepo.save(history);
  }

  /**
   * Map RefillRequest entity to API response
   */
  private mapToResponse(refillRequest: RefillRequest): RefillRequestResponse {
    return {
      id: refillRequest.id,
      prescriptionId: refillRequest.prescriptionId,
      patientId: refillRequest.patientId,
      pharmacyId: refillRequest.pharmacyId,
      status: refillRequest.status,
      quantityRequested: refillRequest.quantityRequested,
      decisionType: refillRequest.decisionType,
      approvedAt: refillRequest.approvedAt,
      filledAt: refillRequest.filledAt,
      expiresAt: refillRequest.expiresAt,
      createdAt: refillRequest.createdAt,
      updatedAt: refillRequest.updatedAt,
    };
  }

  /**
   * Map RefillHistory entity to API response
   */
  private mapHistoryToResponse(history: RefillHistory): RefillHistoryResponse {
    return {
      id: history.id,
      refillRequestId: history.refillRequestId,
      prescriptionId: history.prescriptionId,
      patientId: history.patientId,
      action: history.action,
      quantity: history.quantity,
      createdAt: history.createdAt,
    };
  }
}
