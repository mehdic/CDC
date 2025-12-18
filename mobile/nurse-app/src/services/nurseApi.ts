/**
 * Nurse API Client
 * Connects to backend nurse-service endpoints
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosError } from 'axios';

import {
  NurseProfile,
  Patient,
  MedicationOrder,
  PharmacyPatientRecord,
  DeliveryTracking,
  AdministrationLog,
  ShiftHandoverNote,
  ApiResponse,
  PaginatedResponse,
} from '../types/nurse';

/**
 * API Configuration
 */
const API_BASE_URL = 'http://localhost:3005'; // In production, use react-native-config
const TOKEN_KEY = '@nurse_token';

/**
 * Nurse API Client Class
 */
class NurseApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - clear auth
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authentication
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; nurse: NurseProfile }>> {
    const response = await this.client.post('/auth/nurse/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await this.client.post('/auth/nurse/logout');
  }

  async getProfile(): Promise<ApiResponse<NurseProfile>> {
    const response = await this.client.get('/nurse/profile');
    return response.data;
  }

  async updateProfile(data: Partial<NurseProfile>): Promise<ApiResponse<NurseProfile>> {
    const response = await this.client.put('/nurse/profile', data);
    return response.data;
  }

  /**
   * Patient Management
   */
  async searchPatients(query: string): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    const response = await this.client.get('/nurse/patients/search', { params: { q: query } });
    return response.data;
  }

  async getPatientById(id: string): Promise<ApiResponse<Patient>> {
    const response = await this.client.get(`/nurse/patients/${id}`);
    return response.data;
  }

  async getPatientMedications(patientId: string): Promise<ApiResponse<MedicationOrder[]>> {
    const response = await this.client.get(`/nurse/patients/${patientId}/medications`);
    return response.data;
  }

  /**
   * Medication Orders
   */
  async createMedicationOrder(order: Omit<MedicationOrder, 'id' | 'orderedAt'>): Promise<ApiResponse<MedicationOrder>> {
    const response = await this.client.post('/nurse/medication-orders', order);
    return response.data;
  }

  async getMedicationOrders(filters?: {
    patientId?: string;
    status?: string;
  }): Promise<ApiResponse<MedicationOrder[]>> {
    const response = await this.client.get('/nurse/medication-orders', { params: filters });
    return response.data;
  }

  async updateMedicationOrder(id: string, updates: Partial<MedicationOrder>): Promise<ApiResponse<MedicationOrder>> {
    const response = await this.client.put(`/nurse/medication-orders/${id}`, updates);
    return response.data;
  }

  /**
   * Pharmacy Records
   */
  async getPharmacyRecords(patientId: string): Promise<ApiResponse<PharmacyPatientRecord[]>> {
    const response = await this.client.get(`/nurse/pharmacy-records/${patientId}`);
    return response.data;
  }

  /**
   * Delivery Tracking
   */
  async trackDelivery(orderId: string): Promise<ApiResponse<DeliveryTracking>> {
    const response = await this.client.get(`/nurse/delivery/track/${orderId}`);
    return response.data;
  }

  async getActiveDeliveries(): Promise<ApiResponse<DeliveryTracking[]>> {
    const response = await this.client.get('/nurse/delivery/active');
    return response.data;
  }

  /**
   * Administration Logs
   */
  async logMedicationAdministration(log: Omit<AdministrationLog, 'id'>): Promise<ApiResponse<AdministrationLog>> {
    const response = await this.client.post('/nurse/administration-log', log);
    return response.data;
  }

  async getAdministrationHistory(patientId: string, startDate?: string, endDate?: string): Promise<ApiResponse<AdministrationLog[]>> {
    const response = await this.client.get(`/nurse/administration-log/${patientId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Shift Handover
   */
  async createHandoverNote(note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>): Promise<ApiResponse<ShiftHandoverNote>> {
    const response = await this.client.post('/nurse/handover', note);
    return response.data;
  }

  async getHandoverNotes(date: string): Promise<ApiResponse<ShiftHandoverNote[]>> {
    const response = await this.client.get('/nurse/handover', { params: { date } });
    return response.data;
  }

  async getMyHandoverNotes(): Promise<ApiResponse<ShiftHandoverNote[]>> {
    const response = await this.client.get('/nurse/handover/mine');
    return response.data;
  }
}

/**
 * Export singleton instance
 */
export const nurseApi = new NurseApiClient();
export default nurseApi;
