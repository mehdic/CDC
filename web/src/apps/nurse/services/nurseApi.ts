/**
 * Nurse API Service
 * Handles all API calls for nurse app functionality
 */

import type {
  Patient,
  MedicationOrder,
  DeliveryStatus,
  Notification,
  DashboardStats,
  OrderMedication,
} from '../types/nurse';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Get authentication headers
 */
const getAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

/**
 * Dashboard API
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/dashboard/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  return response.json();
};

/**
 * Patient API
 */
export const getPatients = async (filters?: {
  search?: string;
  ward?: string;
  sortBy?: string;
}): Promise<Patient[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.ward) params.append('ward', filters.ward);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);

  const response = await fetch(`${API_BASE_URL}/api/nurse/patients?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }

  return response.json();
};

export const getPatientById = async (patientId: string): Promise<Patient> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/patients/${patientId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patient details');
  }

  return response.json();
};

/**
 * Medication Order API
 */
export const createMedicationOrder = async (order: {
  patientId: string;
  medications: OrderMedication[];
  urgency: 'routine' | 'urgent' | 'stat';
  pharmacyId: string;
  notes?: string;
}): Promise<MedicationOrder> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create medication order');
  }

  return response.json();
};

export const getOrders = async (filters?: {
  status?: string;
  patientId?: string;
  urgency?: string;
}): Promise<MedicationOrder[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.patientId) params.append('patientId', filters.patientId);
  if (filters?.urgency) params.append('urgency', filters.urgency);

  const response = await fetch(`${API_BASE_URL}/api/nurse/orders?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
};

export const getOrderById = async (orderId: string): Promise<MedicationOrder> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order details');
  }

  return response.json();
};

/**
 * Delivery Tracking API
 */
export const getDeliveryStatus = async (orderId: string): Promise<DeliveryStatus> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/deliveries/${orderId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch delivery status');
  }

  return response.json();
};

/**
 * Notifications API
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/notifications`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * PDF Export API
 */
export const exportOrderToPDF = async (orderId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/orders/${orderId}/pdf`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export order to PDF');
  }

  return response.blob();
};

export const exportPatientSummaryToPDF = async (patientId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/api/nurse/patients/${patientId}/pdf`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export patient summary to PDF');
  }

  return response.blob();
};
