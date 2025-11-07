/**
 * Treatment Plan Generation Utility
 * Generates medication schedule from approved prescription
 * T091 - User Story 1: Prescription Processing & Validation (FR-017, FR-077)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-017, FR-077)
 */

import { DataSource } from 'typeorm';
import { Prescription } from '../../../../shared/models/Prescription';
import { TreatmentPlan, TreatmentPlanStatus } from '../../../../shared/models/TreatmentPlan';

interface MedicationScheduleEntry {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  times_per_day: number;
  time_of_day: string[];  // e.g., ["08:00", "20:00"] for twice daily
  days_of_treatment: number;
  doses_taken: Date[];    // Timestamps of doses taken (empty initially)
  notes?: string;
}

/**
 * Generate treatment plan from approved prescription
 * @param prescription Approved prescription with items
 * @param dataSource TypeORM DataSource
 * @returns Created TreatmentPlan entity
 */
export async function generateTreatmentPlan(
  prescription: Prescription,
  dataSource: DataSource
): Promise<TreatmentPlan> {
  // Validate prescription is approved
  if (!prescription.isApproved()) {
    throw new Error('Treatment plan can only be generated for approved prescriptions');
  }

  // Validate prescription has items
  if (!prescription.items || prescription.items.length === 0) {
    throw new Error('Cannot generate treatment plan for prescription without items');
  }

  // Build medication schedule from prescription items
  const medicationSchedule: MedicationScheduleEntry[] = prescription.items.map((item) => {
    const scheduleEntry = parsePrescriptionItem(item);
    return scheduleEntry;
  });

  // Calculate treatment duration and total doses
  const { startDate, endDate, totalDoses } = calculateTreatmentDuration(medicationSchedule);

  // Calculate refill due date (7 days before end date)
  const refillDueDate = new Date(endDate);
  refillDueDate.setDate(refillDueDate.getDate() - 7);

  // Create treatment plan entity
  const treatmentPlanRepo = dataSource.getRepository(TreatmentPlan);
  const treatmentPlan = treatmentPlanRepo.create({
    prescription_id: prescription.id,
    patient_id: prescription.patient_id,
    medication_schedule: medicationSchedule,
    start_date: startDate,
    end_date: endDate,
    total_doses: totalDoses,
    doses_taken: 0,
    adherence_rate: 0,
    refill_due_date: refillDueDate,
    refill_reminder_sent: false,
    status: TreatmentPlanStatus.ACTIVE,
  });

  // Save treatment plan
  await treatmentPlanRepo.save(treatmentPlan);

  // Link treatment plan to prescription
  prescription.treatment_plan_id = treatmentPlan.id;
  const prescriptionRepo = dataSource.getRepository(Prescription);
  await prescriptionRepo.save(prescription);

  return treatmentPlan;
}

/**
 * Parse prescription item into medication schedule entry
 * @param item PrescriptionItem
 * @returns MedicationScheduleEntry
 */
function parsePrescriptionItem(item: any): MedicationScheduleEntry {
  const frequency = item.frequency.toLowerCase();
  const duration = item.duration ? item.duration.toLowerCase() : '';

  // Parse frequency to determine times per day
  const timesPerDay = parseFrequency(frequency);

  // Parse duration to get number of days
  const daysOfTreatment = parseDuration(duration);

  // Generate time of day schedule
  const timeOfDay = generateTimeOfDay(timesPerDay);

  return {
    medication_name: item.medication_name,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    quantity: item.quantity,
    times_per_day: timesPerDay,
    time_of_day: timeOfDay,
    days_of_treatment: daysOfTreatment,
    doses_taken: [],
    notes: item.pharmacist_corrected ? 'Pharmacist corrected during review' : undefined,
  };
}

/**
 * Parse frequency string to determine times per day
 * @param frequency Frequency string (e.g., "twice daily", "every 8 hours")
 * @returns Number of times per day
 */
function parseFrequency(frequency: string): number {
  const freq = frequency.toLowerCase().trim();

  // Common patterns
  if (freq.includes('once') || freq.includes('1 time') || freq.includes('daily') && !freq.includes('twice')) {
    return 1;
  }
  if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
    return 2;
  }
  if (freq.includes('three times') || freq.includes('3 times') || freq.includes('tid')) {
    return 3;
  }
  if (freq.includes('four times') || freq.includes('4 times') || freq.includes('qid')) {
    return 4;
  }

  // Every X hours
  if (freq.includes('every')) {
    const match = freq.match(/every (\d+) hour/);
    if (match) {
      const hours = parseInt(match[1], 10);
      return Math.floor(24 / hours);
    }
  }

  // Default to once daily if unparseable
  console.warn(`[Treatment Plan] Could not parse frequency: "${frequency}". Defaulting to once daily.`);
  return 1;
}

/**
 * Parse duration string to determine number of days
 * @param duration Duration string (e.g., "7 days", "2 weeks")
 * @returns Number of days
 */
function parseDuration(duration: string): number {
  if (!duration) {
    return 30; // Default to 30 days if no duration specified
  }

  const dur = duration.toLowerCase().trim();

  // Days pattern
  const daysMatch = dur.match(/(\d+)\s*day/);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }

  // Weeks pattern
  const weeksMatch = dur.match(/(\d+)\s*week/);
  if (weeksMatch) {
    return parseInt(weeksMatch[1], 10) * 7;
  }

  // Months pattern
  const monthsMatch = dur.match(/(\d+)\s*month/);
  if (monthsMatch) {
    return parseInt(monthsMatch[1], 10) * 30;
  }

  // Chronic/ongoing
  if (dur.includes('chronic') || dur.includes('ongoing') || dur.includes('continuous')) {
    return 90; // 3 months for chronic medications
  }

  // Default to 30 days if unparseable
  console.warn(`[Treatment Plan] Could not parse duration: "${duration}". Defaulting to 30 days.`);
  return 30;
}

/**
 * Generate time of day schedule based on frequency
 * @param timesPerDay Number of times medication should be taken per day
 * @returns Array of times (HH:MM format)
 */
function generateTimeOfDay(timesPerDay: number): string[] {
  const schedules: Record<number, string[]> = {
    1: ['08:00'],                           // Once daily: morning
    2: ['08:00', '20:00'],                  // Twice daily: morning and evening
    3: ['08:00', '14:00', '20:00'],         // Three times daily: morning, afternoon, evening
    4: ['08:00', '12:00', '16:00', '20:00'], // Four times daily: every 4 hours during waking hours
  };

  return schedules[timesPerDay] || schedules[1]; // Default to once daily
}

/**
 * Calculate treatment duration and total doses
 * @param medicationSchedule Array of medication schedule entries
 * @returns Object with startDate, endDate, and totalDoses
 */
function calculateTreatmentDuration(
  medicationSchedule: MedicationScheduleEntry[]
): { startDate: Date; endDate: Date; totalDoses: number } {
  // Start date is today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Set to midnight

  // Find longest treatment duration
  const maxDays = Math.max(...medicationSchedule.map((entry) => entry.days_of_treatment));

  // End date is start date + max duration
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + maxDays);

  // Calculate total doses (sum of all medications across all days)
  const totalDoses = medicationSchedule.reduce((sum, entry) => {
    return sum + entry.times_per_day * entry.days_of_treatment;
  }, 0);

  return { startDate, endDate, totalDoses };
}

/**
 * Update treatment plan adherence when patient takes a dose
 * @param treatmentPlan TreatmentPlan entity
 * @param dataSource TypeORM DataSource
 */
export async function recordDoseTaken(
  treatmentPlan: TreatmentPlan,
  dataSource: DataSource
): Promise<void> {
  // Use TreatmentPlan entity helper method
  treatmentPlan.recordDoseTaken();

  // Save updated treatment plan
  const treatmentPlanRepo = dataSource.getRepository(TreatmentPlan);
  await treatmentPlanRepo.save(treatmentPlan);
}

/**
 * Check if refill reminder should be sent
 * @param treatmentPlan TreatmentPlan entity
 * @returns True if reminder should be sent
 */
export function shouldSendRefillReminder(treatmentPlan: TreatmentPlan): boolean {
  return treatmentPlan.shouldSendRefillReminder();
}

/**
 * Mark refill reminder as sent
 * @param treatmentPlan TreatmentPlan entity
 * @param dataSource TypeORM DataSource
 */
export async function markRefillReminderSent(
  treatmentPlan: TreatmentPlan,
  dataSource: DataSource
): Promise<void> {
  treatmentPlan.markRefillReminderSent();

  const treatmentPlanRepo = dataSource.getRepository(TreatmentPlan);
  await treatmentPlanRepo.save(treatmentPlan);
}
