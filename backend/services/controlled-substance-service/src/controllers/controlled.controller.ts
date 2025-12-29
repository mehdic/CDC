import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { ControlledSubstanceService } from '../services/controlled.service';
import { ValidationService } from '../services/validation.service';
import { AlertService } from '../services/alert.service';
import { ReportingService } from '../services/reporting.service';
import { ControlledSubstance } from '../entities/ControlledSubstance';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledPrescription } from '../entities/ControlledPrescription';
import { Alert } from '../entities/Alert';
import { DispensationStatus, PrescriptionValidationRequest } from '../types/controlled.types';

/**
 * Controlled Substance Controller
 * Handles API requests for controlled substance management
 */
export class ControlledController {
  private _controlledService: ControlledSubstanceService | null = null;
  private _validationService: ValidationService | null = null;
  private _alertService: AlertService | null = null;
  private _reportingService: ReportingService | null = null;

  // Lazy getters for services to avoid initialization order issues
  private get controlledService(): ControlledSubstanceService {
    if (!this._controlledService) {
      this._controlledService = new ControlledSubstanceService(
        AppDataSource.getRepository(ControlledSubstance),
        AppDataSource.getRepository(DispensationLog),
        AppDataSource.getRepository(ControlledPrescription),
        AppDataSource.getRepository(Alert)
      );
    }
    return this._controlledService;
  }

  private get validationService(): ValidationService {
    if (!this._validationService) {
      this._validationService = new ValidationService(
        AppDataSource.getRepository(ControlledSubstance),
        AppDataSource.getRepository(DispensationLog),
        AppDataSource.getRepository(ControlledPrescription),
        AppDataSource.getRepository(Alert)
      );
    }
    return this._validationService;
  }

  private get alertService(): AlertService {
    if (!this._alertService) {
      this._alertService = new AlertService(
        AppDataSource.getRepository(Alert),
        AppDataSource.getRepository(DispensationLog),
        AppDataSource.getRepository(ControlledSubstance)
      );
    }
    return this._alertService;
  }

  private get reportingService(): ReportingService {
    if (!this._reportingService) {
      this._reportingService = new ReportingService(
        AppDataSource.getRepository(DispensationLog),
        AppDataSource.getRepository(ControlledSubstance),
        AppDataSource.getRepository(Alert)
      );
    }
    return this._reportingService;
  }

  constructor() {
    // Services are now accessed lazily via getters
  }

  /**
   * Validates a controlled substance prescription
   * POST /api/controlled/validate
   */
  validatePrescription = async (req: Request, res: Response) => {
    try {
      const {
        prescriptionId,
        patientId,
        prescriberId,
        pharmacyId,
        substanceId,
        quantity,
        dosagePerUnit,
        unit,
        daysSupply,
        prescriptionDate,
        specialFormNumber,
      } = req.body;

      // Validate input
      if (!prescriptionId || !patientId || !substanceId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: prescriptionId, patientId, substanceId',
        });
      }

      const validationRequest: PrescriptionValidationRequest = {
        prescriptionId,
        patientId,
        prescriberId,
        pharmacyId,
        substanceId,
        quantity,
        dosagePerUnit,
        unit,
        daysSupply,
        prescriptionDate: new Date(prescriptionDate),
        specialFormNumber,
      };

      const result =
        await this.validationService.validatePrescription(validationRequest);

      // Save validation result
      await this.controlledService.saveControlledPrescription({
        prescriptionId,
        patientId,
        prescriberId,
        pharmacyId,
        substanceId,
        quantity,
        dosagePerUnit,
        unit,
        daysSupply,
        prescriptionDate: new Date(prescriptionDate),
        specialFormNumber,
        validationPassed: result.valid,
        validationErrors: result.errors,
        validationWarnings: result.warnings,
        requiresPharmacistReview: result.requiresPharmacistReview,
        detectedAlerts: result.alerts,
      });

      res.status(200).json({
        success: true,
        validationResult: result,
      });
    } catch (error) {
      console.error('Error validating prescription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate prescription',
      });
    }
  };

  /**
   * Records a dispensation
   * POST /api/controlled/dispense
   */
  dispenseControlledSubstance = async (req: Request, res: Response) => {
    try {
      const {
        prescriptionId,
        patientId,
        pharmacyId,
        pharmacistId,
        substanceId,
        quantityDispensed,
        unit,
        dosagePerUnit,
        daysSupply,
        batchNumber,
        expirationDate,
        specialFormNumber,
        notes,
      } = req.body;

      if (!prescriptionId || !patientId || !pharmacyId || !substanceId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Record dispensation
      const dispensation = await this.controlledService.recordDispensation({
        id: '', // Generated by database
        prescriptionId,
        patientId,
        pharmacyId,
        pharmacistId,
        substanceId,
        quantityDispensed,
        unit,
        dosagePerUnit,
        daysSupply,
        dispensedDate: new Date(),
        status: DispensationStatus.DISPENSED,
        batchNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        specialFormNumber,
        notes,
      });

      // Analyze for alerts
      const alerts = await this.alertService.analyzeDispensation(
        patientId,
        substanceId,
        pharmacyId,
        daysSupply
      );

      res.status(201).json({
        success: true,
        dispensation,
        alerts: alerts.length > 0 ? alerts : undefined,
      });
    } catch (error) {
      console.error('Error dispensing controlled substance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to dispense substance',
      });
    }
  };

  /**
   * Gets patient controlled substance history
   * GET /api/controlled/patient/:patientId/history
   */
  getPatientHistory = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: 'Patient ID required',
        });
      }

      const history = await this.controlledService.getPatientControlledHistory(
        patientId
      );
      const alerts = await this.controlledService.getPatientAlerts(patientId);

      res.status(200).json({
        success: true,
        history,
        alerts,
      });
    } catch (error) {
      console.error('Error fetching patient history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient history',
      });
    }
  };

  /**
   * Gets compliance reports
   * GET /api/controlled/reports
   */
  getComplianceReports = async (req: Request, res: Response) => {
    try {
      const { pharmacyId, startDate, endDate } = req.query;

      if (!pharmacyId) {
        return res.status(400).json({
          success: false,
          error: 'Pharmacy ID required',
        });
      }

      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date();

      // Default to last 30 days
      if (!startDate) {
        start.setDate(start.getDate() - 30);
      }

      const report = await this.reportingService.generatePharmacyComplianceReport(
        pharmacyId as string,
        start,
        end
      );

      res.status(200).json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
      });
    }
  };

  /**
   * Gets active alerts
   * GET /api/controlled/alerts
   */
  getAlerts = async (req: Request, res: Response) => {
    try {
      const { pharmacyId, patientId } = req.query;

      let alerts: any[];

      if (patientId) {
        alerts = await this.controlledService.getPatientAlerts(patientId as string);
      } else if (pharmacyId) {
        alerts = await this.alertService.getPharmacyAlerts(pharmacyId as string);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Pharmacy ID or Patient ID required',
        });
      }

      const statistics = await this.alertService.getAlertStatistics(
        pharmacyId as string | undefined
      );

      res.status(200).json({
        success: true,
        alerts,
        statistics,
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alerts',
      });
    }
  };

  /**
   * Resolves an alert
   * POST /api/controlled/alerts/:alertId/resolve
   */
  resolveAlert = async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { resolvedBy, resolutionNotes } = req.body;

      if (!alertId || !resolvedBy) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID and resolvedBy are required',
        });
      }

      const alert = await this.controlledService.resolveAlert(
        alertId,
        resolvedBy,
        resolutionNotes
      );

      res.status(200).json({
        success: true,
        alert,
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert',
      });
    }
  };

  /**
   * Gets all active controlled substances
   * GET /api/controlled/substances
   */
  getActiveSubstances = async (req: Request, res: Response) => {
    try {
      const substances =
        await this.controlledService.getActiveSubstances();

      res.status(200).json({
        success: true,
        substances,
      });
    } catch (error) {
      console.error('Error fetching substances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch substances',
      });
    }
  };

  /**
   * Gets monthly trend report
   * GET /api/controlled/trends
   */
  getTrendReport = async (req: Request, res: Response) => {
    try {
      const { pharmacyId, months = '12' } = req.query;

      if (!pharmacyId) {
        return res.status(400).json({
          success: false,
          error: 'Pharmacy ID required',
        });
      }

      const trends = await this.reportingService.generateMonthlyTrendReport(
        pharmacyId as string,
        parseInt(months as string, 10)
      );

      res.status(200).json({
        success: true,
        ...trends,
      });
    } catch (error) {
      console.error('Error fetching trend report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trend report',
      });
    }
  };
}
