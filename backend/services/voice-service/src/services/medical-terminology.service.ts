import { MedicalAnalysis } from '../types/voice.types';

/**
 * Medical Terminology Service
 * Detects medical and pharmaceutical terminology in transcribed text
 * Supports multilingual Swiss healthcare terminology (FR, DE, IT)
 */
export class MedicalTerminologyService {
  private doctorTerms: string[];
  private pharmaTerms: string[];

  constructor() {
    this.doctorTerms = [
      'doctor',
      'médecin',
      'physician',
      'arzt',
      'dottore',
      'specialist',
      'spécialist',
      'cardiologist',
      'neurologue',
      'surgeon',
      'chirurgien',
      'nurse',
      'infirmière',
      'dentist',
      'dentiste',
      'pharmacist',
      'pharmacien',
      'therapy',
      'thérapie',
      'treatment',
      'traitement',
      'consultation',
      'appointment',
      'rendez-vous',
      'prescription',
      'ordonnance',
      'diagnosis',
      'diagnostic',
      'patient',
      'healthcare',
      'soins',
      'medical',
      'médical',
      'clinical',
      'clinique',
    ];

    this.pharmaTerms = [
      'medication',
      'médicament',
      'drug',
      'drogue',
      'tablet',
      'comprimé',
      'capsule',
      'pill',
      'pilule',
      'injection',
      'vaccine',
      'vaccin',
      'antibiotic',
      'antibiotique',
      'painkiller',
      'analgésique',
      'aspirin',
      'ibuprofen',
      'paracetamol',
      'amoxicillin',
      'penicillin',
      'pénicilline',
      'dosage',
      'dose',
      'milligram',
      'mg',
      'gram',
      'pharmacy',
      'pharmacie',
      'dispensary',
      'dispensaire',
      'pharmaceutical',
      'pharmaceutique',
      'contraindication',
      'side effect',
      'effet secondaire',
      'allergy',
      'allergie',
      'intolerance',
      'intolérance',
      // Swiss drug brands
      'dafalgan',
      'voltaren',
      'metformine',
      'amlodipine',
      'simvastatine',
      'oméprazole',
      'ramipril',
      'levothyroxine',
    ];
  }

  analyzeMedicalContent(text: string): MedicalAnalysis {
    if (!text || text.trim().length === 0) {
      return {
        doctor: { hasTerms: false, terms: [] },
        pharma: { hasTerms: false, terms: [] },
        allKeywords: [],
      };
    }

    const lowerText = text.toLowerCase();

    const doctorMatches = this.extractMatchingTerms(lowerText, this.doctorTerms);
    const pharmaMatches = this.extractMatchingTerms(lowerText, this.pharmaTerms);

    const allKeywords = Array.from(
      new Set([...doctorMatches, ...pharmaMatches]),
    );

    return {
      doctor: {
        hasTerms: doctorMatches.length > 0,
        terms: doctorMatches,
      },
      pharma: {
        hasTerms: pharmaMatches.length > 0,
        terms: pharmaMatches,
      },
      allKeywords,
    };
  }

  private extractMatchingTerms(text: string, terms: string[]): string[] {
    const matches: string[] = [];
    const seen = new Set<string>();

    terms.forEach((term) => {
      const pattern = new RegExp(`\\b${term}s?\\b`, 'gi');
      const found = text.match(pattern);

      if (found) {
        found.forEach((match) => {
          const normalized = match.toLowerCase();
          if (!seen.has(normalized)) {
            matches.push(normalized);
            seen.add(normalized);
          }
        });
      }
    });

    return matches;
  }

  getCategoryCount(text: string): {
    doctorTermCount: number;
    pharmaTermCount: number;
  } {
    const analysis = this.analyzeMedicalContent(text);
    return {
      doctorTermCount: analysis.doctor.terms.length,
      pharmaTermCount: analysis.pharma.terms.length,
    };
  }

  hasDoctorTerms(text: string): boolean {
    return this.analyzeMedicalContent(text).doctor.hasTerms;
  }

  hasPharmaTerms(text: string): boolean {
    return this.analyzeMedicalContent(text).pharma.hasTerms;
  }

  addDoctorTerm(term: string): void {
    if (!this.doctorTerms.includes(term.toLowerCase())) {
      this.doctorTerms.push(term.toLowerCase());
    }
  }

  addPharmaTerm(term: string): void {
    if (!this.pharmaTerms.includes(term.toLowerCase())) {
      this.pharmaTerms.push(term.toLowerCase());
    }
  }

  getDoctorTerms(): string[] {
    return [...this.doctorTerms];
  }

  getPharmaTerms(): string[] {
    return [...this.pharmaTerms];
  }
}
