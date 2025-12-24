/**
 * Adherence Tracking Types and Interfaces (Patient App)
 * T8-043: Patient Adherence Tracking
 */

/**
 * Medication adherence status
 */
export type AdherenceStatus = 'taken' | 'missed' | 'pending' | 'scheduled';

/**
 * Medication reminder frequency
 */
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

/**
 * Individual medication adherence record
 */
export interface MedicationAdherence {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  frequency: ReminderFrequency;
  timesPerDay: number;
  adherenceRate: number; // 0-100 percentage
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  lastTakenAt?: string;
  nextScheduledAt?: string;
}

/**
 * Daily adherence entry for specific medication
 */
export interface DailyAdherenceEntry {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string;
  status: AdherenceStatus;
  scheduledTime: string;
  actualTime?: string;
  notes?: string;
  reminderSent?: boolean;
  acknowledgedAt?: string;
}

/**
 * Medication reminder configuration
 */
export interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: ReminderFrequency;
  timesPerDay: number;
  reminderTimes: string[]; // HH:mm format
  notificationEnabled: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Adherence statistics and metrics
 */
export interface AdherenceStats {
  totalMedicationsActive: number;
  overallAdherenceRate: number; // 0-100 percentage
  medicationsWithHighAdherence: number; // >80%
  medicationsWithLowAdherence: number; // <50%
  totalScheduledDoses: number;
  totalTakenDoses: number;
  totalMissedDoses: number;
  consistencyScore: number; // 0-100
  trendDirection: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

/**
 * Adherence dashboard data
 */
export interface AdherenceDashboardData {
  patientId: string;
  stats: AdherenceStats;
  medications: MedicationAdherence[];
  upcomingReminders: MedicationReminder[];
  recentHistory: DailyAdherenceEntry[];
}

/**
 * Request body for logging adherence
 */
export interface LogAdherenceRequest {
  medicationId: string;
  date: string;
  status: AdherenceStatus;
  actualTime?: string;
  notes?: string;
}

/**
 * Request body for reminder notification settings
 */
export interface ReminderSettingsRequest {
  medicationId: string;
  notificationEnabled: boolean;
  reminderTimes?: string[];
  frequency?: ReminderFrequency;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
