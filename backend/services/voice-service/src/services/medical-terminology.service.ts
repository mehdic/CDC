/**
 * Medical Terminology Service
 * Enhances transcription with medical terminology recognition
 * Detects doctor-related terms and pharmaceutical terms for Swiss healthcare context
 */

import { MedicalTerminologyConfig } from '../types/voice.types';

export class MedicalTerminologyService {
  private doctorTerms = [
    'diagnostic',
    'diagnostic',
    'prescription',
    'symptôme',
    'maladie',
    'patient',
    'traitement',
    'infection',
    'virus',
    'antibiotique',
    'allergies',
    'allergie',
    'allergie',
    'tension',
    'pression',
    'glycémie',
    'cholestérol',
    'tension artérielle',
    'examen',
    'radiographie',
    'échographie',
    'scanner',
    'irm',
    'endoscopie',
    'biopsie',
    'tumeur',
    'cancer',
    'leucémie',
    'diabète',
    'hypertension',
    'arythmie',
    'infarctus',
    'accident vasculaire',
    'pneumonie',
    'asthme',
    'bronchite',
    'gastrite',
    'ulcère',
    'hépatite',
    'cirrhose',
    'insuffisance rénale',
    'arthrite',
    'arthrose',
    'ostéoporose',
    'dépression',
    'anxiété',
    'psychose',
    'schizophrénie',
    'épilepsie',
    'migraines',
    'vertiges',
    'neurologue',
    'cardiologue',
    'gastroentérologue',
    'pneumologue',
    'endocrinologue',
    'rhumatologue',
    'psychiatre',
    'urologue',
    'gynécologue',
    'chirurgie',
    'chirurgien',
  ];

  private pharmaTerms = [
    'médicament',
    'medicament',
    'comprimé',
    'comprime',
    'gélule',
    'gelule',
    'sirop',
    'pommade',
    'crème',
    'creme',
    'injection',
    'intraveineuse',
    'intramusculaire',
    'injectable',
    'spray',
    'inhalateur',
    'suppositoire',
    'ovule',
    'collyre',
    'gouttes',
    'patches',
    'patch',
    'timbre',
    'dosage',
    'posologie',
    'posologie',
    'indication',
    'contre-indication',
    'contre indication',
    'effet secondaire',
    'adverse',
    'interaction',
    'toxique',
    'toxicité',
    'pharmacie',
    'pharmacien',
    'pharmacienne',
    'ordonnance',
    'generic',
    'générique',
    'marque',
    'nom de marque',
    'principe actif',
    'excipient',
    'excipients',
    'chlorhydrate',
    'sulfate',
    'phosphate',
    'tartrate',
    'citrate',
    'acétate',
    'fumarate',
    'succinate',
    'malate',
    'oxalate',
    'gluconate',
    'lactate',
    'benzoate',
    'tartrate',
    'poudre',
    'granule',
    'granules',
    'suspension',
    'émulsion',
    'emulsion',
    'solution',
    'solute',
    'concentré',
    'concentre',
    'pâte',
    'pate',
    'emplâtre',
    'emplâtre',
    'liniment',
    'lotion',
    'eau',
    'teinture',
    'extrait',
    'élixir',
    'elixir',
    'sirop',
    'expectorant',
    'antitussif',
    'antihistaminique',
    'anti-inflammatoire',
    'anti inflammatoire',
    'analgésique',
    'analgesique',
    'antipyrétique',
    'antipyretique',
    'antibiotique',
    'antiviral',
    'antifongique',
    'antiparasitaire',
    'anticoagulant',
    'antiaggrégant',
    'vasodilatateur',
    'vasoconstricteur',
    'diurétique',
    'diuretique',
    'antihypertenseur',
    'hypotenseur',
    'hypolipidémiant',
    'hypolipemiant',
    'hypoglycémiant',
    'hypoglycemiant',
    'antidiabétique',
    'antidiabetique',
    'antiarythmique',
    'antiangine',
    'antispasmodique',
    'laxatif',
    'laxative',
    'antidiarrhéique',
    'antidiarrheique',
    'antiémétique',
    'antivomitif',
    'antiacide',
    'gastroprotecteur',
    'prokinétique',
    'prébiotique',
    'probiotique',
    'anxiolytique',
    'hypnotique',
    'sédatif',
    'neuroleptique',
    'antidépresseur',
    'stabilisateur de l\'humeur',
    'hormonal',
    'hormone',
    'corticostéroïde',
    'corticosteroide',
    'glucocorticoïde',
    'glucocorticoide',
    'minéralocorticoïde',
    'mineralocorticoide',
    'œstrogène',
    'estrogene',
    'progestérone',
    'progesterone',
    'testostérone',
    'testosterone',
    'adrénaline',
    'adrenaline',
    'noradrénaline',
    'noradrenaline',
    'sérotonine',
    'serotonine',
    'dopamine',
    'acétylcholine',
    'acetylcholine',
    'vaccin',
    'sérothérapie',
    'serotherapie',
    'immunoglobuline',
    'facteur de coagulation',
    'plasma',
    'concentration',
    'lyophilisé',
    'lyophilise',
  ];

  private swissHealthcareTerms = [
    'pharmalogist',
    'pharmacist',
    'dispensing',
    'e-prescription',
    'eprescription',
    'hcc',
    'healthcare center',
    'mediccare',
    'hins',
    'hin provider',
    'esante',
    'e-santé',
    'dossier patient informatisé',
    'dpi',
    'dossier médical personnel',
    'dmp',
    'canton',
    'cantonale',
    'assurance maladie',
    'assurance-maladie',
    'mutuelle',
    'obligatoire',
    'facultative',
    'franchise',
    'quote-part',
    'tiers payant',
    'tiers garant',
    'ticket modérateur',
    'remboursement',
    'couverture',
    'assuré',
    'assure',
    'bénéficiaire',
    'beneficiaire',
    'ayant droit',
    'personne assurée',
    'cotisant',
    'cotisante',
    'sinistre',
    'sinistré',
    'sinistre',
    'déclaration',
    'declaration',
    'attestation',
    'certificat',
    'ordonnance',
    'prescription',
    'feuille de soin',
    'facture',
    'devis',
    'demande d\'autorisation',
    'authorization',
    'appel d\'offre',
    'marché public',
    'pharmacopée',
    'pharmacopee',
  ];

  private config: MedicalTerminologyConfig;

  constructor(config?: MedicalTerminologyConfig) {
    this.config = config || {};
  }

  /**
   * Detect if text contains doctor-related medical terms
   */
  detectDoctorTerms(text: string): { hasTerms: boolean; terms: string[]; score: number } {
    const textLower = text.toLowerCase();
    const foundTerms = new Set<string>();

    for (const term of this.doctorTerms) {
      // Use word boundaries to match whole words
      const regex = new RegExp(`\\b${term}s?\\b`, 'gi');
      if (regex.test(textLower)) {
        foundTerms.add(term);
      }
    }

    const score = foundTerms.size > 0 ? Math.min((foundTerms.size / this.doctorTerms.length) * 10, 1.0) : 0;

    return {
      hasTerms: foundTerms.size > 0,
      terms: Array.from(foundTerms),
      score,
    };
  }

  /**
   * Detect if text contains pharmaceutical terms
   */
  detectPharmaTerms(text: string): { hasTerms: boolean; terms: string[]; score: number } {
    const textLower = text.toLowerCase();
    const foundTerms = new Set<string>();

    for (const term of this.pharmaTerms) {
      // Use word boundaries to match whole words
      const regex = new RegExp(`\\b${term}s?\\b`, 'gi');
      if (regex.test(textLower)) {
        foundTerms.add(term);
      }
    }

    const score = foundTerms.size > 0 ? Math.min((foundTerms.size / this.pharmaTerms.length) * 10, 1.0) : 0;

    return {
      hasTerms: foundTerms.size > 0,
      terms: Array.from(foundTerms),
      score,
    };
  }

  /**
   * Detect Swiss healthcare specific terms
   */
  detectSwissHealthcareTerms(text: string): { hasTerms: boolean; terms: string[]; score: number } {
    const textLower = text.toLowerCase();
    const foundTerms = new Set<string>();

    for (const term of this.swissHealthcareTerms) {
      const regex = new RegExp(`\\b${term}s?\\b`, 'gi');
      if (regex.test(textLower)) {
        foundTerms.add(term);
      }
    }

    const score = foundTerms.size > 0 ? Math.min((foundTerms.size / this.swissHealthcareTerms.length) * 10, 1.0) : 0;

    return {
      hasTerms: foundTerms.size > 0,
      terms: Array.from(foundTerms),
      score,
    };
  }

  /**
   * Extract medical keywords from transcribed text
   */
  extractKeywords(text: string, minScore = 0.3): string[] {
    const doctorTerms = this.detectDoctorTerms(text);
    const pharmaTerms = this.detectPharmaTerms(text);
    const swissTerms = this.detectSwissHealthcareTerms(text);

    const keywords = new Set<string>();

    if (doctorTerms.score >= minScore) {
      doctorTerms.terms.forEach(t => keywords.add(t));
    }

    if (pharmaTerms.score >= minScore) {
      pharmaTerms.terms.forEach(t => keywords.add(t));
    }

    if (swissTerms.score >= minScore) {
      swissTerms.terms.forEach(t => keywords.add(t));
    }

    return Array.from(keywords);
  }

  /**
   * Analyze full medical content
   */
  analyzeMedicalContent(text: string) {
    return {
      doctor: this.detectDoctorTerms(text),
      pharma: this.detectPharmaTerms(text),
      swissHealthcare: this.detectSwissHealthcareTerms(text),
      allKeywords: this.extractKeywords(text),
    };
  }
}
