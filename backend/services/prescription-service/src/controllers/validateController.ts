/**
 * Validate Controller
 * Handles prescription safety validation (drug interactions, allergies, contraindications)
 * T084 - User Story 1: Prescription Processing & Validation
 * Based on: /specs/002-metapharm-platform/spec.md (FR-011, FR-012, FR-026, FR-027)
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { FDBService } from '../integrations/fdb';
import { AllergyChecker } from '../utils/allergyCheck';
import { ContraindicationChecker } from '../utils/contraindications';

export interface ValidationResult {
  prescription_id: string;
  status: 'validated' | 'warnings' | 'critical_issues';
  drug_interactions: {
    has_interactions: boolean;
    interactions: any[];
  };
  allergy_warnings: {
    has_allergies: boolean;
    warnings: any[];
  };
  contraindications: {
    has_contraindications: boolean;
    contraindications: any[];
  };
  critical_issues_found: boolean;
  can_approve: boolean;
  validation_timestamp: Date;
}

/**
 * POST /prescriptions/:id/validate
 * Perform comprehensive safety validation on a prescription
 */
export async function validatePrescription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dataSource: DataSource = req.app.locals.dataSource;

    // Find prescription with items
    const prescriptionRepo = dataSource.getRepository(Prescription);
    const prescription = await prescriptionRepo.findOne({
      where: { id },
      relations: ['items', 'patient'],
    });

    if (!prescription) {
      res.status(404).json({
        error: 'Prescription not found',
        code: 'PRESCRIPTION_NOT_FOUND',
      });
      return;
    }

    // Check if prescription can be validated (must not be in immutable state)
    if (!prescription.canBeEdited()) {
      res.status(400).json({
        error: `Cannot validate prescription in '${prescription.status}' state`,
        code: 'INVALID_STATE',
      });
      return;
    }

    // Check if prescription has items
    if (!prescription.items || prescription.items.length === 0) {
      res.status(400).json({
        error: 'Prescription has no items to validate',
        code: 'NO_ITEMS',
      });
      return;
    }

    // Extract medication names from prescription items
    const medications = prescription.items.map((item) => item.medication_name);

    // Initialize validation services
    const fdbService = new FDBService();
    const allergyChecker = new AllergyChecker();
    const contraindicationChecker = new ContraindicationChecker();

    // Run all safety checks in parallel
    const [drugInteractionResult, allergyResult, contraindicationResult] = await Promise.all([
      fdbService.checkDrugInteractions(medications),
      allergyChecker.checkAllergies(prescription.patient_id, medications),
      contraindicationChecker.checkContraindications(prescription.patient_id, medications),
    ]);

    // Sort interactions/warnings by severity (most severe first)
    const sortedInteractions = FDBService.sortBySeverity(drugInteractionResult.interactions);
    const sortedAllergyWarnings = AllergyChecker.sortBySeverity(allergyResult.warnings);
    const sortedContraindications = ContraindicationChecker.sortBySeverity(
      contraindicationResult.contraindications
    );

    // Check for critical issues that block approval
    const hasLifeThreateningAllergies = AllergyChecker.hasLifeThreateningAllergies(
      allergyResult.warnings
    );
    const hasAbsoluteContraindications = ContraindicationChecker.hasAbsoluteContraindications(
      contraindicationResult.contraindications
    );
    const hasCriticalInteractions = sortedInteractions.some(
      (interaction) => interaction.severity === 'contraindicated'
    );

    const criticalIssuesFound =
      hasLifeThreateningAllergies || hasAbsoluteContraindications || hasCriticalInteractions;

    // Update prescription with validation results
    prescription.drug_interactions = sortedInteractions;
    prescription.allergy_warnings = sortedAllergyWarnings;
    prescription.contraindications = sortedContraindications;

    // Transition to in_review status if still pending
    if (prescription.status === PrescriptionStatus.PENDING) {
      prescription.status = PrescriptionStatus.IN_REVIEW;
    }

    // Save updated prescription
    await prescriptionRepo.save(prescription);

    // Determine overall status
    const hasAnyWarnings =
      drugInteractionResult.hasInteractions ||
      allergyResult.hasAllergies ||
      contraindicationResult.hasContraindications;

    let validationStatus: 'validated' | 'warnings' | 'critical_issues';
    if (criticalIssuesFound) {
      validationStatus = 'critical_issues';
    } else if (hasAnyWarnings) {
      validationStatus = 'warnings';
    } else {
      validationStatus = 'validated';
    }

    // Build response
    const result: ValidationResult = {
      prescription_id: prescription.id,
      status: validationStatus,
      drug_interactions: {
        has_interactions: drugInteractionResult.hasInteractions,
        interactions: sortedInteractions,
      },
      allergy_warnings: {
        has_allergies: allergyResult.hasAllergies,
        warnings: sortedAllergyWarnings,
      },
      contraindications: {
        has_contraindications: contraindicationResult.hasContraindications,
        contraindications: sortedContraindications,
      },
      critical_issues_found: criticalIssuesFound,
      can_approve: !criticalIssuesFound,
      validation_timestamp: new Date(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('[Validate Controller] Error:', error);
    res.status(500).json({
      error: 'Failed to validate prescription',
      code: 'VALIDATION_ERROR',
      message: error.message,
    });
  }
}
