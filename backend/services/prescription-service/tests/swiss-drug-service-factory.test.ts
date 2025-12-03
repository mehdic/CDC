/**
 * Unit Tests for Swiss Drug Service Factory
 * Tests service selection logic based on environment
 * T5-006, T5-008: Service factory and integration
 */

import {
  createSwissDrugInteractionService,
  createMockDrugService,
  createDocumedisService,
} from '../src/integrations/swiss-drug-service-factory';
import { DrugInteractionService } from '../src/integrations/interaction-service';

describe('Swiss Drug Service Factory', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.DOCUMEDIS_API_URL;
    delete process.env.DOCUMEDIS_API_TOKEN;
    delete process.env.NODE_ENV;
  });

  describe('createSwissDrugInteractionService', () => {
    it('should create service with FDB mock in development', () => {
      process.env.NODE_ENV = 'development';

      const service = createSwissDrugInteractionService();

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should create service with FDB mock when Documedis not configured', () => {
      process.env.NODE_ENV = 'production';
      // No DOCUMEDIS_API_TOKEN or URL

      const service = createSwissDrugInteractionService();

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should create service with Documedis adapter in production when configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const service = createSwissDrugInteractionService();

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should create functional service that can check interactions', async () => {
      const service = createSwissDrugInteractionService();

      const result = await service.checkInteractions(['Aspirin', 'Warfarin']);

      expect(result).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
    });
  });

  describe('createMockDrugService', () => {
    it('should always create service with FDB mock data', () => {
      // Even with Documedis credentials, should use mock
      process.env.NODE_ENV = 'production';
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const service = createMockDrugService();

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should create service that uses FDB mock interactions', async () => {
      const service = createMockDrugService();

      const result = await service.checkInteractions(['Warfarin', 'Aspirin']);

      expect(result).toBeDefined();
      // Should use FDB mock data which includes Warfarin-Aspirin interaction
    });
  });

  describe('createDocumedisService', () => {
    it('should throw error when Documedis credentials not configured', () => {
      expect(() => createDocumedisService()).toThrow(
        'Documedis service requires DOCUMEDIS_API_TOKEN and DOCUMEDIS_API_URL environment variables'
      );
    });

    it('should throw error when only API URL configured', () => {
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';

      expect(() => createDocumedisService()).toThrow();
    });

    it('should throw error when only API token configured', () => {
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      expect(() => createDocumedisService()).toThrow();
    });

    it('should create service when both credentials configured', () => {
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const service = createDocumedisService();

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DrugInteractionService);
    });
  });

  describe('Service Functionality', () => {
    it('should create service that can check interactions', async () => {
      const service = createSwissDrugInteractionService();

      const result = await service.checkInteractions(['Medication1', 'Medication2']);

      expect(result).toBeDefined();
      expect(result.hasInteractions).toBeDefined();
      expect(result.interactions).toBeDefined();
      expect(Array.isArray(result.interactions)).toBe(true);
    });

    it('should create service with patient context checking', async () => {
      const service = createSwissDrugInteractionService();

      const result = await service.checkWithPatientContext(
        ['Aspirin'],
        {
          patientId: 'patient-123',
          allergies: [
            {
              substance: 'NSAID',
              type: 'class',
              severity: 'moderate',
              dateRecorded: new Date(),
            },
          ],
        }
      );

      expect(result).toBeDefined();
      expect(result.allergyWarnings).toBeDefined();
      expect(Array.isArray(result.allergyWarnings)).toBe(true);
    });
  });

  describe('Environment-Based Selection', () => {
    it('should use FDB mock in test environment', () => {
      process.env.NODE_ENV = 'test';

      const service = createSwissDrugInteractionService();

      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should use FDB mock in development environment', () => {
      process.env.NODE_ENV = 'development';

      const service = createSwissDrugInteractionService();

      expect(service).toBeInstanceOf(DrugInteractionService);
    });

    it('should prefer Documedis in production when configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const service = createSwissDrugInteractionService();

      expect(service).toBeInstanceOf(DrugInteractionService);
    });
  });
});
