import { Repository } from 'typeorm';
import {
  ControlledSubstanceData,
  DispensationLogEntry,
  PatientControlledHistory,
  DrugSchedule,
  AlertType,
  AlertSeverity,
} from '../types/controlled.types';
import { ControlledSubstance } from '../entities/ControlledSubstance';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledPrescription } from '../entities/ControlledPrescription';
import { Alert } from '../entities/Alert';

/**
 * Controlled Substance Service
 * Main service for managing controlled substances and dispensations
 */
export class ControlledSubstanceService {
  constructor(
    private substanceRepository: Repository<ControlledSubstance>,
    private dispensationRepository: Repository<DispensationLog>,
    private controlledPrescriptionRepository: Repository<ControlledPrescription>,
    private alertRepository: Repository<Alert>
  ) {}

  /**
   * Creates or updates a controlled substance
   */
  async createOrUpdateSubstance(
    data: ControlledSubstanceData
  ): Promise<ControlledSubstance> {
    let substance = await this.substanceRepository.findOne({
      where: { name: data.name },
    });

    if (!substance) {
      substance = this.substanceRepository.create({
        name: data.name,
        scientificName: data.scientificName,
        schedule: data.schedule,
        maxSupplyDays: data.maxSupplyDays,
        requiresSpecialForm: data.requiresSpecialForm,
        crossPharmacyCheck: data.crossPharmacyCheck,
        description: data.description,
        swissmedic: data.swissmedic,
      });
    } else {
      substance.scientificName = data.scientificName;
      substance.schedule = data.schedule;
      substance.maxSupplyDays = data.maxSupplyDays;
      substance.requiresSpecialForm = data.requiresSpecialForm;
      substance.crossPharmacyCheck = data.crossPharmacyCheck;
      substance.description = data.description;
      substance.swissmedic = data.swissmedic;
    }

    return this.substanceRepository.save(substance);
  }

  /**
   * Records a dispensation and creates audit log
   */
  async recordDispensation(
    logEntry: DispensationLogEntry
  ): Promise<DispensationLog> {
    const dispensation = this.dispensationRepository.create({
      prescriptionId: logEntry.prescriptionId,
      patientId: logEntry.patientId,
      pharmacyId: logEntry.pharmacyId,
      pharmacistId: logEntry.pharmacistId,
      substanceId: logEntry.substanceId,
      quantityDispensed: logEntry.quantityDispensed,
      unit: logEntry.unit,
      dosagePerUnit: logEntry.dosagePerUnit,
      daysSupply: logEntry.daysSupply,
      dispensedDate: logEntry.dispensedDate,
      status: logEntry.status,
      batchNumber: logEntry.batchNumber,
      expirationDate: logEntry.expirationDate,
      specialFormNumber: logEntry.specialFormNumber,
      notes: logEntry.notes,
      metadata: {
        prescriptionVerified: true,
        patientIdVerified: true,
        quantityVerified: true,
      },
    });

    return this.dispensationRepository.save(dispensation);
  }

  /**
   * Gets patient's controlled substance dispensation history
   */
  async getPatientControlledHistory(
    patientId: string
  ): Promise<PatientControlledHistory[]> {
    const dispensations = await this.dispensationRepository.find({
      where: { patientId },
      order: { dispensedDate: 'DESC' },
    });

    const substanceMap = new Map<string, PatientControlledHistory>();

    for (const disp of dispensations) {
      const substance = await this.substanceRepository.findOne({
        where: { id: disp.substanceId },
      });

      if (!substance) continue;

      if (!substanceMap.has(disp.substanceId)) {
        const alerts = await this.alertRepository.find({
          where: { patientId, substanceId: disp.substanceId },
        });

        substanceMap.set(disp.substanceId, {
          patientId,
          substance: {
            id: substance.id,
            name: substance.name,
            scientificName: substance.scientificName,
            schedule: substance.schedule,
            maxSupplyDays: substance.maxSupplyDays,
            requiresSpecialForm: substance.requiresSpecialForm,
            crossPharmacyCheck: substance.crossPharmacyCheck,
            description: substance.description,
            swissmedic: substance.swissmedic || {},
          },
          totalQuantityDispensed: 0,
          dispensationCount: 0,
          frequencyPerMonth: 0,
          averageSupplyDays: 0,
          flags: alerts,
        });
      }

      const history = substanceMap.get(disp.substanceId)!;
      history.totalQuantityDispensed += disp.quantityDispensed;
      history.dispensationCount += 1;
      if (!history.lastDispensedDate || disp.dispensedDate > history.lastDispensedDate) {
        history.lastDispensedDate = disp.dispensedDate;
      }
    }

    // Calculate frequency per month
    for (const history of substanceMap.values()) {
      if (history.dispensationCount > 0 && history.lastDispensedDate) {
        const daysSinceFirst =
          (Date.now() - dispensations[dispensations.length - 1].dispensedDate.getTime()) /
          (1000 * 60 * 60 * 24);
        history.frequencyPerMonth =
          (history.dispensationCount / daysSinceFirst) * 30;
        history.averageSupplyDays =
          dispensations
            .filter((d) => d.substanceId === Object.keys(substanceMap)[0])
            .reduce((sum, d) => sum + d.daysSupply, 0) / history.dispensationCount;
      }
    }

    return Array.from(substanceMap.values());
  }

  /**
   * Creates an alert for potential abuse or compliance issue
   */
  async createAlert(
    patientId: string,
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    substanceId?: string,
    pharmacyId?: string,
    metadata?: Record<string, any>
  ): Promise<Alert> {
    const alert = this.alertRepository.create({
      type,
      severity,
      message,
      patientId,
      substanceId,
      pharmacyId,
      metadata,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Gets active alerts for a patient
   */
  async getPatientAlerts(patientId: string): Promise<Alert[]> {
    return this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.patientId = :patientId', { patientId })
      .andWhere('alert.resolvedAt IS NULL')
      .orderBy('alert.severity', 'DESC')
      .addOrderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Resolves an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = resolutionNotes;

    return this.alertRepository.save(alert);
  }

  /**
   * Gets all active controlled substances
   */
  async getActiveSubstances(): Promise<ControlledSubstance[]> {
    return this.substanceRepository.find({
      where: { active: true },
      order: { schedule: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Gets controlled substance by ID
   */
  async getSubstance(id: string): Promise<ControlledSubstance | null> {
    return this.substanceRepository.findOne({ where: { id } });
  }

  /**
   * Gets controlled prescription details
   */
  async getControlledPrescription(
    prescriptionId: string
  ): Promise<ControlledPrescription | null> {
    return this.controlledPrescriptionRepository.findOne({
      where: { prescriptionId },
    });
  }

  /**
   * Saves controlled prescription validation result
   */
  async saveControlledPrescription(
    data: Partial<ControlledPrescription>
  ): Promise<ControlledPrescription> {
    const existing = await this.controlledPrescriptionRepository.findOne({
      where: { prescriptionId: data.prescriptionId },
    });

    let prescription: ControlledPrescription;
    if (existing) {
      prescription = Object.assign(existing, data);
    } else {
      prescription = this.controlledPrescriptionRepository.create(data);
    }

    return this.controlledPrescriptionRepository.save(prescription);
  }
}
