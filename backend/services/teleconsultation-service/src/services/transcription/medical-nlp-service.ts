/**
 * Medical NLP Service
 * Extracts and highlights medical terms from transcribed text
 * Task: T8-007
 *
 * Features:
 * - Medical terminology recognition (drugs, symptoms, conditions, etc.)
 * - Multi-language support (French, German, English)
 * - Integration with FDB drug database (when available)
 * - Confidence scoring based on context
 * - Structured annotations with term positions
 */

import { MedicalTerm } from './types';

/**
 * Medical term categories
 */
export enum MedicalTermCategory {
  MEDICATION = 'medication',
  SYMPTOM = 'symptom',
  DOSAGE = 'dosage',
  FREQUENCY = 'frequency',
  DURATION = 'duration',
  CONDITION = 'condition',
  VITAL = 'vital',
  ROUTE = 'route',
  ANATOMY = 'anatomy',
  PROCEDURE = 'procedure',
  ALLERGY = 'allergy',
}

/**
 * Medical term pattern definition
 */
interface TermPattern {
  pattern: RegExp;
  category: MedicalTermCategory;
  normalizer?: (match: string) => string;
}

/**
 * FDB drug database integration interface
 */
interface FDBDrugDatabase {
  searchDrug(query: string): Promise<{ brandName: string; genericName: string } | null>;
}

/**
 * Medical NLP Service
 * Provides medical term extraction and highlighting
 */
export class MedicalNLPService {
  private frenchPatterns: TermPattern[];
  private germanPatterns: TermPattern[];
  private englishPatterns: TermPattern[];
  private fdbDatabase: FDBDrugDatabase | null = null;

  constructor(fdbDatabase?: FDBDrugDatabase) {
    this.fdbDatabase = fdbDatabase || null;
    this.frenchPatterns = this.buildFrenchPatterns();
    this.germanPatterns = this.buildGermanPatterns();
    this.englishPatterns = this.buildEnglishPatterns();
  }

  /**
   * Extract medical terms from text
   */
  async extractTerms(text: string, language: string = 'fr'): Promise<MedicalTerm[]> {
    const patterns = this.getPatternsForLanguage(language);
    const terms: MedicalTerm[] = [];

    for (const patternDef of patterns) {
      const matches = text.matchAll(patternDef.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          const term = match[0];
          const normalized = patternDef.normalizer ? patternDef.normalizer(term) : term;

          // Check FDB database for drug names
          let finalNormalized = normalized;
          if (patternDef.category === MedicalTermCategory.MEDICATION && this.fdbDatabase) {
            const drugInfo = await this.fdbDatabase.searchDrug(term);
            if (drugInfo) {
              finalNormalized = drugInfo.genericName || normalized;
            }
          }

          terms.push({
            term,
            category: patternDef.category,
            start_offset: match.index,
            end_offset: match.index + term.length,
            confidence: this.calculateConfidence(term, patternDef.category, text, match.index),
          });
        }
      }
    }

    // Sort by start offset
    return terms.sort((a, b) => a.start_offset - b.start_offset);
  }

  /**
   * Get patterns for specific language
   */
  private getPatternsForLanguage(language: string): TermPattern[] {
    switch (language.toLowerCase()) {
      case 'fr':
        return this.frenchPatterns;
      case 'de':
        return this.germanPatterns;
      case 'en':
        return this.englishPatterns;
      default:
        return this.frenchPatterns; // Default to French for Swiss market
    }
  }

  /**
   * Calculate confidence score based on context
   */
  private calculateConfidence(
    term: string,
    category: MedicalTermCategory,
    fullText: string,
    position: number
  ): number {
    let confidence = 0.75; // Base confidence

    // Boost confidence if term appears in medical context
    const contextWindow = 50;
    const start = Math.max(0, position - contextWindow);
    const end = Math.min(fullText.length, position + term.length + contextWindow);
    const context = fullText.substring(start, end).toLowerCase();

    // Context indicators
    const contextIndicators = {
      medication: ['prescri', 'traitement', 'médicament', 'comprimé', 'prendre', 'treatment', 'pill', 'tablet'],
      symptom: ['ressent', 'douleur', 'symptôme', 'souffre', 'feel', 'pain', 'symptom', 'suffer'],
      dosage: ['mg', 'gramme', 'dose', 'posologie'],
      condition: ['diagnostic', 'maladie', 'trouble', 'diagnosis', 'disease', 'disorder'],
    };

    const indicators = contextIndicators[category as keyof typeof contextIndicators] || [];
    const contextMatches = indicators.filter(indicator => context.includes(indicator)).length;
    confidence += Math.min(0.20, contextMatches * 0.05);

    // Boost if term is capitalized (often indicates proper drug name)
    if (category === MedicalTermCategory.MEDICATION && term[0] === term[0].toUpperCase()) {
      confidence += 0.05;
    }

    return Math.min(0.99, confidence);
  }

  /**
   * Build French medical term patterns
   */
  private buildFrenchPatterns(): TermPattern[] {
    return [
      // Medications (common French drugs)
      {
        pattern: /(ibuprofène|paracétamol|aspirine|amoxicilline|doliprane|efferalgan|advil|dafalgan|métronidazole|azithromycine|cétirizine|loratadine|oméprazole|esoméprazole|atorvastatine|metformine|lisinopril|amlodipine|simvastatine|lévothyroxine|ramipril|bisoprolol)/gi,
        category: MedicalTermCategory.MEDICATION,
      },
      // Symptoms
      {
        pattern: /(maux de tête|céphalée|migraine|douleur|fièvre|nausée|vomissement|fatigue|vertige|toux|mal de gorge|congestion|écoulement nasal|diarrhée|constipation|palpitation|essoufflement|insomnie|anxiété|dépression)/gi,
        category: MedicalTermCategory.SYMPTOM,
      },
      // Dosages
      {
        pattern: /(\d+\s?(mg|g|gramme|milligramme|ml|millilitre|µg|microgramme|UI|unité internationale))/gi,
        category: MedicalTermCategory.DOSAGE,
      },
      // Frequency
      {
        pattern: /(une fois par jour|deux fois par jour|trois fois par jour|quatre fois par jour|toutes les \d+ heures?|matin et soir|au coucher|avant les repas|après les repas|pendant les repas|si besoin)/gi,
        category: MedicalTermCategory.FREQUENCY,
      },
      // Duration
      {
        pattern: /(pendant \d+ jours?|pendant \d+ semaines?|pendant \d+ mois|durant \d+ jours?|pour \d+ jours?|cinq jours|trois jours)/gi,
        category: MedicalTermCategory.DURATION,
      },
      // Conditions
      {
        pattern: /(hypertension|diabète|asthme|allergie|infection|inflammation|arthrite|ostéoporose|insuffisance cardiaque|bronchite|pneumonie|grippe|rhume|angine|otite|sinusite|cystite)/gi,
        category: MedicalTermCategory.CONDITION,
      },
      // Routes of administration
      {
        pattern: /(par voie orale|voie orale|par injection|intraveineuse|intramusculaire|sous-cutanée|topique|cutanée|rectale|vaginale|nasale|inhalation|sublinguale)/gi,
        category: MedicalTermCategory.ROUTE,
      },
      // Anatomy
      {
        pattern: /(cœur|poumon|foie|rein|estomac|intestin|cerveau|tête|front|tempe|gorge|nez|oreille|œil|peau|muscle|os|articulation|dos|abdomen|poitrine)/gi,
        category: MedicalTermCategory.ANATOMY,
      },
      // Allergy
      {
        pattern: /(allergie|allergique|intolérance|hypersensibilité)/gi,
        category: MedicalTermCategory.ALLERGY,
      },
      // Vitals
      {
        pattern: /(tension artérielle|pression artérielle|fréquence cardiaque|pouls|température|saturation|glycémie|poids|taille|IMC)/gi,
        category: MedicalTermCategory.VITAL,
      },
    ];
  }

  /**
   * Build German medical term patterns (Swiss German medical terms)
   */
  private buildGermanPatterns(): TermPattern[] {
    return [
      // Medications (common German/Swiss drugs)
      {
        pattern: /(ibuprofen|paracetamol|aspirin|amoxicillin|dafalgan|algifor|ben-u-ron|metronidazol|azithromycin|cetirizin|loratadin|omeprazol|esomeprazol|atorvastatin|metformin|lisinopril|amlodipin|simvastatin|levothyroxin)/gi,
        category: MedicalTermCategory.MEDICATION,
      },
      // Symptoms
      {
        pattern: /(kopfschmerzen|migräne|schmerz|fieber|übelkeit|erbrechen|müdigkeit|schwindel|husten|halsschmerzen|verstopfung|durchfall|herzklopfen|atemnot|schlaflosigkeit|angst)/gi,
        category: MedicalTermCategory.SYMPTOM,
      },
      // Dosages
      {
        pattern: /(\d+\s?(mg|g|gramm|milligramm|ml|milliliter|µg|mikrogramm|IE|internationale einheit))/gi,
        category: MedicalTermCategory.DOSAGE,
      },
      // Frequency
      {
        pattern: /(einmal täglich|zweimal täglich|dreimal täglich|alle \d+ stunden|morgens und abends|vor dem schlafengehen|vor den mahlzeiten|nach den mahlzeiten|während der mahlzeiten|bei bedarf)/gi,
        category: MedicalTermCategory.FREQUENCY,
      },
      // Duration
      {
        pattern: /(für \d+ tage?|für \d+ wochen?|für \d+ monate?)/gi,
        category: MedicalTermCategory.DURATION,
      },
      // Conditions
      {
        pattern: /(bluthochdruck|diabetes|asthma|allergie|infektion|entzündung|arthritis|osteoporose|herzinsuffizienz|bronchitis|lungenentzündung|grippe|erkältung|mandelentzündung|mittelohrentzündung|blasenentzündung)/gi,
        category: MedicalTermCategory.CONDITION,
      },
      // Routes
      {
        pattern: /(oral|durch injektion|intravenös|intramuskulär|subkutan|topisch|rektal|vaginal|nasal|inhalation|sublingual)/gi,
        category: MedicalTermCategory.ROUTE,
      },
      // Anatomy
      {
        pattern: /(herz|lunge|leber|niere|magen|darm|gehirn|kopf|stirn|schläfe|hals|nase|ohr|auge|haut|muskel|knochen|gelenk|rücken|bauch|brust)/gi,
        category: MedicalTermCategory.ANATOMY,
      },
      // Allergy
      {
        pattern: /(allergie|allergisch|unverträglichkeit|überempfindlichkeit)/gi,
        category: MedicalTermCategory.ALLERGY,
      },
      // Vitals
      {
        pattern: /(blutdruck|herzfrequenz|puls|temperatur|sauerstoffsättigung|blutzucker|gewicht|größe|BMI)/gi,
        category: MedicalTermCategory.VITAL,
      },
    ];
  }

  /**
   * Build English medical term patterns
   */
  private buildEnglishPatterns(): TermPattern[] {
    return [
      // Medications
      {
        pattern: /(ibuprofen|paracetamol|acetaminophen|aspirin|amoxicillin|metronidazole|azithromycin|cetirizine|loratadine|omeprazole|esomeprazole|atorvastatin|metformin|lisinopril|amlodipine|simvastatin|levothyroxine)/gi,
        category: MedicalTermCategory.MEDICATION,
      },
      // Symptoms
      {
        pattern: /(headache|migraine|pain|fever|nausea|vomiting|fatigue|dizziness|cough|sore throat|congestion|runny nose|diarrhea|constipation|palpitation|shortness of breath|insomnia|anxiety|depression)/gi,
        category: MedicalTermCategory.SYMPTOM,
      },
      // Dosages
      {
        pattern: /(\d+\s?(mg|g|gram|milligram|ml|milliliter|µg|microgram|IU|international unit))/gi,
        category: MedicalTermCategory.DOSAGE,
      },
      // Frequency
      {
        pattern: /(once daily|twice daily|three times daily|four times daily|every \d+ hours?|morning and evening|at bedtime|before meals|after meals|with meals|as needed)/gi,
        category: MedicalTermCategory.FREQUENCY,
      },
      // Duration
      {
        pattern: /(for \d+ days?|for \d+ weeks?|for \d+ months?)/gi,
        category: MedicalTermCategory.DURATION,
      },
      // Conditions
      {
        pattern: /(hypertension|diabetes|asthma|allergy|infection|inflammation|arthritis|osteoporosis|heart failure|bronchitis|pneumonia|flu|cold|tonsillitis|otitis|cystitis)/gi,
        category: MedicalTermCategory.CONDITION,
      },
      // Routes
      {
        pattern: /(oral|orally|by injection|intravenous|intramuscular|subcutaneous|topical|rectal|vaginal|nasal|inhalation|sublingual)/gi,
        category: MedicalTermCategory.ROUTE,
      },
      // Anatomy
      {
        pattern: /(heart|lung|liver|kidney|stomach|intestine|brain|head|forehead|temple|throat|nose|ear|eye|skin|muscle|bone|joint|back|abdomen|chest)/gi,
        category: MedicalTermCategory.ANATOMY,
      },
      // Allergy
      {
        pattern: /(allergy|allergic|intolerance|hypersensitivity)/gi,
        category: MedicalTermCategory.ALLERGY,
      },
      // Vitals
      {
        pattern: /(blood pressure|heart rate|pulse|temperature|oxygen saturation|blood sugar|weight|height|BMI)/gi,
        category: MedicalTermCategory.VITAL,
      },
    ];
  }
}

/**
 * Singleton instance
 */
let medicalNLPServiceInstance: MedicalNLPService | null = null;

export function getMedicalNLPService(fdbDatabase?: FDBDrugDatabase): MedicalNLPService {
  if (!medicalNLPServiceInstance) {
    medicalNLPServiceInstance = new MedicalNLPService(fdbDatabase);
  }
  return medicalNLPServiceInstance;
}

export function setMedicalNLPService(service: MedicalNLPService): void {
  medicalNLPServiceInstance = service;
}
