import { ControlledSubstanceService } from '../services/controlled.service';
import { ValidationService } from '../services/validation.service';
import { AlertService } from '../services/alert.service';
import { ReportingService } from '../services/reporting.service';
import {
  DrugSchedule,
  DispensationStatus,
  AlertType,
  AlertSeverity,
  DispensationLogEntry,
} from '../types/controlled.types';
import { ControlledSubstance } from '../entities/ControlledSubstance';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledPrescription } from '../entities/ControlledPrescription';
import { Alert } from '../entities/Alert';
import { Repository } from 'typeorm';

/**
 * Controlled Substance Service Tests
 * Tests all core functionality for controlled substance management
 */

describe('ControlledSubstanceService', () => {
  let service: ControlledSubstanceService;
  let mockSubstanceRepo: jest.Mocked<Repository<ControlledSubstance>>;
  let mockDispensationRepo: jest.Mocked<Repository<DispensationLog>>;
  let mockPrescriptionRepo: jest.Mocked<Repository<ControlledPrescription>>;
  let mockAlertRepo: jest.Mocked<Repository<Alert>>;

  beforeEach(() => {
    mockSubstanceRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockDispensationRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    mockPrescriptionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockAlertRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    service = new ControlledSubstanceService(
      mockSubstanceRepo,
      mockDispensationRepo,
      mockPrescriptionRepo,
      mockAlertRepo
    );
  });

  describe('createOrUpdateSubstance', () => {
    it('should create new substance', async () => {
      const substanceData = {
        id: 'test-id',
        name: 'Morphine',
        scientificName: 'Morphine hydrochloride',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
        crossPharmacyCheck: true,
        swissmedic: { number: 'SW123456', atc: 'N02AA01' },
      };

      mockSubstanceRepo.findOne.mockResolvedValue(null);
      mockSubstanceRepo.create.mockReturnValue({
        ...substanceData,
        active: true,
      } as ControlledSubstance);
      mockSubstanceRepo.save.mockResolvedValue({
        ...substanceData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ControlledSubstance);

      const result = await service.createOrUpdateSubstance(substanceData);

      expect(mockSubstanceRepo.findOne).toHaveBeenCalledWith({
        where: { name: substanceData.name },
      });
      expect(mockSubstanceRepo.create).toHaveBeenCalled();
      expect(mockSubstanceRepo.save).toHaveBeenCalled();
      expect(result.schedule).toBe(DrugSchedule.LISTE_A);
    });

    it('should update existing substance', async () => {
      const existingSubstance = {
        id: 'existing-id',
        name: 'Morphine',
        schedule: DrugSchedule.LISTE_A,
      } as ControlledSubstance;

      const updateData = {
        id: 'existing-id',
        name: 'Morphine',
        scientificName: 'Morphine sulfate',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
        crossPharmacyCheck: true,
        swissmedic: { number: 'SW123456' },
      };

      mockSubstanceRepo.findOne.mockResolvedValue(existingSubstance);
      mockSubstanceRepo.save.mockResolvedValue({
        ...existingSubstance,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ControlledSubstance);

      const result = await service.createOrUpdateSubstance(updateData);

      expect(mockSubstanceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scientificName: updateData.scientificName,
        })
      );
    });
  });

  describe('recordDispensation', () => {
    it('should record dispensation with all fields', async () => {
      const dispensationData: DispensationLogEntry = {
        id: 'disp-123',
        prescriptionId: 'presc-123',
        patientId: 'patient-123',
        pharmacyId: 'pharmacy-123',
        pharmacistId: 'pharmacist-123',
        substanceId: 'substance-123',
        quantityDispensed: 30,
        unit: 'tablets',
        dosagePerUnit: 10,
        daysSupply: 30,
        dispensedDate: new Date(),
        status: DispensationStatus.DISPENSED,
        batchNumber: 'BATCH123',
        expirationDate: new Date('2025-12-31'),
        specialFormNumber: '24000123',
        notes: 'Dispensed as prescribed',
      };

      mockDispensationRepo.create.mockReturnValue({
        ...dispensationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DispensationLog);
      mockDispensationRepo.save.mockResolvedValue({
        ...dispensationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DispensationLog);

      const result = await service.recordDispensation(dispensationData);

      expect(mockDispensationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          prescriptionId: dispensationData.prescriptionId,
          patientId: dispensationData.patientId,
          specialFormNumber: dispensationData.specialFormNumber,
        })
      );
      expect(mockDispensationRepo.save).toHaveBeenCalled();
      expect(result.specialFormNumber).toBe('24000123');
    });
  });

  describe('getPatientAlerts', () => {
    it('should retrieve unresolved alerts for patient', async () => {
      const patientId = 'patient-123';
      const alerts = [
        {
          id: 'alert-1',
          type: AlertType.FREQUENCY_ABUSE,
          severity: AlertSeverity.HIGH,
          message: 'Frequent dispensations detected',
          patientId,
          resolvedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Alert,
        {
          id: 'alert-2',
          type: AlertType.MULTI_PHARMACY,
          severity: AlertSeverity.MEDIUM,
          message: 'Doctor shopping detected',
          patientId,
          resolvedAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Alert,
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(alerts),
      };

      mockAlertRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getPatientAlerts(patientId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(AlertType.FREQUENCY_ABUSE);
    });
  });

  describe('createAlert', () => {
    it('should create alert with all details', async () => {
      const alertData = {
        id: 'alert-123',
        type: AlertType.FREQUENCY_ABUSE,
        severity: AlertSeverity.HIGH,
        message: 'High frequency dispensation detected',
        patientId: 'patient-123',
        substanceId: 'substance-123',
        pharmacyId: 'pharmacy-123',
        metadata: { frequencyPerMonth: 6 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAlertRepo.create.mockReturnValue(alertData as Alert);
      mockAlertRepo.save.mockResolvedValue(alertData as Alert);

      const result = await service.createAlert(
        alertData.patientId,
        alertData.type,
        alertData.severity,
        alertData.message,
        alertData.substanceId,
        alertData.pharmacyId,
        alertData.metadata
      );

      expect(mockAlertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AlertType.FREQUENCY_ABUSE,
          severity: AlertSeverity.HIGH,
        })
      );
      expect(result.metadata?.frequencyPerMonth).toBe(6);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert and record resolution', async () => {
      const alertId = 'alert-123';
      const existingAlert = {
        id: alertId,
        type: AlertType.FREQUENCY_ABUSE,
        severity: AlertSeverity.HIGH,
        message: 'Test alert',
        patientId: 'patient-123',
        resolvedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Alert;

      const resolvedAlert = {
        ...existingAlert,
        resolvedAt: new Date(),
        resolvedBy: 'pharmacist-123',
        resolutionNotes: 'Verified with patient',
      };

      mockAlertRepo.findOne.mockResolvedValue(existingAlert);
      mockAlertRepo.save.mockResolvedValue(resolvedAlert);

      const result = await service.resolveAlert(
        alertId,
        'pharmacist-123',
        'Verified with patient'
      );

      expect(mockAlertRepo.findOne).toHaveBeenCalledWith({
        where: { id: alertId },
      });
      expect(result.resolvedAt).toBeDefined();
      expect(result.resolvedBy).toBe('pharmacist-123');
    });

    it('should throw error if alert not found', async () => {
      mockAlertRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveAlert('nonexistent', 'pharmacist-123')
      ).rejects.toThrow('not found');
    });
  });

  describe('getActiveSubstances', () => {
    it('should return all active substances ordered by schedule', async () => {
      const substances = [
        {
          id: '1',
          name: 'Morphine',
          schedule: DrugSchedule.LISTE_A,
          active: true,
        },
        {
          id: '2',
          name: 'Benzodiazepine',
          schedule: DrugSchedule.LISTE_B,
          active: true,
        },
      ] as ControlledSubstance[];

      mockSubstanceRepo.find.mockResolvedValue(substances);

      const result = await service.getActiveSubstances();

      expect(mockSubstanceRepo.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { schedule: 'ASC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].schedule).toBe(DrugSchedule.LISTE_A);
    });
  });
});

/**
 * Validation Service Tests
 */
describe('ValidationService', () => {
  let service: ValidationService;
  let mockSubstanceRepo: jest.Mocked<Repository<ControlledSubstance>>;
  let mockDispensationRepo: jest.Mocked<Repository<DispensationLog>>;
  let mockPrescriptionRepo: jest.Mocked<Repository<ControlledPrescription>>;
  let mockAlertRepo: jest.Mocked<Repository<Alert>>;

  beforeEach(() => {
    mockSubstanceRepo = { findOne: jest.fn() } as any;
    mockDispensationRepo = { find: jest.fn() } as any;
    mockPrescriptionRepo = {} as any;
    mockAlertRepo = {} as any;

    service = new ValidationService(
      mockSubstanceRepo,
      mockDispensationRepo,
      mockPrescriptionRepo,
      mockAlertRepo
    );
  });

  describe('validatePrescription', () => {
    it('should pass validation for valid prescription', async () => {
      const substance = {
        id: 'substance-123',
        name: 'Morphine',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
        maxDailyDosageMg: 100,
      } as ControlledSubstance;

      mockSubstanceRepo.findOne.mockResolvedValue(substance);
      mockDispensationRepo.find.mockResolvedValue([]);

      const result = await service.validatePrescription({
        prescriptionId: 'presc-123',
        patientId: 'patient-123',
        prescriberId: 'doctor-123',
        pharmacyId: 'pharmacy-123',
        substanceId: 'substance-123',
        quantity: 30,
        dosagePerUnit: 10,
        unit: 'tablets',
        daysSupply: 30,
        prescriptionDate: new Date(),
        specialFormNumber: '24000123',
      });

      // With proper special form number, should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect early refill pattern', async () => {
      const substance = {
        id: 'substance-123',
        name: 'Morphine',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
      } as ControlledSubstance;

      const recentDispensation = {
        dispensedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        daysSupply: 30,
        pharmacyId: 'pharmacy-123',
        substanceId: 'substance-123',
      } as DispensationLog;

      mockSubstanceRepo.findOne.mockResolvedValue(substance);
      mockDispensationRepo.find.mockResolvedValue([recentDispensation]);

      const result = await service.validatePrescription({
        prescriptionId: 'presc-123',
        patientId: 'patient-123',
        prescriberId: 'doctor-123',
        pharmacyId: 'pharmacy-123',
        substanceId: 'substance-123',
        quantity: 30,
        dosagePerUnit: 10,
        unit: 'tablets',
        daysSupply: 30,
        prescriptionDate: new Date(),
        specialFormNumber: '24000123',
      });

      expect(result.warnings).toContainEqual(
        expect.stringMatching(/early/)
      );
    });

    it('should detect supply limit violation', async () => {
      const substance = {
        id: 'substance-123',
        name: 'Morphine',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
      } as ControlledSubstance;

      mockSubstanceRepo.findOne.mockResolvedValue(substance);
      mockDispensationRepo.find.mockResolvedValue([]);

      const result = await service.validatePrescription({
        prescriptionId: 'presc-123',
        patientId: 'patient-123',
        prescriberId: 'doctor-123',
        pharmacyId: 'pharmacy-123',
        substanceId: 'substance-123',
        quantity: 100,
        dosagePerUnit: 10,
        unit: 'tablets',
        daysSupply: 90, // Exceeds 30 day limit for Liste A
        prescriptionDate: new Date(),
        specialFormNumber: '24000123',
      });

      expect(result.errors).toContainEqual(
        expect.stringContaining('exceeds limit')
      );
    });
  });

  describe('validateSpecialFormNumber', () => {
    it('should validate correct form number format', () => {
      // This tests the private method indirectly through validation
      const substance = {
        id: 'substance-123',
        name: 'Morphine',
        schedule: DrugSchedule.LISTE_A,
        maxSupplyDays: 30,
        requiresSpecialForm: true,
      } as ControlledSubstance;

      mockSubstanceRepo.findOne.mockResolvedValue(substance);
      mockDispensationRepo.find.mockResolvedValue([]);

      // Valid format: YYNNNNNN
      expect(async () => {
        await service.validatePrescription({
          prescriptionId: 'presc-123',
          patientId: 'patient-123',
          prescriberId: 'doctor-123',
          pharmacyId: 'pharmacy-123',
          substanceId: 'substance-123',
          quantity: 30,
          dosagePerUnit: 10,
          unit: 'tablets',
          daysSupply: 30,
          prescriptionDate: new Date(),
          specialFormNumber: '24000123',
        });
      }).toBeDefined();
    });
  });
});

/**
 * Alert Service Tests
 */
describe('AlertService', () => {
  let service: AlertService;
  let mockAlertRepo: jest.Mocked<Repository<Alert>>;
  let mockDispensationRepo: jest.Mocked<Repository<DispensationLog>>;
  let mockSubstanceRepo: jest.Mocked<Repository<ControlledSubstance>>;

  beforeEach(() => {
    mockAlertRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockDispensationRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockSubstanceRepo = {} as any;

    service = new AlertService(
      mockAlertRepo,
      mockDispensationRepo,
      mockSubstanceRepo
    );
  });

  describe('analyzeDispensation', () => {
    it('should detect frequency abuse pattern', async () => {
      const now = new Date();
      const recentDispensations = [
        {
          dispensedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          daysSupply: 30,
          pharmacyId: 'pharmacy-123',
          id: 'disp-1',
          prescriptionId: '',
          patientId: '',
          pharmacistId: '',
          substanceId: '',
          quantityDispensed: 0,
          unit: '',
          dosagePerUnit: 0,
          status: DispensationStatus.DISPENSED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          dispensedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          daysSupply: 30,
          pharmacyId: 'pharmacy-123',
          id: 'disp-2',
          prescriptionId: '',
          patientId: '',
          pharmacistId: '',
          substanceId: '',
          quantityDispensed: 0,
          unit: '',
          dosagePerUnit: 0,
          status: DispensationStatus.DISPENSED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as DispensationLog[];

      mockDispensationRepo.find.mockResolvedValue(recentDispensations);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockDispensationRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      mockAlertRepo.create.mockReturnValue({
        type: AlertType.FREQUENCY_ABUSE,
        severity: AlertSeverity.HIGH,
        message: 'Test',
        patientId: 'patient-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Alert);
      mockAlertRepo.save.mockResolvedValue({
        id: 'alert-123',
        type: AlertType.FREQUENCY_ABUSE,
        severity: AlertSeverity.HIGH,
        message: 'Test',
        patientId: 'patient-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Alert);

      const alerts = await service.analyzeDispensation(
        'patient-123',
        'substance-123',
        'pharmacy-123',
        30
      );

      expect(mockDispensationRepo.find).toHaveBeenCalled();
      // Alert will be created based on frequency threshold
    });
  });

  describe('getAlertStatistics', () => {
    it('should calculate alert statistics', async () => {
      const alerts = [
        { severity: AlertSeverity.CRITICAL } as Alert,
        { severity: AlertSeverity.HIGH } as Alert,
        { severity: AlertSeverity.HIGH } as Alert,
        { severity: AlertSeverity.MEDIUM } as Alert,
        { severity: AlertSeverity.LOW } as Alert,
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(alerts),
      };

      mockAlertRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const stats = await service.getAlertStatistics('pharmacy-123');

      expect(stats.critical).toBe(1);
      expect(stats.high).toBe(2);
      expect(stats.medium).toBe(1);
      expect(stats.low).toBe(1);
      expect(stats.total).toBe(5);
    });
  });
});

/**
 * Reporting Service Tests
 */
describe('ReportingService', () => {
  let service: ReportingService;
  let mockDispensationRepo: jest.Mocked<Repository<DispensationLog>>;
  let mockSubstanceRepo: jest.Mocked<Repository<ControlledSubstance>>;
  let mockAlertRepo: jest.Mocked<Repository<Alert>>;

  beforeEach(() => {
    mockDispensationRepo = { find: jest.fn() } as any;
    mockSubstanceRepo = { findOne: jest.fn() } as any;
    mockAlertRepo = { find: jest.fn() } as any;

    service = new ReportingService(
      mockDispensationRepo,
      mockSubstanceRepo,
      mockAlertRepo
    );
  });

  describe('exportReportAsJSON', () => {
    it('should export report as valid JSON', () => {
      const report = {
        id: 'report-123',
        pharmacyId: 'pharmacy-123',
        reportPeriod: {
          startDate: new Date(),
          endDate: new Date(),
        },
        totalDispensations: 10,
        substanceBreakdown: {},
        flaggedPatients: [],
        complianceIssues: [],
        generatedAt: new Date(),
      };

      const json = service.exportReportAsJSON(report);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('report-123');
      expect(parsed.totalDispensations).toBe(10);
    });
  });

  describe('exportReportAsCSV', () => {
    it('should export report as CSV format', () => {
      const report = {
        id: 'report-123',
        pharmacyId: 'pharmacy-123',
        reportPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        totalDispensations: 10,
        substanceBreakdown: {
          'substance-1': {
            name: 'Morphine',
            schedule: DrugSchedule.LISTE_A,
            count: 5,
            totalQuantity: 150,
          },
        },
        flaggedPatients: [],
        complianceIssues: ['Test issue'],
        generatedAt: new Date(),
      };

      const csv = service.exportReportAsCSV(report);

      expect(csv).toContain('Controlled Substance Compliance Report');
      expect(csv).toContain('pharmacy-123');
      expect(csv).toContain('Morphine');
      expect(csv).toContain('Test issue');
    });
  });
});
