/**
 * Validation Workflow Tests
 * Tests for prescription validation, approval, and rejection endpoints
 * T084-T093 - BACKEND_VALIDATION group
 */

// Note: describe, test, expect are globally available via @types/jest
import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';
import { PrescriptionStateMachine } from '../utils/stateMachine';
import { FDBService, DrugInteractionSeverity } from '../integrations/fdb';
import { AllergyChecker, AllergySeverity, AllergyReactionType } from '../utils/allergyCheck';
import { ContraindicationChecker, ContraindicationSeverity } from '../utils/contraindications';

describe('Prescription State Machine', () => {
  test('should validate pending to in_review transition', () => {
    expect(
      PrescriptionStateMachine.canTransition(PrescriptionStatus.PENDING, PrescriptionStatus.IN_REVIEW)
    ).toBe(true);
  });

  test('should validate in_review to approved transition', () => {
    expect(
      PrescriptionStateMachine.canTransition(PrescriptionStatus.IN_REVIEW, PrescriptionStatus.APPROVED)
    ).toBe(true);
  });

  test('should reject invalid transitions', () => {
    expect(
      PrescriptionStateMachine.canTransition(PrescriptionStatus.PENDING, PrescriptionStatus.APPROVED)
    ).toBe(false);
  });

  test('should reject transitions from immutable states', () => {
    expect(
      PrescriptionStateMachine.canTransition(PrescriptionStatus.APPROVED, PrescriptionStatus.REJECTED)
    ).toBe(false);
  });

  test('should throw error on invalid transition attempt', () => {
    expect(() => {
      PrescriptionStateMachine.validateTransition(
        PrescriptionStatus.APPROVED,
        PrescriptionStatus.REJECTED
      );
    }).toThrow('Cannot transition from immutable state');
  });

  test('should identify immutable states', () => {
    expect(PrescriptionStateMachine.isImmutableState(PrescriptionStatus.APPROVED)).toBe(true);
    expect(PrescriptionStateMachine.isImmutableState(PrescriptionStatus.REJECTED)).toBe(true);
    expect(PrescriptionStateMachine.isImmutableState(PrescriptionStatus.PENDING)).toBe(false);
  });
});

describe('FDB Drug Interaction Checking', () => {
  test('should detect warfarin and aspirin interaction', async () => {
    const fdbService = new FDBService();
    const result = await fdbService.checkDrugInteractions(['warfarin', 'aspirin']);

    expect(result.hasInteractions).toBe(true);
    expect(result.interactions.length).toBeGreaterThan(0);
    expect(result.interactions[0].severity).toBe(DrugInteractionSeverity.MAJOR);
  });

  test('should detect simvastatin and clarithromycin contraindication', async () => {
    const fdbService = new FDBService();
    const result = await fdbService.checkDrugInteractions(['simvastatin', 'clarithromycin']);

    expect(result.hasInteractions).toBe(true);
    expect(result.interactions[0].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
  });

  test('should return no interactions for safe combination', async () => {
    const fdbService = new FDBService();
    const result = await fdbService.checkDrugInteractions(['acetaminophen', 'vitamin D']);

    expect(result.hasInteractions).toBe(false);
    expect(result.interactions.length).toBe(0);
  });

  test('should return checked timestamp', async () => {
    const fdbService = new FDBService();
    const result = await fdbService.checkDrugInteractions(['aspirin']);

    expect(result.checkedAt).toBeInstanceOf(Date);
  });
});

describe('Allergy Checking', () => {
  test('should sort allergy warnings by severity', () => {
    const warnings = [
      { allergen: 'A', medication: 'B', reaction_type: AllergyReactionType.OTHER, severity: AllergySeverity.MILD, recommendation: '' },
      { allergen: 'C', medication: 'D', reaction_type: AllergyReactionType.ANAPHYLAXIS, severity: AllergySeverity.LIFE_THREATENING, recommendation: '' },
      { allergen: 'E', medication: 'F', reaction_type: AllergyReactionType.SEVERE_RASH, severity: AllergySeverity.MODERATE, recommendation: '' },
    ];

    const sorted = AllergyChecker.sortBySeverity(warnings);

    expect(sorted[0].severity).toBe(AllergySeverity.LIFE_THREATENING);
    expect(sorted[1].severity).toBe(AllergySeverity.MODERATE);
    expect(sorted[2].severity).toBe(AllergySeverity.MILD);
  });

  test('should detect life-threatening allergies', () => {
    const warnings = [
      { allergen: 'penicillin', medication: 'amoxicillin', reaction_type: AllergyReactionType.ANAPHYLAXIS, severity: AllergySeverity.LIFE_THREATENING, recommendation: '' },
    ];

    expect(AllergyChecker.hasLifeThreateningAllergies(warnings)).toBe(true);
  });

  test('should filter allergies by severity', () => {
    const warnings = [
      { allergen: 'A', medication: 'B', reaction_type: AllergyReactionType.OTHER, severity: AllergySeverity.MILD, recommendation: '' },
      { allergen: 'C', medication: 'D', reaction_type: AllergyReactionType.ANAPHYLAXIS, severity: AllergySeverity.LIFE_THREATENING, recommendation: '' },
    ];

    const filtered = AllergyChecker.filterBySeverity(warnings, AllergySeverity.SEVERE);

    expect(filtered.length).toBe(1);
    expect(filtered[0].severity).toBe(AllergySeverity.LIFE_THREATENING);
  });
});

describe('Contraindication Checking', () => {
  test('should sort contraindications by severity', () => {
    const contraindications = [
      { condition: 'A', medication: 'B', severity: ContraindicationSeverity.PRECAUTION, reason: '', recommendation: '' },
      { condition: 'C', medication: 'D', severity: ContraindicationSeverity.ABSOLUTE, reason: '', recommendation: '' },
      { condition: 'E', medication: 'F', severity: ContraindicationSeverity.RELATIVE, reason: '', recommendation: '' },
    ];

    const sorted = ContraindicationChecker.sortBySeverity(contraindications);

    expect(sorted[0].severity).toBe(ContraindicationSeverity.ABSOLUTE);
    expect(sorted[1].severity).toBe(ContraindicationSeverity.RELATIVE);
    expect(sorted[2].severity).toBe(ContraindicationSeverity.PRECAUTION);
  });

  test('should detect absolute contraindications', () => {
    const contraindications = [
      { condition: 'pregnancy', medication: 'warfarin', severity: ContraindicationSeverity.ABSOLUTE, reason: '', recommendation: '' },
    ];

    expect(ContraindicationChecker.hasAbsoluteContraindications(contraindications)).toBe(true);
  });

  test('should filter contraindications by severity', () => {
    const contraindications = [
      { condition: 'A', medication: 'B', severity: ContraindicationSeverity.PRECAUTION, reason: '', recommendation: '' },
      { condition: 'C', medication: 'D', severity: ContraindicationSeverity.ABSOLUTE, reason: '', recommendation: '' },
    ];

    const filtered = ContraindicationChecker.filterBySeverity(contraindications, ContraindicationSeverity.RELATIVE);

    expect(filtered.length).toBe(1);
    expect(filtered[0].severity).toBe(ContraindicationSeverity.ABSOLUTE);
  });
});

describe('Prescription Model Helpers', () => {
  test('should detect low confidence prescriptions', () => {
    const prescription = new Prescription();
    prescription.ai_confidence_score = 75;

    expect(prescription.hasLowConfidence()).toBe(true);
  });

  test('should detect high confidence prescriptions', () => {
    const prescription = new Prescription();
    prescription.ai_confidence_score = 95;

    expect(prescription.hasLowConfidence()).toBe(false);
  });

  test('should detect safety warnings', () => {
    const prescription = new Prescription();
    prescription.drug_interactions = [{ drug1: 'A', drug2: 'B', severity: 'major' }];

    expect(prescription.hasSafetyWarnings()).toBe(true);
  });

  test('should allow editing for pending prescriptions', () => {
    const prescription = new Prescription();
    prescription.status = PrescriptionStatus.PENDING;

    expect(prescription.canBeEdited()).toBe(true);
  });

  test('should not allow editing for approved prescriptions', () => {
    const prescription = new Prescription();
    prescription.status = PrescriptionStatus.APPROVED;

    expect(prescription.canBeEdited()).toBe(false);
  });
});
