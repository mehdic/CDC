/**
 * Pharmacist Recycling Feature Exports
 * T5-052: Medication Return/Recycling Feature
 */

// Components
export { RecyclingManagement } from './components/RecyclingManagement';

// Services
export { default as recyclingApi } from './services/recyclingApi';
export * from './services/recyclingApi';

// Types
export type { Medication, RecyclingRequest, RecyclingRequestStatus, RecyclingStats } from './types/recycling.types';
