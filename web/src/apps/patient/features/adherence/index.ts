/**
 * Patient Adherence Tracking Feature Exports
 * T8-043: Patient Adherence Tracking
 */

// Components
export { AdherenceDashboard } from './components/AdherenceDashboard';
export { MedicationReminders } from './components/MedicationReminders';
export { AdherenceHistory } from './components/AdherenceHistory';

// Hooks
export { useAdherence } from './hooks/useAdherence';

// Services
export { default as adherenceApi } from './services/adherenceApi';
export * from './services/adherenceApi';

// Types
export type {
  AdherenceStatus,
  ReminderFrequency,
  MedicationAdherence,
  DailyAdherenceEntry,
  MedicationReminder,
  AdherenceStats,
  AdherenceDashboardData,
  LogAdherenceRequest,
  ReminderSettingsRequest,
  ApiResponse,
} from './types/adherence.types';
