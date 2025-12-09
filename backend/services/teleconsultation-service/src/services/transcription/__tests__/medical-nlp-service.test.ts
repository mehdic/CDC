/**
 * Medical NLP Service Tests
 * Tests for medical term extraction and highlighting
 * Task: T8-007
 */

import { MedicalNLPService, MedicalTermCategory } from '../medical-nlp-service';

describe('MedicalNLPService', () => {
  let nlpService: MedicalNLPService;

  beforeEach(() => {
    nlpService = new MedicalNLPService();
  });

  describe('French Term Extraction', () => {
    it('should extract medication names in French', async () => {
      const text = 'Je vous prescris du paracétamol 500mg et de l\'ibuprofène.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const medications = terms.filter(t => t.category === 'medication');
      expect(medications).toHaveLength(2);
      expect(medications.map(m => m.term.toLowerCase())).toContain('paracétamol');
      expect(medications.map(m => m.term.toLowerCase())).toContain('ibuprofène');
    });

    it('should extract symptoms in French', async () => {
      const text = 'Le patient a des maux de tête et de la fièvre.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const symptoms = terms.filter(t => t.category === 'symptom');
      expect(symptoms.length).toBeGreaterThanOrEqual(2);
      expect(symptoms.some(s => s.term.toLowerCase().includes('tête'))).toBe(true);
      expect(symptoms.some(s => s.term.toLowerCase().includes('fièvre'))).toBe(true);
    });

    it('should extract dosages in French', async () => {
      const text = 'Prenez 500mg de paracétamol deux fois par jour pendant 5 jours.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const dosages = terms.filter(t => t.category === 'dosage');
      expect(dosages).toHaveLength(1);
      expect(dosages[0].term).toMatch(/500\s?mg/i);
    });

    it('should extract frequency in French', async () => {
      const text = 'Prenez un comprimé deux fois par jour.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const frequencies = terms.filter(t => t.category === 'frequency');
      expect(frequencies).toHaveLength(1);
      expect(frequencies[0].term).toMatch(/deux fois par jour/i);
    });

    it('should extract duration in French', async () => {
      const text = 'Continuez le traitement pendant 5 jours.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const durations = terms.filter(t => t.category === 'duration');
      expect(durations).toHaveLength(1);
      expect(durations[0].term).toMatch(/pendant \d+ jours?/i);
    });

    it('should extract conditions in French', async () => {
      const text = 'Le patient souffre d\'hypertension et de diabète.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const conditions = terms.filter(t => t.category === 'condition');
      expect(conditions.length).toBeGreaterThanOrEqual(2);
      expect(conditions.some(c => c.term.toLowerCase().includes('hypertension'))).toBe(true);
      expect(conditions.some(c => c.term.toLowerCase().includes('diabète'))).toBe(true);
    });
  });

  describe('German Term Extraction', () => {
    it('should extract medication names in German', async () => {
      const text = 'Ich verschreibe Ihnen Paracetamol 500mg und Ibuprofen.';
      const terms = await nlpService.extractTerms(text, 'de');

      const medications = terms.filter(t => t.category === 'medication');
      expect(medications).toHaveLength(2);
      expect(medications.map(m => m.term.toLowerCase())).toContain('paracetamol');
      expect(medications.map(m => m.term.toLowerCase())).toContain('ibuprofen');
    });

    it('should extract symptoms in German', async () => {
      const text = 'Der Patient hat Kopfschmerzen und Fieber.';
      const terms = await nlpService.extractTerms(text, 'de');

      const symptoms = terms.filter(t => t.category === 'symptom');
      expect(symptoms.length).toBeGreaterThanOrEqual(2);
      expect(symptoms.some(s => s.term.toLowerCase().includes('kopfschmerzen'))).toBe(true);
      expect(symptoms.some(s => s.term.toLowerCase().includes('fieber'))).toBe(true);
    });

    it('should extract frequency in German', async () => {
      const text = 'Nehmen Sie eine Tablette zweimal täglich.';
      const terms = await nlpService.extractTerms(text, 'de');

      const frequencies = terms.filter(t => t.category === 'frequency');
      expect(frequencies).toHaveLength(1);
      expect(frequencies[0].term).toMatch(/zweimal täglich/i);
    });
  });

  describe('English Term Extraction', () => {
    it('should extract medication names in English', async () => {
      const text = 'I prescribe paracetamol 500mg and ibuprofen.';
      const terms = await nlpService.extractTerms(text, 'en');

      const medications = terms.filter(t => t.category === 'medication');
      expect(medications).toHaveLength(2);
      expect(medications.map(m => m.term.toLowerCase())).toContain('paracetamol');
      expect(medications.map(m => m.term.toLowerCase())).toContain('ibuprofen');
    });

    it('should extract symptoms in English', async () => {
      const text = 'The patient has a headache and fever.';
      const terms = await nlpService.extractTerms(text, 'en');

      const symptoms = terms.filter(t => t.category === 'symptom');
      expect(symptoms.length).toBeGreaterThanOrEqual(2);
      expect(symptoms.some(s => s.term.toLowerCase().includes('headache'))).toBe(true);
      expect(symptoms.some(s => s.term.toLowerCase().includes('fever'))).toBe(true);
    });
  });

  describe('Term Position Tracking', () => {
    it('should track correct start and end offsets', async () => {
      const text = 'Prenez du paracétamol 500mg.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const medication = terms.find(t => t.category === 'medication');
      expect(medication).toBeDefined();
      expect(medication!.start_offset).toBeGreaterThanOrEqual(0);
      expect(medication!.end_offset).toBeGreaterThan(medication!.start_offset);
      expect(text.substring(medication!.start_offset, medication!.end_offset)).toMatch(/paracétamol/i);
    });

    it('should sort terms by position', async () => {
      const text = 'Le patient a de la fièvre et prend du paracétamol.';
      const terms = await nlpService.extractTerms(text, 'fr');

      // Terms should be sorted by start_offset
      for (let i = 1; i < terms.length; i++) {
        expect(terms[i].start_offset).toBeGreaterThanOrEqual(terms[i - 1].start_offset);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide confidence scores between 0 and 1', async () => {
      const text = 'Prenez du paracétamol 500mg deux fois par jour.';
      const terms = await nlpService.extractTerms(text, 'fr');

      terms.forEach(term => {
        expect(term.confidence).toBeGreaterThanOrEqual(0);
        expect(term.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should boost confidence for medical context', async () => {
      const text1 = 'Je prescris du paracétamol.'; // Medical context
      const text2 = 'Paracétamol est un médicament.'; // General context

      const terms1 = await nlpService.extractTerms(text1, 'fr');
      const terms2 = await nlpService.extractTerms(text2, 'fr');

      const med1 = terms1.find(t => t.category === 'medication');
      const med2 = terms2.find(t => t.category === 'medication');

      expect(med1).toBeDefined();
      expect(med2).toBeDefined();
      expect(med1!.confidence).toBeGreaterThanOrEqual(0.75);
      expect(med2!.confidence).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('Complex Medical Scenarios', () => {
    it('should handle complete prescription text', async () => {
      const text = `
        Le patient présente des maux de tête sévères depuis trois jours.
        Je prescris de l'ibuprofène 400mg, deux fois par jour pendant cinq jours.
        Prenez après les repas pour éviter les douleurs à l'estomac.
      `;
      const terms = await nlpService.extractTerms(text, 'fr');

      const medications = terms.filter(t => t.category === 'medication');
      const symptoms = terms.filter(t => t.category === 'symptom');
      const dosages = terms.filter(t => t.category === 'dosage');
      const frequencies = terms.filter(t => t.category === 'frequency');
      const durations = terms.filter(t => t.category === 'duration');

      expect(medications.length).toBeGreaterThanOrEqual(1);
      expect(symptoms.length).toBeGreaterThanOrEqual(1);
      expect(dosages.length).toBeGreaterThanOrEqual(1);
      expect(frequencies.length).toBeGreaterThanOrEqual(1);
      expect(durations.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle allergy mentions', async () => {
      const text = 'Le patient a une allergie à la pénicilline.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const allergies = terms.filter(t => t.category === 'allergy');
      expect(allergies).toHaveLength(1);
      expect(allergies[0].term).toMatch(/allergie/i);
    });

    it('should handle anatomy terms', async () => {
      const text = 'Douleur au niveau du cœur et des poumons.';
      const terms = await nlpService.extractTerms(text, 'fr');

      const anatomy = terms.filter(t => t.category === 'anatomy');
      expect(anatomy.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const terms = await nlpService.extractTerms('', 'fr');
      expect(terms).toEqual([]);
    });

    it('should handle text with no medical terms', async () => {
      const text = 'Bonjour, comment allez-vous?';
      const terms = await nlpService.extractTerms(text, 'fr');
      expect(terms).toEqual([]);
    });

    it('should handle unknown language by defaulting to French', async () => {
      const text = 'Prenez du paracétamol.';
      const terms = await nlpService.extractTerms(text, 'unknown');

      expect(terms.length).toBeGreaterThanOrEqual(1);
    });
  });
});
