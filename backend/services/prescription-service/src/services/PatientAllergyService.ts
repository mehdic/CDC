/**
 * Patient Allergy Management Service
 * Stores and manages patient allergies for drug interaction checking
 *
 * Task: T5-009 - Implement patient allergy management
 * Features:
 * - Store patient allergies in profile
 * - Link allergies to drug classes
 * - Cross-reference during prescriptions
 * - Support severity levels (mild, moderate, severe, anaphylaxis)
 */

import { PatientAllergy } from '../integrations/interaction-service';

/**
 * Patient allergy record with metadata
 */
export interface AllergyRecord extends PatientAllergy {
  id: string;                      // Unique allergy record ID
  patientId: string;               // Patient identifier
  recordedBy: string;              // Healthcare provider who recorded
  dateRecorded: Date;              // When allergy was recorded
  notes?: string;                  // Additional notes
  verified: boolean;               // Whether allergy has been verified
  active: boolean;                 // Whether allergy is still active
}

/**
 * Drug class mapping for allergy checking
 */
export interface DrugClassMapping {
  className: string;               // Drug class name (e.g., "Penicillin")
  drugs: string[];                 // Drugs in this class
  crossReactivity?: string[];      // Classes with known cross-reactivity
}

/**
 * Patient Allergy Service
 * Manages patient allergies and provides cross-reference checking
 */
export class PatientAllergyService {
  private allergyStore: Map<string, AllergyRecord[]>;  // patientId -> allergies
  private drugClassMappings: DrugClassMapping[];

  constructor() {
    this.allergyStore = new Map();
    this.drugClassMappings = this.initializeDrugClassMappings();
    console.info('[Patient Allergy Service] Initialized');
  }

  /**
   * Initialize drug class mappings with common Swiss medications
   * Based on Swiss drug classification and Swissmedic ATC codes
   */
  private initializeDrugClassMappings(): DrugClassMapping[] {
    return [
      {
        className: 'Penicillin',
        drugs: [
          'Amoxicillin', 'Ampicillin', 'Penicillin', 'Penicillin G', 'Penicillin V',
          'Amoxicillin-Clavulanate', 'Augmentin', 'Piperacillin', 'Ticarcillin'
        ],
        crossReactivity: ['Cephalosporin'], // 10% cross-reactivity
      },
      {
        className: 'Cephalosporin',
        drugs: [
          'Cephalexin', 'Cefazolin', 'Ceftriaxone', 'Cefuroxime', 'Cefixime',
          'Ceftazidime', 'Cefepime', 'Rocephin'
        ],
        crossReactivity: ['Penicillin'],
      },
      {
        className: 'Sulfonamide',
        drugs: [
          'Sulfamethoxazole', 'Trimethoprim-Sulfamethoxazole', 'Bactrim',
          'Septra', 'Sulfasalazine', 'Sulfadiazine'
        ],
      },
      {
        className: 'NSAID',
        drugs: [
          'Ibuprofen', 'Naproxen', 'Aspirin', 'Diclofenac', 'Celecoxib',
          'Indomethacin', 'Meloxicam', 'Piroxicam', 'Voltaren', 'Aleve', 'Advil'
        ],
      },
      {
        className: 'Statin',
        drugs: [
          'Atorvastatin', 'Simvastatin', 'Rosuvastatin', 'Pravastatin',
          'Lovastatin', 'Fluvastatin', 'Lipitor', 'Crestor', 'Zocor'
        ],
      },
      {
        className: 'Beta Blocker',
        drugs: [
          'Metoprolol', 'Atenolol', 'Propranolol', 'Carvedilol', 'Bisoprolol',
          'Labetalol', 'Nebivolol', 'Lopressor', 'Tenormin'
        ],
      },
      {
        className: 'ACE Inhibitor',
        drugs: [
          'Lisinopril', 'Enalapril', 'Ramipril', 'Captopril', 'Perindopril',
          'Quinapril', 'Benazepril', 'Fosinopril'
        ],
        crossReactivity: ['ARB'], // Angiotensin Receptor Blockers
      },
      {
        className: 'ARB',
        drugs: [
          'Losartan', 'Valsartan', 'Irbesartan', 'Candesartan', 'Olmesartan',
          'Telmisartan', 'Cozaar', 'Diovan'
        ],
        crossReactivity: ['ACE Inhibitor'],
      },
      {
        className: 'Fluoroquinolone',
        drugs: [
          'Ciprofloxacin', 'Levofloxacin', 'Moxifloxacin', 'Ofloxacin',
          'Norfloxacin', 'Cipro', 'Levaquin'
        ],
      },
      {
        className: 'Macrolide',
        drugs: [
          'Azithromycin', 'Clarithromycin', 'Erythromycin', 'Roxithromycin',
          'Zithromax', 'Biaxin'
        ],
      },
      {
        className: 'Benzodiazepine',
        drugs: [
          'Diazepam', 'Lorazepam', 'Alprazolam', 'Clonazepam', 'Temazepam',
          'Midazolam', 'Valium', 'Ativan', 'Xanax'
        ],
      },
      {
        className: 'Opioid',
        drugs: [
          'Morphine', 'Codeine', 'Fentanyl', 'Oxycodone', 'Hydrocodone',
          'Tramadol', 'Methadone', 'Buprenorphine', 'OxyContin', 'Percocet'
        ],
      },
    ];
  }

  /**
   * Add allergy record for a patient
   * T5-009: Store patient allergies in profile
   *
   * @param allergy Allergy record to add
   * @returns Created allergy record with ID
   */
  addAllergy(allergy: Omit<AllergyRecord, 'id'>): AllergyRecord {
    const id = this.generateAllergyId();

    const allergyRecord: AllergyRecord = {
      ...allergy,
      id,
    };

    // Get or create patient's allergy list
    const patientAllergies = this.allergyStore.get(allergy.patientId) || [];

    // Check for duplicates
    const isDuplicate = patientAllergies.some(
      existing =>
        existing.substance.toLowerCase() === allergy.substance.toLowerCase() &&
        existing.type === allergy.type &&
        existing.active
    );

    if (isDuplicate) {
      console.warn(`[Patient Allergy Service] Duplicate allergy detected for patient ${allergy.patientId}: ${allergy.substance}`);
      // Return existing record
      return patientAllergies.find(
        existing =>
          existing.substance.toLowerCase() === allergy.substance.toLowerCase() &&
          existing.type === allergy.type &&
          existing.active
      )!;
    }

    // Add new allergy
    patientAllergies.push(allergyRecord);
    this.allergyStore.set(allergy.patientId, patientAllergies);

    console.info(`[Patient Allergy Service] Added allergy for patient ${allergy.patientId}: ${allergy.substance} (${allergy.severity})`);

    return allergyRecord;
  }

  /**
   * Get all active allergies for a patient
   * T5-009: Retrieve patient allergies
   *
   * @param patientId Patient identifier
   * @param includeInactive Whether to include inactive allergies
   * @returns Array of allergy records
   */
  getAllergies(patientId: string, includeInactive: boolean = false): AllergyRecord[] {
    const allergies = this.allergyStore.get(patientId) || [];

    if (includeInactive) {
      return allergies;
    }

    return allergies.filter(allergy => allergy.active);
  }

  /**
   * Update allergy record
   * Allows updating severity, notes, or marking as inactive
   *
   * @param patientId Patient identifier
   * @param allergyId Allergy record ID
   * @param updates Partial allergy updates
   * @returns Updated allergy record or null if not found
   */
  updateAllergy(
    patientId: string,
    allergyId: string,
    updates: Partial<Omit<AllergyRecord, 'id' | 'patientId'>>
  ): AllergyRecord | null {
    const allergies = this.allergyStore.get(patientId);
    if (!allergies) {
      return null;
    }

    const allergyIndex = allergies.findIndex(a => a.id === allergyId);
    if (allergyIndex === -1) {
      return null;
    }

    const updatedAllergy = {
      ...allergies[allergyIndex],
      ...updates,
    };

    allergies[allergyIndex] = updatedAllergy;
    this.allergyStore.set(patientId, allergies);

    console.info(`[Patient Allergy Service] Updated allergy ${allergyId} for patient ${patientId}`);

    return updatedAllergy;
  }

  /**
   * Delete allergy record (mark as inactive)
   * Soft delete to maintain historical record
   *
   * @param patientId Patient identifier
   * @param allergyId Allergy record ID
   * @returns True if deleted, false if not found
   */
  deleteAllergy(patientId: string, allergyId: string): boolean {
    const result = this.updateAllergy(patientId, allergyId, { active: false });
    return result !== null;
  }

  /**
   * Check if medication conflicts with patient allergies
   * T5-009: Cross-reference during prescriptions
   *
   * @param patientId Patient identifier
   * @param medication Medication name or GTIN
   * @returns Array of conflicting allergy records
   */
  checkMedicationAllergies(patientId: string, medication: string): AllergyRecord[] {
    const allergies = this.getAllergies(patientId);
    const conflicts: AllergyRecord[] = [];

    for (const allergy of allergies) {
      // Direct drug match
      if (allergy.type === 'drug') {
        if (this.normalizeString(medication) === this.normalizeString(allergy.substance)) {
          conflicts.push(allergy);
          continue;
        }
      }

      // Drug class match
      if (allergy.type === 'class') {
        if (this.isDrugInClass(medication, allergy.substance)) {
          conflicts.push(allergy);
          continue;
        }
      }

      // Ingredient match (check if medication contains allergenic ingredient)
      if (allergy.type === 'ingredient') {
        if (this.medicationContainsIngredient(medication, allergy.substance)) {
          conflicts.push(allergy);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if drug belongs to an allergenic drug class
   * T5-009: Link allergies to drug classes
   *
   * @param medication Medication name
   * @param drugClass Drug class name
   * @returns True if medication is in the drug class
   */
  private isDrugInClass(medication: string, drugClass: string): boolean {
    const medNormalized = this.normalizeString(medication);
    const classNormalized = this.normalizeString(drugClass);

    // Find drug class mapping
    const classMapping = this.drugClassMappings.find(
      mapping => this.normalizeString(mapping.className) === classNormalized
    );

    if (!classMapping) {
      // Unknown class - conservative approach: don't match
      return false;
    }

    // Check if medication matches any drug in the class
    return classMapping.drugs.some(
      drug => medNormalized.includes(this.normalizeString(drug)) ||
              this.normalizeString(drug).includes(medNormalized)
    );
  }

  /**
   * Check for cross-reactivity between drug classes
   * e.g., Penicillin allergy may cause reactions to Cephalosporins (10% risk)
   *
   * @param drugClass1 First drug class
   * @param drugClass2 Second drug class
   * @returns True if cross-reactivity possible
   */
  hasCrossReactivity(drugClass1: string, drugClass2: string): boolean {
    const class1Normalized = this.normalizeString(drugClass1);
    const class2Normalized = this.normalizeString(drugClass2);

    const class1Mapping = this.drugClassMappings.find(
      mapping => this.normalizeString(mapping.className) === class1Normalized
    );

    if (!class1Mapping || !class1Mapping.crossReactivity) {
      return false;
    }

    return class1Mapping.crossReactivity.some(
      crossClass => this.normalizeString(crossClass) === class2Normalized
    );
  }

  /**
   * Check if medication contains a specific ingredient
   * Simplified implementation - in production would query drug database
   *
   * @param medication Medication name
   * @param ingredient Ingredient name
   * @returns True if medication contains ingredient
   */
  private medicationContainsIngredient(medication: string, ingredient: string): boolean {
    const medNormalized = this.normalizeString(medication);
    const ingredientNormalized = this.normalizeString(ingredient);

    // Simple substring matching
    // In production, would query comprehensive drug database
    return medNormalized.includes(ingredientNormalized);
  }

  /**
   * Get drug class for a medication
   * Returns all classes the medication belongs to
   *
   * @param medication Medication name
   * @returns Array of drug class names
   */
  getDrugClasses(medication: string): string[] {
    const classes: string[] = [];
    const medNormalized = this.normalizeString(medication);

    for (const mapping of this.drugClassMappings) {
      const inClass = mapping.drugs.some(
        drug => medNormalized.includes(this.normalizeString(drug)) ||
                this.normalizeString(drug).includes(medNormalized)
      );

      if (inClass) {
        classes.push(mapping.className);
      }
    }

    return classes;
  }

  /**
   * Get all drugs in a specific class
   *
   * @param drugClass Drug class name
   * @returns Array of drug names in the class
   */
  getDrugsInClass(drugClass: string): string[] {
    const classNormalized = this.normalizeString(drugClass);
    const mapping = this.drugClassMappings.find(
      m => this.normalizeString(m.className) === classNormalized
    );

    return mapping ? mapping.drugs : [];
  }

  /**
   * Generate unique allergy record ID
   *
   * @returns Unique ID string
   */
  private generateAllergyId(): string {
    return `allergy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Normalize string for comparison
   *
   * @param str String to normalize
   * @returns Normalized string
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Clear all allergy records (for testing)
   */
  clearAll(): void {
    this.allergyStore.clear();
    console.info('[Patient Allergy Service] All allergy records cleared');
  }

  /**
   * Get statistics about stored allergies
   *
   * @returns Statistics object
   */
  getStatistics(): {
    totalPatients: number;
    totalAllergies: number;
    activeAllergies: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    let totalAllergies = 0;
    let activeAllergies = 0;
    const byType: Record<string, number> = { drug: 0, ingredient: 0, class: 0 };
    const bySeverity: Record<string, number> = { mild: 0, moderate: 0, severe: 0, anaphylaxis: 0 };

    for (const allergies of this.allergyStore.values()) {
      for (const allergy of allergies) {
        totalAllergies++;
        if (allergy.active) {
          activeAllergies++;
          byType[allergy.type]++;
          bySeverity[allergy.severity]++;
        }
      }
    }

    return {
      totalPatients: this.allergyStore.size,
      totalAllergies,
      activeAllergies,
      byType,
      bySeverity,
    };
  }
}

// Singleton instance
let allergyServiceInstance: PatientAllergyService | null = null;

/**
 * Get singleton instance of PatientAllergyService
 *
 * @returns PatientAllergyService instance
 */
export function getAllergyService(): PatientAllergyService {
  if (!allergyServiceInstance) {
    allergyServiceInstance = new PatientAllergyService();
  }
  return allergyServiceInstance;
}
