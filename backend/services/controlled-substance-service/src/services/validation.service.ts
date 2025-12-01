import {
  PrescriptionValidationRequest,
  PrescriptionValidationResult,
  ControlledSubstanceData,
  DrugSchedule,
  ValidationRule,
} from '../types/controlled.types';
import { Repository } from 'typeorm';
import { ControlledSubstance } from '../entities/ControlledSubstance';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledPrescription } from '../entities/ControlledPrescription';
import { Alert } from '../entities/Alert';

/**
 * Controlled Substance Validation Service
 * Validates prescriptions against Swiss Swissmedic regulations
 * Enforces supply limits, dosage checks, and special form requirements
 */
export class ValidationService {
  private validationRules: Map<DrugSchedule, ValidationRule> = new Map([
    [
      DrugSchedule.LISTE_A,
      {
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
        maxDailyDosage: undefined, // Varies by substance
      },
    ],
    [
      DrugSchedule.LISTE_B,
      {
        schedule: DrugSchedule.LISTE_B,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
        maxDailyDosage: undefined,
      },
    ],
    [
      DrugSchedule.LISTE_C,
      {
        schedule: DrugSchedule.LISTE_C,
        maxSupplyDays: 90,
        requiresSpecialForm: false,
        maxDailyDosage: undefined,
      },
    ],
    [
      DrugSchedule.LISTE_D,
      {
        schedule: DrugSchedule.LISTE_D,
        maxSupplyDays: 180,
        requiresSpecialForm: false,
        maxDailyDosage: undefined,
      },
    ],
    [
      DrugSchedule.LISTE_E,
      {
        schedule: DrugSchedule.LISTE_E,
        maxSupplyDays: 365,
        requiresSpecialForm: false,
        maxDailyDosage: undefined,
      },
    ],
  ]);

  constructor(
    private substanceRepository: Repository<ControlledSubstance>,
    private dispensationRepository: Repository<DispensationLog>,
    private controlledPrescriptionRepository: Repository<ControlledPrescription>,
    private alertRepository: Repository<Alert>
  ) {}

  /**
   * Validates a controlled substance prescription against all rules
   */
  async validatePrescription(
    request: PrescriptionValidationRequest
  ): Promise<PrescriptionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const alerts: any[] = [];

    try {
      // Fetch substance details
      const substance = await this.substanceRepository.findOne({
        where: { id: request.substanceId },
      });

      if (!substance) {
        errors.push('Substance not found in controlled substances database');
        return {
          valid: false,
          warnings,
          errors,
          requiresPharmacistReview: true,
          alerts,
        };
      }

      // Validate special form requirement
      if (substance.requiresSpecialForm) {
        if (!request.specialFormNumber) {
          errors.push(
            `Special prescription form required for ${substance.name} (${substance.schedule})`
          );
        } else if (!this.validateSpecialFormNumber(request.specialFormNumber)) {
          errors.push('Invalid special prescription form number format');
        }
      }

      // Get validation rule
      const rule = this.validationRules.get(substance.schedule);
      if (!rule) {
        errors.push(`Unknown drug schedule: ${substance.schedule}`);
        return {
          valid: false,
          warnings,
          errors,
          requiresPharmacistReview: true,
          alerts,
        };
      }

      // Check supply days limit
      if (request.daysSupply > rule.maxSupplyDays) {
        errors.push(
          `Days supply (${request.daysSupply}) exceeds limit of ${rule.maxSupplyDays} days for ${substance.schedule}`
        );
      }

      // Check daily dosage
      if (substance.maxDailyDosageMg) {
        const dailyDosage =
          (request.dosagePerUnit * request.quantity) / request.daysSupply;
        if (dailyDosage > substance.maxDailyDosageMg) {
          errors.push(
            `Daily dosage (${dailyDosage}mg) exceeds maximum of ${substance.maxDailyDosageMg}mg`
          );
        }

        // Warning for high dosage
        if (
          substance.warningDailyDosageMg &&
          dailyDosage > substance.warningDailyDosageMg
        ) {
          warnings.push(
            `High dosage (${dailyDosage}mg) - exceeds warning threshold of ${substance.warningDailyDosageMg}mg`
          );
        }
      }

      // Check for doctor shopping (multi-pharmacy pattern)
      const recentDispensations = await this.dispensationRepository.find({
        where: {
          patientId: request.patientId,
          substanceId: request.substanceId,
        },
        order: { dispensedDate: 'DESC' },
        take: 10,
      });

      if (recentDispensations.length > 0) {
        // Check for frequent dispensations
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCount = recentDispensations.filter(
          (d) => d.dispensedDate > thirtyDaysAgo
        ).length;

        if (recentCount > 3) {
          warnings.push(
            `Patient has received ${recentCount} dispensations in past 30 days - potential abuse pattern`
          );
          alerts.push({
            type: 'FREQUENCY_ABUSE',
            severity: 'HIGH',
            message: `Frequent dispensations detected (${recentCount} in 30 days)`,
          });
        }

        // Check for multi-pharmacy pattern
        const pharmacyIds = new Set(
          recentDispensations.map((d) => d.pharmacyId)
        );
        if (pharmacyIds.size > 2) {
          warnings.push(
            `Patient has dispensations from ${pharmacyIds.size} different pharmacies - potential doctor shopping`
          );
          alerts.push({
            type: 'MULTI_PHARMACY',
            severity: 'MEDIUM',
            message: `Doctor shopping detected across ${pharmacyIds.size} pharmacies`,
          });
        }
      }

      // Check last dispensation timing
      if (recentDispensations.length > 0) {
        const lastDispensation = recentDispensations[0];
        const daysSinceLast = Math.floor(
          (Date.now() - lastDispensation.dispensedDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Flag if dispensation is too early
        if (daysSinceLast < lastDispensation.daysSupply * 0.8) {
          warnings.push(
            `Prescription is ${Math.round((lastDispensation.daysSupply * 0.8 - daysSinceLast) / 1)} days early`
          );
          alerts.push({
            type: 'FREQUENCY_ABUSE',
            severity: 'MEDIUM',
            message: 'Early refill detected',
          });
        }
      }

      const valid = errors.length === 0;
      const requiresPharmacistReview =
        !valid || warnings.length > 0 || alerts.length > 0;

      return {
        valid,
        warnings,
        errors,
        requiresPharmacistReview,
        alerts,
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        warnings,
        errors,
        requiresPharmacistReview: true,
        alerts,
      };
    }
  }

  /**
   * Validates special prescription form number format
   * Swiss special forms follow pattern: YYNNNNNN (YY = year, N = number)
   */
  private validateSpecialFormNumber(formNumber: string): boolean {
    // Pattern: 2-digit year + 6 digit number
    const pattern = /^\d{8}$/;
    if (!pattern.test(formNumber)) {
      return false;
    }

    // Check year is reasonable (within past 2 years)
    const yearPrefix = parseInt(formNumber.substring(0, 2));
    const currentYear = new Date().getFullYear() % 100;
    const yearDiff =
      currentYear >= yearPrefix
        ? currentYear - yearPrefix
        : 100 + currentYear - yearPrefix;

    return yearDiff <= 2;
  }

  /**
   * Gets validation rules for a drug schedule
   */
  getValidationRule(schedule: DrugSchedule): ValidationRule | undefined {
    return this.validationRules.get(schedule);
  }
}
