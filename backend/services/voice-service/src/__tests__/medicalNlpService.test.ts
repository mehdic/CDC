/**
 * Medical NLP Service Tests
 * Tests for medical term extraction and highlighting
 */

import { MedicalNlpService } from '../services/medicalNlpService';

describe('MedicalNlpService', () => {
  let service: MedicalNlpService;

  beforeEach(() => {
    service = new MedicalNlpService();
  });

  describe('analyzeMedicalText', () => {
    it('should extract drug names from French text', async () => {
      const text = 'Le patient prend du paracetamol 500mg trois fois par jour.';
      const result = await service.analyzeMedicalText(text);

      expect(result.summary.drugCount).toBeGreaterThan(0);
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'drug',
            text: expect.stringContaining('paracetamol'),
          }),
        ]),
      );
    });

    it('should extract dosages', async () => {
      const text = 'Prescrit ibuprofen 400mg toutes les six heures.';
      const result = await service.analyzeMedicalText(text);

      expect(result.summary.dosageCount).toBeGreaterThan(0);
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'dosage',
            text: expect.stringContaining('400mg'),
          }),
        ]),
      );
    });

    it('should extract symptoms', async () => {
      const text = 'Le patient se plaint de douleur et de fièvre.';
      const result = await service.analyzeMedicalText(text);

      expect(result.summary.symptomCount).toBeGreaterThan(0);
      expect(result.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'symptom',
            text: expect.stringMatching(/douleur|fièvre/),
          }),
        ]),
      );
    });

    it('should handle German medical terms', async () => {
      const text = 'Der Patient hat Schmerzen und nimmt Ibuprofen 400mg.';
      const result = await service.analyzeMedicalText(text);

      expect(result.summary.drugCount).toBeGreaterThan(0);
      expect(result.summary.symptomCount).toBeGreaterThan(0);
    });

    it('should generate highlighted text', async () => {
      const text = 'Paracetamol 500mg pour la fièvre.';
      const result = await service.analyzeMedicalText(text);

      expect(result.highlightedText).toContain('<span');
      expect(result.highlightedText).toContain('medical-highlight');
    });

    it('should handle empty text', async () => {
      const result = await service.analyzeMedicalText('');

      expect(result.entities).toHaveLength(0);
      expect(result.summary.drugCount).toBe(0);
    });

    it('should assign confidence scores', async () => {
      const text = 'Prescrit amoxicillin 500mg.';
      const result = await service.analyzeMedicalText(text);

      result.entities.forEach((entity) => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('linkToDrugDatabase', () => {
    it('should link drugs to database IDs', async () => {
      const entities = [
        {
          type: 'drug' as const,
          text: 'paracetamol',
          start: 0,
          end: 11,
          confidence: 0.9,
        },
      ];

      const linked = await service.linkToDrugDatabase(entities);

      expect(linked[0].metadata?.drugId).toBeDefined();
      expect(linked[0].metadata?.drugId).toMatch(/^DRUG-/);
    });
  });
});
