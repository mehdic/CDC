/**
 * List Controller
 * Handles prescription listing with filtering and pagination
 * T092 - User Story 1: Prescription Processing & Validation
 * Based on: /specs/002-metapharm-platform/spec.md
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';

export interface ListFilters {
  status?: PrescriptionStatus | PrescriptionStatus[];
  patient_id?: string;
  pharmacy_id?: string;
  pharmacist_id?: string;
  prescribing_doctor_id?: string;
  has_safety_warnings?: boolean;
  has_low_confidence?: boolean;
  date_from?: string;  // ISO date string
  date_to?: string;    // ISO date string
}

export interface ListPaginationParams {
  page?: number;       // Page number (1-indexed)
  limit?: number;      // Items per page (default: 20, max: 100)
  sort_by?: 'created_at' | 'updated_at' | 'approved_at';
  sort_order?: 'asc' | 'desc';
}

export interface ListResponse {
  prescriptions: any[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters_applied: ListFilters;
}

/**
 * GET /prescriptions
 * List prescriptions with filtering and pagination
 */
export async function listPrescriptions(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;

    // Parse filters from query parameters
    const filters: ListFilters = {
      status: parseStatusFilter(req.query.status as string),
      patient_id: req.query.patient_id as string,
      pharmacy_id: req.query.pharmacy_id as string,
      pharmacist_id: req.query.pharmacist_id as string,
      prescribing_doctor_id: req.query.prescribing_doctor_id as string,
      has_safety_warnings: parseBooleanFilter(req.query.has_safety_warnings as string),
      has_low_confidence: parseBooleanFilter(req.query.has_low_confidence as string),
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    // Parse pagination parameters
    const pagination: ListPaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100), // Max 100 items per page
      sort_by: (req.query.sort_by as any) || 'created_at',
      sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
    };

    // Build query
    const prescriptionRepo = dataSource.getRepository(Prescription);
    let queryBuilder = prescriptionRepo
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.items', 'items')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.prescribing_doctor', 'prescribing_doctor')
      .leftJoinAndSelect('prescription.pharmacist', 'pharmacist')
      .leftJoinAndSelect('prescription.treatment_plan', 'treatment_plan');

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder = queryBuilder.andWhere('prescription.status IN (:...statuses)', {
          statuses: filters.status,
        });
      } else {
        queryBuilder = queryBuilder.andWhere('prescription.status = :status', {
          status: filters.status,
        });
      }
    }

    if (filters.patient_id) {
      queryBuilder = queryBuilder.andWhere('prescription.patient_id = :patientId', {
        patientId: filters.patient_id,
      });
    }

    if (filters.pharmacy_id) {
      queryBuilder = queryBuilder.andWhere('prescription.pharmacy_id = :pharmacyId', {
        pharmacyId: filters.pharmacy_id,
      });
    }

    if (filters.pharmacist_id) {
      queryBuilder = queryBuilder.andWhere('prescription.pharmacist_id = :pharmacistId', {
        pharmacistId: filters.pharmacist_id,
      });
    }

    if (filters.prescribing_doctor_id) {
      queryBuilder = queryBuilder.andWhere(
        'prescription.prescribing_doctor_id = :prescribingDoctorId',
        { prescribingDoctorId: filters.prescribing_doctor_id }
      );
    }

    if (filters.has_safety_warnings !== undefined) {
      if (filters.has_safety_warnings) {
        // Has safety warnings: drug_interactions, allergy_warnings, or contraindications not empty
        //
        // SECURITY NOTE: These PostgreSQL JSONB function calls (jsonb_array_length) are SAFE
        // because they operate on column names only, not user input. TypeORM's query builder
        // properly parameterizes this query. No user input is concatenated into the SQL string.
        // The only dynamic input comes from the boolean filter value, which is validated above.
        queryBuilder = queryBuilder.andWhere(
          "(prescription.drug_interactions IS NOT NULL AND jsonb_array_length(prescription.drug_interactions) > 0) OR " +
          "(prescription.allergy_warnings IS NOT NULL AND jsonb_array_length(prescription.allergy_warnings) > 0) OR " +
          "(prescription.contraindications IS NOT NULL AND jsonb_array_length(prescription.contraindications) > 0)"
        );
      } else {
        // No safety warnings
        //
        // SECURITY NOTE: Safe JSONB function calls - see comment above.
        queryBuilder = queryBuilder.andWhere(
          "(prescription.drug_interactions IS NULL OR jsonb_array_length(prescription.drug_interactions) = 0) AND " +
          "(prescription.allergy_warnings IS NULL OR jsonb_array_length(prescription.allergy_warnings) = 0) AND " +
          "(prescription.contraindications IS NULL OR jsonb_array_length(prescription.contraindications) = 0)"
        );
      }
    }

    if (filters.has_low_confidence !== undefined) {
      if (filters.has_low_confidence) {
        queryBuilder = queryBuilder.andWhere('prescription.ai_confidence_score < :threshold', {
          threshold: 80,
        });
      } else {
        queryBuilder = queryBuilder.andWhere(
          'prescription.ai_confidence_score >= :threshold OR prescription.ai_confidence_score IS NULL',
          { threshold: 80 }
        );
      }
    }

    if (filters.date_from) {
      queryBuilder = queryBuilder.andWhere('prescription.created_at >= :dateFrom', {
        dateFrom: new Date(filters.date_from),
      });
    }

    if (filters.date_to) {
      queryBuilder = queryBuilder.andWhere('prescription.created_at <= :dateTo', {
        dateTo: new Date(filters.date_to),
      });
    }

    // Apply sorting
    const sortColumn = pagination.sort_by || 'created_at';
    const sortOrder = pagination.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder = queryBuilder.orderBy(`prescription.${sortColumn}`, sortOrder);

    // Count total items (before pagination)
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const skip = (pagination.page! - 1) * pagination.limit!;
    queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

    // Execute query
    const prescriptions = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / pagination.limit!);
    const hasNextPage = pagination.page! < totalPages;
    const hasPrevPage = pagination.page! > 1;

    // Build response
    const response: ListResponse = {
      prescriptions: prescriptions.map(sanitizePrescription),
      pagination: {
        page: pagination.page!,
        limit: pagination.limit!,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
      },
      filters_applied: filters,
    };

    res.json(response);
  } catch (error: any) {
    console.error('[List Controller] Error:', error);
    res.status(500).json({
      error: 'Failed to list prescriptions',
      code: 'LIST_ERROR',
      message: error.message,
    });
  }
}

/**
 * Parse status filter from query string
 * Supports single status or comma-separated list
 */
function parseStatusFilter(status: string | undefined): PrescriptionStatus | PrescriptionStatus[] | undefined {
  if (!status) {
    return undefined;
  }

  if (status.includes(',')) {
    return status.split(',').map((s) => s.trim() as PrescriptionStatus);
  }

  return status as PrescriptionStatus;
}

/**
 * Parse boolean filter from query string
 */
function parseBooleanFilter(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return value === 'true' || value === '1';
}

/**
 * Sanitize prescription object for API response
 * Remove sensitive or unnecessary fields
 */
function sanitizePrescription(prescription: Prescription): any {
  return {
    id: prescription.id,
    pharmacy_id: prescription.pharmacy_id,
    patient_id: prescription.patient_id,
    prescribing_doctor_id: prescription.prescribing_doctor_id,
    pharmacist_id: prescription.pharmacist_id,
    source: prescription.source,
    image_url: prescription.image_url,
    ai_confidence_score: prescription.ai_confidence_score,
    status: prescription.status,
    rejection_reason: prescription.rejection_reason,
    drug_interactions: prescription.drug_interactions,
    allergy_warnings: prescription.allergy_warnings,
    contraindications: prescription.contraindications,
    prescribed_date: prescription.prescribed_date,
    expiry_date: prescription.expiry_date,
    treatment_plan_id: prescription.treatment_plan_id,
    created_at: prescription.created_at,
    updated_at: prescription.updated_at,
    approved_at: prescription.approved_at,
    approved_by_pharmacist_id: prescription.approved_by_pharmacist_id,
    items: prescription.items,
    has_safety_warnings: prescription.hasSafetyWarnings(),
    has_low_confidence: prescription.hasLowConfidence(),
    can_be_edited: prescription.canBeEdited(),
  };
}
