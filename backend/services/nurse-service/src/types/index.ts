/**
 * Type definitions for Nurse Service
 */

import { OrderStatus, OrderUrgency } from '../models/NurseOrder';

export interface CreateOrderDTO {
  nurseId: string;
  patientId: string;
  medication: string;
  dosage: string;
  quantity: number;
  urgency?: OrderUrgency;
  instructions?: string;
  nurseNotes?: string;
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  pharmacyId?: string;
  deliveryId?: string;
  pharmacistNotes?: string;
  stockValidated?: boolean;
  prescriptionValidated?: boolean;
}

export interface OrderFilters {
  nurseId?: string;
  patientId?: string;
  pharmacyId?: string;
  status?: OrderStatus;
  urgency?: OrderUrgency;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
