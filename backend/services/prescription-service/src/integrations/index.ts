/**
 * Drug Interactions Module - Barrel Export
 * Centralized export for all drug interaction functionality
 */

// FDB Service
export {
  FDBService,
  DrugInteractionSeverity,
  DrugInteraction,
  DrugInteractionResult,
} from './fdb';

// Drug Database
export {
  DRUG_DATABASE,
  INTERACTION_DATABASE,
  DrugInfo,
  DrugInteractionData,
} from './drug-database';

// Cache Layer
export {
  CacheProvider,
  InMemoryCache,
  RedisCache,
  CacheFactory,
} from './cache';

// Interaction Service
export {
  DrugInteractionService,
  PatientAllergy,
  PatientContext,
  InteractionCheckResult,
  AllergyWarning,
  InteractionMatrix,
  InteractionMatrixCell,
} from './interaction-service';
