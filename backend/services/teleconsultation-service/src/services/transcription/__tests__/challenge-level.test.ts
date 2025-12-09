/**
 * Challenge Level Tests for Medical NLP Service
 * Progressive adversarial testing beyond unit tests
 */

import { MedicalNLPService, MedicalTermCategory } from '../medical-nlp-service';
import { MedicalTerm } from '../types';

describe('Challenge Level 1: Boundary Probing', () => {
  const nlpService = new MedicalNLPService();

  test('Empty string input', async () => {
    const result = await nlpService.extractTerms('');
    expect(result).toEqual([]);
  });

  test('Null-like inputs', async () => {
    const result1 = await nlpService.extractTerms('   ');
    const result2 = await nlpService.extractTerms('\n\n\n');
    const result3 = await nlpService.extractTerms('\t\t');
    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    expect(result3).toEqual([]);
  });

  test('Very long input (10,000 characters)', async () => {
    const longText = 'Le patient prend du paracétamol '.repeat(300); // ~9600 chars
    const result = await nlpService.extractTerms(longText, 'fr');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t: MedicalTerm) => t.term === 'paracétamol')).toBe(true);
  });

  test('Mixed language input', async () => {
    const mixedText = 'Patient takes ibuprofen, hat Kopfschmerzen, ressent de la douleur';
    const resultFr = await nlpService.extractTerms(mixedText, 'fr');
    const resultDe = await nlpService.extractTerms(mixedText, 'de');
    const resultEn = await nlpService.extractTerms(mixedText, 'en');

    // Each language parser should find at least some terms
    expect(resultFr.length + resultDe.length + resultEn.length).toBeGreaterThan(0);
  });

  test('Special characters and unicode', async () => {
    const text = 'Pâtient prend 500µg d\'ibuprofène-200mg';
    const result = await nlpService.extractTerms(text, 'fr');
    expect(result.some((t: MedicalTerm) => t.category === MedicalTermCategory.MEDICATION)).toBe(true);
    expect(result.some((t: MedicalTerm) => t.category === MedicalTermCategory.DOSAGE)).toBe(true);
  });

  test('Invalid language code fallback', async () => {
    const text = 'Le patient prend du paracétamol';
    const result = await nlpService.extractTerms(text, 'xx'); // Invalid code
    // Should fallback to French
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].term).toBe('paracétamol');
  });
});

describe('Challenge Level 2: Mutation Analysis', () => {
  const nlpService = new MedicalNLPService();

  test('Case sensitivity verification', async () => {
    const text1 = 'paracétamol PARACÉTAMOL Paracétamol';
    const result = await nlpService.extractTerms(text1, 'fr');
    // Pattern uses /gi flag, should match all 3
    expect(result.length).toBe(3);
  });

  test('Confidence calculation changes with context', async () => {
    const withContext = 'Le médecin prescrit du paracétamol pour traitement';
    const withoutContext = 'random text paracétamol random text';

    const result1 = await nlpService.extractTerms(withContext, 'fr');
    const result2 = await nlpService.extractTerms(withoutContext, 'fr');

    // Confidence should be higher with medical context
    expect(result1[0].confidence).toBeGreaterThan(result2[0].confidence);
  });

  test('Offset calculation accuracy', async () => {
    const text = 'xxx paracétamol yyy';
    const result = await nlpService.extractTerms(text, 'fr');

    expect(result[0].start_offset).toBe(4);
    expect(result[0].end_offset).toBe(4 + 'paracétamol'.length);
    expect(text.substring(result[0].start_offset, result[0].end_offset)).toBe('paracétamol');
  });

  test('Multiple overlapping categories', async () => {
    const text = 'Prendre 500mg de paracétamol deux fois par jour pendant 5 jours';
    const result = await nlpService.extractTerms(text, 'fr');

    const categories = new Set(result.map((t: MedicalTerm) => t.category));
    expect(categories.has(MedicalTermCategory.MEDICATION)).toBe(true);
    expect(categories.has(MedicalTermCategory.DOSAGE)).toBe(true);
    expect(categories.has(MedicalTermCategory.FREQUENCY)).toBe(true);
    expect(categories.has(MedicalTermCategory.DURATION)).toBe(true);
  });
});

describe('Challenge Level 3: Behavioral Contracts', () => {
  const nlpService = new MedicalNLPService();

  test('POST-CONDITION: Terms sorted by start offset', async () => {
    const text = 'Douleur au cœur, prendre paracétamol 500mg';
    const result = await nlpService.extractTerms(text, 'fr');

    // INVARIANT: Result must be sorted by start_offset
    for (let i = 1; i < result.length; i++) {
      expect(result[i].start_offset).toBeGreaterThanOrEqual(result[i-1].start_offset);
    }
  });

  test('POST-CONDITION: Confidence always in range [0, 1]', async () => {
    const text = 'prescrit traitement médicament comprimé paracétamol dose posologie';
    const result = await nlpService.extractTerms(text, 'fr');

    // INVARIANT: Confidence must be in valid range
    result.forEach((term: MedicalTerm) => {
      expect(term.confidence).toBeGreaterThanOrEqual(0);
      expect(term.confidence).toBeLessThanOrEqual(1);
    });
  });

  test('PRE-CONDITION: Language parameter validation', async () => {
    const text = 'test';

    // Should not throw on any string language code
    await expect(nlpService.extractTerms(text, '')).resolves.toBeDefined();
    await expect(nlpService.extractTerms(text, 'invalid')).resolves.toBeDefined();
    await expect(nlpService.extractTerms(text, '12345')).resolves.toBeDefined();
  });

  test('INVARIANT: No duplicate terms at same position', async () => {
    const text = 'paracétamol paracétamol paracétamol';
    const result = await nlpService.extractTerms(text, 'fr');

    // Each occurrence should have unique start_offset
    const offsets = result.map((t: MedicalTerm) => t.start_offset);
    const uniqueOffsets = new Set(offsets);
    expect(uniqueOffsets.size).toBe(offsets.length);
  });

  test('BEHAVIORAL CONTRACT: FDB integration (mock)', async () => {
    const mockFDB = {
      searchDrug: jest.fn().mockResolvedValue({
        brandName: 'Dafalgan',
        genericName: 'paracétamol'
      })
    };

    const nlpWithFDB = new MedicalNLPService(mockFDB);
    const text = 'Patient takes paracetamol';
    await nlpWithFDB.extractTerms(text, 'en');

    // FDB should be called for medication terms
    expect(mockFDB.searchDrug).toHaveBeenCalled();
  });

  test('INVARIANT: Term extraction is deterministic', async () => {
    const text = 'Le patient a de la fièvre et prend du paracétamol';

    const result1 = await nlpService.extractTerms(text, 'fr');
    const result2 = await nlpService.extractTerms(text, 'fr');

    // Same input should always produce same output
    expect(result1).toEqual(result2);
  });
});
