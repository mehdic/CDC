/**
 * Medical NLP Service
 * Highlights medical terms (drugs, dosages, symptoms) in transcribed text
 *
 * Features:
 * - Drug name detection with dosage extraction
 * - Medical symptom identification
 * - Link to drug database entries
 * - French and German medical terminology support
 */

export interface MedicalEntity {
  type: 'drug' | 'dosage' | 'symptom' | 'condition';
  text: string;
  start: number;
  end: number;
  confidence: number;
  metadata?: {
    drugId?: string;
    strength?: string;
    frequency?: string;
    route?: string;
  };
}

export interface MedicalNlpResult {
  entities: MedicalEntity[];
  highlightedText: string;
  summary: {
    drugCount: number;
    symptomCount: number;
    dosageCount: number;
  };
}

/**
 * Common drug names (French and German)
 * In production, this would be loaded from a drug database
 */
const DRUG_PATTERNS = [
  // Pain relievers
  /\b(paracetamol|acetaminophen|dafalgan|panadol)\b/gi,
  /\b(ibuprofen|brufen|algifor)\b/gi,
  /\b(aspirin|aspirine|cardioaspirin)\b/gi,
  /\b(diclofenac|voltaren)\b/gi,

  // Antibiotics
  /\b(amoxicillin|amoxicilline|clamoxyl)\b/gi,
  /\b(azithromycin|azithromycine|zithromax)\b/gi,
  /\b(ciprofloxacin|ciprofloxacine|cipro)\b/gi,
  /\b(doxycyclin|doxycycline|vibramycin)\b/gi,

  // Cardiovascular
  /\b(metoprolol|beloc|lopresor)\b/gi,
  /\b(amlodipine|norvasc)\b/gi,
  /\b(enalapril|renitec)\b/gi,
  /\b(simvastatin|zocor)\b/gi,
  /\b(atorvastatin|lipitor)\b/gi,

  // Diabetes
  /\b(metformin|metformine|glucophage)\b/gi,
  /\b(insulin|insuline)\b/gi,
  /\b(glimepiride|amaryl)\b/gi,

  // Respiratory
  /\b(salbutamol|ventolin|albuterol)\b/gi,
  /\b(budesonide|pulmicort)\b/gi,
  /\b(montelukast|singulair)\b/gi,

  // German specific
  /\b(schmerzmittel|antibiotika|hustenmittel)\b/gi,
];

/**
 * Dosage patterns (multi-language)
 */
const DOSAGE_PATTERNS = [
  // Numeric with units
  /\b(\d+(?:[.,]\d+)?)\s*(mg|g|ml|mcg|µg|ui|ie)\b/gi,

  // Frequency patterns (French)
  /\b(\d+)\s*(?:fois|x)\s*par\s*(?:jour|semaine|mois)\b/gi,
  /\b(?:une|deux|trois)\s*fois\s*par\s*jour\b/gi,
  /\b(?:matin|midi|soir|coucher)\b/gi,

  // Frequency patterns (German)
  /\b(\d+)\s*(?:mal|x)\s*(?:täglich|pro tag|wöchentlich)\b/gi,
  /\b(?:morgens|mittags|abends)\b/gi,

  // Route of administration
  /\b(?:oral|per os|sublingual|intravenous|iv|im|sc|topical)\b/gi,
  /\b(?:par voie orale|par injection|en application locale)\b/gi,
];

/**
 * Medical symptoms and conditions (French and German)
 */
const SYMPTOM_PATTERNS = [
  // Pain
  /\b(?:douleur|mal|schmerz|schmerzen)\b/gi,
  /\b(?:migraine|kopfschmerz|céphalée)\b/gi,
  /\b(?:lombalgie|rückenschmerz)\b/gi,

  // Respiratory
  /\b(?:toux|husten|cough)\b/gi,
  /\b(?:dyspnée|atemnot|essoufflement)\b/gi,
  /\b(?:asthme|asthma)\b/gi,

  // Digestive
  /\b(?:nausée|übelkeit|nausea)\b/gi,
  /\b(?:diarrhée|durchfall|diarrhea)\b/gi,
  /\b(?:constipation|verstopfung)\b/gi,
  /\b(?:vomissement|erbrechen)\b/gi,

  // Cardiovascular
  /\b(?:hypertension|bluthochdruck|high blood pressure)\b/gi,
  /\b(?:palpitation|herzklopfen)\b/gi,
  /\b(?:arythmie|herzrhythmusstörung)\b/gi,

  // Neurological
  /\b(?:vertige|schwindel|dizziness)\b/gi,
  /\b(?:insomnie|schlaflosigkeit|insomnia)\b/gi,
  /\b(?:anxiété|angst|anxiety)\b/gi,

  // Infection
  /\b(?:fièvre|fieber|fever)\b/gi,
  /\b(?:infection|infektion)\b/gi,
  /\b(?:inflammation|entzündung)\b/gi,
];

/**
 * Drug database (simplified - in production, query from database)
 */
const DRUG_DATABASE: Record<string, { id: string; genericName: string; brandNames: string[] }> = {
  'paracetamol': {
    id: 'DRUG-001',
    genericName: 'Paracetamol',
    brandNames: ['Dafalgan', 'Panadol', 'Tylenol'],
  },
  'ibuprofen': {
    id: 'DRUG-002',
    genericName: 'Ibuprofen',
    brandNames: ['Brufen', 'Algifor', 'Advil'],
  },
  'amoxicillin': {
    id: 'DRUG-003',
    genericName: 'Amoxicillin',
    brandNames: ['Clamoxyl', 'Amoxil'],
  },
  'metformin': {
    id: 'DRUG-004',
    genericName: 'Metformin',
    brandNames: ['Glucophage', 'Stagid'],
  },
  'salbutamol': {
    id: 'DRUG-005',
    genericName: 'Salbutamol',
    brandNames: ['Ventolin', 'Airomir'],
  },
};

export class MedicalNlpService {
  /**
   * Analyze transcribed text and extract medical entities
   */
  public async analyzeMedicalText(text: string): Promise<MedicalNlpResult> {
    const entities: MedicalEntity[] = [];

    // Extract drugs
    const drugEntities = this.extractDrugs(text);
    entities.push(...drugEntities);

    // Extract dosages
    const dosageEntities = this.extractDosages(text);
    entities.push(...dosageEntities);

    // Extract symptoms
    const symptomEntities = this.extractSymptoms(text);
    entities.push(...symptomEntities);

    // Sort by position
    entities.sort((a, b) => a.start - b.start);

    // Generate highlighted text
    const highlightedText = this.generateHighlightedText(text, entities);

    return {
      entities,
      highlightedText,
      summary: {
        drugCount: drugEntities.length,
        symptomCount: symptomEntities.length,
        dosageCount: dosageEntities.length,
      },
    };
  }

  /**
   * Extract drug names from text
   */
  private extractDrugs(text: string): MedicalEntity[] {
    const entities: MedicalEntity[] = [];

    for (const pattern of DRUG_PATTERNS) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const drugName = match[1].toLowerCase();
        const drugInfo = DRUG_DATABASE[drugName];

        entities.push({
          type: 'drug',
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.85,
          metadata: drugInfo ? {
            drugId: drugInfo.id,
          } : undefined,
        });
      }
    }

    return entities;
  }

  /**
   * Extract dosage information
   */
  private extractDosages(text: string): MedicalEntity[] {
    const entities: MedicalEntity[] = [];

    for (const pattern of DOSAGE_PATTERNS) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const dosageText = match[0];

        // Parse dosage metadata
        const metadata: any = {};

        // Extract strength (e.g., "500mg")
        const strengthMatch = dosageText.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|ml|mcg|µg)/i);
        if (strengthMatch) {
          metadata.strength = `${strengthMatch[1]}${strengthMatch[2]}`;
        }

        // Extract frequency (e.g., "2x par jour")
        const freqMatch = dosageText.match(/(\d+)\s*(?:fois|x|mal)/i);
        if (freqMatch) {
          metadata.frequency = freqMatch[1];
        }

        entities.push({
          type: 'dosage',
          text: dosageText,
          start: match.index,
          end: match.index + dosageText.length,
          confidence: 0.90,
          metadata,
        });
      }
    }

    return entities;
  }

  /**
   * Extract symptoms and conditions
   */
  private extractSymptoms(text: string): MedicalEntity[] {
    const entities: MedicalEntity[] = [];

    for (const pattern of SYMPTOM_PATTERNS) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'symptom',
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.80,
        });
      }
    }

    return entities;
  }

  /**
   * Generate highlighted text with HTML-like markup
   */
  private generateHighlightedText(text: string, entities: MedicalEntity[]): string {
    let result = '';
    let lastIndex = 0;

    for (const entity of entities) {
      // Add text before entity
      result += text.substring(lastIndex, entity.start);

      // Add highlighted entity
      const highlightClass = this.getHighlightClass(entity.type);
      result += `<span class="${highlightClass}" data-type="${entity.type}" data-confidence="${entity.confidence}">`;
      result += text.substring(entity.start, entity.end);
      result += '</span>';

      lastIndex = entity.end;
    }

    // Add remaining text
    result += text.substring(lastIndex);

    return result;
  }

  /**
   * Get CSS class for highlighting
   */
  private getHighlightClass(type: MedicalEntity['type']): string {
    switch (type) {
      case 'drug':
        return 'medical-highlight-drug';
      case 'dosage':
        return 'medical-highlight-dosage';
      case 'symptom':
        return 'medical-highlight-symptom';
      case 'condition':
        return 'medical-highlight-condition';
      default:
        return 'medical-highlight';
    }
  }

  /**
   * Link drug entities to database records
   */
  public async linkToDrugDatabase(entities: MedicalEntity[]): Promise<MedicalEntity[]> {
    return entities.map((entity) => {
      if (entity.type === 'drug') {
        const drugName = entity.text.toLowerCase();
        const drugInfo = DRUG_DATABASE[drugName];

        if (drugInfo && !entity.metadata?.drugId) {
          return {
            ...entity,
            metadata: {
              ...entity.metadata,
              drugId: drugInfo.id,
            },
          };
        }
      }
      return entity;
    });
  }

  /**
   * Validate medical entities against contraindications
   * (Placeholder for future drug interaction checking)
   */
  public async checkDrugInteractions(drugIds: string[]): Promise<{
    hasInteractions: boolean;
    interactions: Array<{ drug1: string; drug2: string; severity: string; description: string }>;
  }> {
    // TODO: Implement real drug interaction checking
    return {
      hasInteractions: false,
      interactions: [],
    };
  }
}

/**
 * Singleton instance
 */
export const medicalNlpService = new MedicalNlpService();
