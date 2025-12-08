/**
 * Patient Recycling Feature Exports
 * T5-052: Medication Return/Recycling Feature
 */

// Components
export { RecyclingRequestForm } from './components/RecyclingRequestForm';
export { RecyclingHistory } from './components/RecyclingHistory';

// Services
export { default as recyclingApi } from './services/recyclingApi';
export * from './services/recyclingApi';

// Types
export type { Medication, RecyclingRequest, RecyclingRequestFormData, RecyclingRequestStatus } from './types/recycling.types';
