/**
 * Swiss Drug Service Factory
 * Creates appropriate drug interaction service based on environment
 * T5-006, T5-008: Service selection logic for Swiss drug database
 *
 * Strategy:
 * - Production with Documedis credentials → DocumedisAdapter
 * - Development/Test → FDBService (mock data)
 * - Fallback on Documedis failure → FDBService (mock data)
 */

import { FDBService } from './fdb';
import { DocumedisAdapter } from './documedis-adapter';
import { DrugInteractionService } from './interaction-service';

/**
 * Create drug interaction service based on environment
 * Follows research recommendation for hybrid approach
 *
 * @returns Configured DrugInteractionService
 */
export function createSwissDrugInteractionService(): DrugInteractionService {
  const useDocumedis =
    process.env.DOCUMEDIS_API_TOKEN &&
    process.env.DOCUMEDIS_API_URL &&
    process.env.NODE_ENV === 'production';

  let fdbService: FDBService;

  if (useDocumedis) {
    console.info('[Swiss Drug Service Factory] Using Documedis adapter for Swiss drug data');
    fdbService = new DocumedisAdapter();
  } else {
    console.info('[Swiss Drug Service Factory] Using FDB mock data (Documedis not configured)');
    fdbService = new FDBService();
  }

  return new DrugInteractionService(fdbService);
}

/**
 * Create basic FDB service for testing
 * Always uses mock data regardless of environment
 *
 * @returns FDBService with mock data
 */
export function createMockDrugService(): DrugInteractionService {
  console.info('[Swiss Drug Service Factory] Creating mock drug service for testing');
  return new DrugInteractionService(new FDBService());
}

/**
 * Create Documedis adapter directly (for testing Documedis integration)
 * Requires DOCUMEDIS_API_TOKEN and DOCUMEDIS_API_URL to be set
 *
 * @returns DrugInteractionService with Documedis adapter
 */
export function createDocumedisService(): DrugInteractionService {
  if (!process.env.DOCUMEDIS_API_TOKEN || !process.env.DOCUMEDIS_API_URL) {
    throw new Error(
      'Documedis service requires DOCUMEDIS_API_TOKEN and DOCUMEDIS_API_URL environment variables'
    );
  }

  console.info('[Swiss Drug Service Factory] Creating Documedis service');
  return new DrugInteractionService(new DocumedisAdapter());
}
