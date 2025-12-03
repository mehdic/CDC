/**
 * Unit Tests for Patient Allergy Service
 * Tests patient allergy management and cross-reference checking
 * T5-009: Patient allergy management
 */

import { PatientAllergyService, AllergyRecord } from '../src/services/PatientAllergyService';
import { PatientAllergy } from '../src/integrations/interaction-service';

describe('PatientAllergyService', () => {
  let service: PatientAllergyService;

  beforeEach(() => {
    service = new PatientAllergyService();
  });

  afterEach(() => {
    service.clearAll();
  });

  describe('Adding Allergies', () => {
    it('should add a drug allergy', () => {
      const allergy: Omit<AllergyRecord, 'id'> = {
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        reaction: 'Hives and difficulty breathing',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      };

      const added = service.addAllergy(allergy);

      expect(added.id).toBeDefined();
      expect(added.substance).toBe('Penicillin');
      expect(added.severity).toBe('severe');
    });

    it('should add a drug class allergy', () => {
      const allergy: Omit<AllergyRecord, 'id'> = {
        patientId: 'patient-123',
        substance: 'NSAID',
        type: 'class',
        severity: 'moderate',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      };

      const added = service.addAllergy(allergy);

      expect(added.type).toBe('class');
      expect(added.substance).toBe('NSAID');
    });

    it('should prevent duplicate allergies', () => {
      const allergy: Omit<AllergyRecord, 'id'> = {
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      };

      const added1 = service.addAllergy(allergy);
      const added2 = service.addAllergy(allergy);

      expect(added1.id).toBe(added2.id);

      const allergies = service.getAllergies('patient-123');
      expect(allergies).toHaveLength(1);
    });

    it('should allow different severity levels for same substance', () => {
      const allergy1: Omit<AllergyRecord, 'id'> = {
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'mild',
        recordedBy: 'doctor-456',
        dateRecorded: new Date('2020-01-01'),
        verified: true,
        active: false, // Old record marked inactive
      };

      const allergy2: Omit<AllergyRecord, 'id'> = {
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-789',
        dateRecorded: new Date(),
        verified: true,
        active: true, // Updated record
      };

      service.addAllergy(allergy1);
      service.addAllergy(allergy2);

      const activeAllergies = service.getAllergies('patient-123');
      expect(activeAllergies).toHaveLength(1);
      expect(activeAllergies[0].severity).toBe('severe');
    });
  });

  describe('Retrieving Allergies', () => {
    beforeEach(() => {
      // Add test allergies
      service.addAllergy({
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });

      service.addAllergy({
        patientId: 'patient-123',
        substance: 'Aspirin',
        type: 'drug',
        severity: 'mild',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: false, // Inactive
      });
    });

    it('should get active allergies only by default', () => {
      const allergies = service.getAllergies('patient-123');
      expect(allergies).toHaveLength(1);
      expect(allergies[0].substance).toBe('Penicillin');
    });

    it('should get all allergies including inactive when requested', () => {
      const allergies = service.getAllergies('patient-123', true);
      expect(allergies).toHaveLength(2);
    });

    it('should return empty array for patient with no allergies', () => {
      const allergies = service.getAllergies('patient-999');
      expect(allergies).toHaveLength(0);
    });
  });

  describe('Updating Allergies', () => {
    let allergyId: string;

    beforeEach(() => {
      const added = service.addAllergy({
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'moderate',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: false,
        active: true,
      });
      allergyId = added.id;
    });

    it('should update allergy severity', () => {
      const updated = service.updateAllergy('patient-123', allergyId, {
        severity: 'severe',
      });

      expect(updated).not.toBeNull();
      expect(updated!.severity).toBe('severe');
    });

    it('should update verification status', () => {
      const updated = service.updateAllergy('patient-123', allergyId, {
        verified: true,
      });

      expect(updated!.verified).toBe(true);
    });

    it('should return null for non-existent allergy', () => {
      const updated = service.updateAllergy('patient-123', 'invalid-id', {
        severity: 'severe',
      });

      expect(updated).toBeNull();
    });

    it('should return null for wrong patient ID', () => {
      const updated = service.updateAllergy('patient-999', allergyId, {
        severity: 'severe',
      });

      expect(updated).toBeNull();
    });
  });

  describe('Deleting Allergies', () => {
    let allergyId: string;

    beforeEach(() => {
      const added = service.addAllergy({
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'moderate',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });
      allergyId = added.id;
    });

    it('should soft delete (mark as inactive)', () => {
      const deleted = service.deleteAllergy('patient-123', allergyId);
      expect(deleted).toBe(true);

      const activeAllergies = service.getAllergies('patient-123');
      expect(activeAllergies).toHaveLength(0);

      const allAllergies = service.getAllergies('patient-123', true);
      expect(allAllergies).toHaveLength(1);
      expect(allAllergies[0].active).toBe(false);
    });

    it('should return false for non-existent allergy', () => {
      const deleted = service.deleteAllergy('patient-123', 'invalid-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Medication Allergy Checking', () => {
    beforeEach(() => {
      // Add various allergy types
      service.addAllergy({
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });

      service.addAllergy({
        patientId: 'patient-123',
        substance: 'NSAID',
        type: 'class',
        severity: 'moderate',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });
    });

    it('should detect direct drug match', () => {
      const conflicts = service.checkMedicationAllergies('patient-123', 'Penicillin');
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].substance).toBe('Penicillin');
      expect(conflicts[0].type).toBe('drug');
    });

    it('should detect drug class match', () => {
      const conflicts = service.checkMedicationAllergies('patient-123', 'Ibuprofen');
      expect(conflicts.length).toBeGreaterThan(0);

      const nsaidConflict = conflicts.find(c => c.substance === 'NSAID');
      expect(nsaidConflict).toBeDefined();
      expect(nsaidConflict!.type).toBe('class');
    });

    it('should be case-insensitive', () => {
      const conflicts = service.checkMedicationAllergies('patient-123', 'penicillin');
      expect(conflicts).toHaveLength(1);
    });

    it('should return empty array for non-allergenic medication', () => {
      const conflicts = service.checkMedicationAllergies('patient-123', 'Metformin');
      expect(conflicts).toHaveLength(0);
    });

    it('should not detect inactive allergies', () => {
      // Add inactive allergy for Metformin (not in any of the active allergy classes)
      service.addAllergy({
        patientId: 'patient-123',
        substance: 'Metformin',
        type: 'drug',
        severity: 'mild',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: false,
      });

      // Should not detect inactive Metformin allergy
      const conflicts = service.checkMedicationAllergies('patient-123', 'Metformin');
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Drug Class Management', () => {
    it('should identify drugs in Penicillin class', () => {
      const classes = service.getDrugClasses('Amoxicillin');
      expect(classes).toContain('Penicillin');
    });

    it('should identify drugs in NSAID class', () => {
      const classes = service.getDrugClasses('Ibuprofen');
      expect(classes).toContain('NSAID');
    });

    it('should identify drugs in Statin class', () => {
      const classes = service.getDrugClasses('Atorvastatin');
      expect(classes).toContain('Statin');
    });

    it('should return empty array for unclassified drugs', () => {
      const classes = service.getDrugClasses('UnknownDrug');
      expect(classes).toHaveLength(0);
    });

    it('should get all drugs in a specific class', () => {
      const drugs = service.getDrugsInClass('Penicillin');
      expect(drugs.length).toBeGreaterThan(0);
      expect(drugs).toContain('Amoxicillin');
      expect(drugs).toContain('Ampicillin');
    });

    it('should return empty array for unknown class', () => {
      const drugs = service.getDrugsInClass('UnknownClass');
      expect(drugs).toHaveLength(0);
    });
  });

  describe('Cross-Reactivity', () => {
    it('should detect Penicillin-Cephalosporin cross-reactivity', () => {
      const hasCross = service.hasCrossReactivity('Penicillin', 'Cephalosporin');
      expect(hasCross).toBe(true);
    });

    it('should detect ACE Inhibitor-ARB cross-reactivity', () => {
      const hasCross = service.hasCrossReactivity('ACE Inhibitor', 'ARB');
      expect(hasCross).toBe(true);
    });

    it('should return false for unrelated classes', () => {
      const hasCross = service.hasCrossReactivity('NSAID', 'Statin');
      expect(hasCross).toBe(false);
    });

    it('should be case-insensitive', () => {
      const hasCross = service.hasCrossReactivity('penicillin', 'cephalosporin');
      expect(hasCross).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Patient 1
      service.addAllergy({
        patientId: 'patient-1',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-1',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });

      service.addAllergy({
        patientId: 'patient-1',
        substance: 'NSAID',
        type: 'class',
        severity: 'moderate',
        recordedBy: 'doctor-1',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });

      // Patient 2
      service.addAllergy({
        patientId: 'patient-2',
        substance: 'Aspirin',
        type: 'drug',
        severity: 'mild',
        recordedBy: 'doctor-2',
        dateRecorded: new Date(),
        verified: true,
        active: false, // Inactive
      });
    });

    it('should calculate correct statistics', () => {
      const stats = service.getStatistics();

      expect(stats.totalPatients).toBe(2);
      expect(stats.totalAllergies).toBe(3);
      expect(stats.activeAllergies).toBe(2);
    });

    it('should break down by type', () => {
      const stats = service.getStatistics();

      expect(stats.byType.drug).toBe(1); // Only active Penicillin
      expect(stats.byType.class).toBe(1); // Active NSAID
    });

    it('should break down by severity', () => {
      const stats = service.getStatistics();

      expect(stats.bySeverity.severe).toBe(1);
      expect(stats.bySeverity.moderate).toBe(1);
      expect(stats.bySeverity.mild).toBe(0); // Inactive Aspirin not counted
    });
  });

  describe('Clear All', () => {
    it('should clear all allergy records', () => {
      service.addAllergy({
        patientId: 'patient-123',
        substance: 'Penicillin',
        type: 'drug',
        severity: 'severe',
        recordedBy: 'doctor-456',
        dateRecorded: new Date(),
        verified: true,
        active: true,
      });

      service.clearAll();

      const allergies = service.getAllergies('patient-123');
      expect(allergies).toHaveLength(0);
    });
  });
});
