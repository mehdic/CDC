/**
 * TypeScript types for Vaccination Service
 * Supports: Slot configuration, booking management, capacity tracking
 */

export enum VaccineType {
  COVID19 = 'COVID19',
  INFLUENZA = 'INFLUENZA',
  HEPATITIS_A = 'HEPATITIS_A',
  HEPATITIS_B = 'HEPATITIS_B',
  HPV = 'HPV',
  MEASLES_MUMPS_RUBELLA = 'MEASLES_MUMPS_RUBELLA',
  PNEUMOCOCCAL = 'PNEUMOCOCCAL',
  TETANUS = 'TETANUS',
  VARICELLA = 'VARICELLA',
  ZOSTER = 'ZOSTER',
  MENINGOCOCCAL = 'MENINGOCOCCAL',
  OTHER = 'OTHER',
}

export enum VaccinationSlotStatus {
  AVAILABLE = 'available',
  FULLY_BOOKED = 'fully_booked',
  BLOCKED = 'blocked',
  PAST = 'past',
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface VaccinationSlotTemplateCreateRequest {
  pharmacy_id: string;
  vaccine_type: VaccineType;
  duration_minutes: number;
  capacity: number;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_active?: boolean;
}

export interface VaccinationSlotTemplateUpdateRequest {
  vaccine_type?: VaccineType;
  duration_minutes?: number;
  capacity?: number;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface VaccinationSlotCreateRequest {
  template_id: string;
  pharmacy_id: string;
  slot_date: Date;
}

export interface VaccinationBookingRequest {
  slot_id: string;
  patient_id: string;
  vaccine_type: VaccineType;
  notes?: string;
}

export interface VaccinationBookingCancellationRequest {
  cancellation_reason: string;
}

export interface VaccinationBookingRescheduleRequest {
  new_slot_id: string;
}

export interface SlotAvailabilityFilters {
  pharmacy_id: string;
  vaccine_type?: VaccineType;
  start_date: Date;
  end_date: Date;
  only_available?: boolean;
}

export interface BookingListFilters {
  pharmacy_id?: string;
  patient_id?: string;
  status?: BookingStatus;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SlotAvailabilityResponse {
  slot_id: string;
  slot_date: Date;
  start_time: Date;
  end_time: Date;
  vaccine_type: VaccineType;
  capacity: number;
  booked_count: number;
  available_spots: number;
  status: VaccinationSlotStatus;
}

export interface CalendarDayResponse {
  date: Date;
  slots: SlotAvailabilityResponse[];
  total_slots: number;
  total_bookings: number;
}

export interface PharmacyVaccinationStats {
  total_templates: number;
  total_slots_this_month: number;
  total_bookings_this_month: number;
  completion_rate: number; // percentage
  no_show_rate: number; // percentage
  vaccine_type_breakdown: {
    vaccine_type: VaccineType;
    count: number;
  }[];
}
