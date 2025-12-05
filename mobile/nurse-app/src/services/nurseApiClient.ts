/**
 * Nurse API Client
 * Handles all API requests to the nurse-service backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAuthToken, setAuthToken, clearAuthTokens } from '../utils/secureStorage';
import {
  Nurse,
  Patient,
  Medication,
  MedicationOrder,
  MedicationAdministration,
  PatientRecord,
  AdverseReaction,
  Message,
  HandoverNote,
  DeliveryTracking,
} from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4005';

class NurseApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await clearAuthTokens();
          // Trigger re-login
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(hinId: string, password: string) {
    const response = await this.client.post('/auth/nurse/login', { hinId, password });
    if (response.data.token) {
      await setAuthToken(response.data.token);
    }
    return response.data;
  }

  async verifyMfa(code: string) {
    const response = await this.client.post('/auth/nurse/mfa/verify', { code });
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    await clearAuthTokens();
  }

  async getNurseProfile(): Promise<Nurse> {
    const response = await this.client.get('/nurses/profile');
    return response.data;
  }

  async updateNurseProfile(data: Partial<Nurse>): Promise<Nurse> {
    const response = await this.client.put('/nurses/profile', data);
    return response.data;
  }

  // Patient endpoints
  async searchPatients(query: string): Promise<Patient[]> {
    const response = await this.client.get('/patients/search', { params: { q: query } });
    return response.data;
  }

  async getPatientById(patientId: string): Promise<Patient> {
    const response = await this.client.get(`/patients/${patientId}`);
    return response.data;
  }

  async getAssignedPatients(): Promise<Patient[]> {
    const response = await this.client.get('/nurses/assigned-patients');
    return response.data;
  }

  // Medication endpoints
  async getPatientMedications(patientId: string): Promise<Medication[]> {
    const response = await this.client.get(`/patients/${patientId}/medications`);
    return response.data;
  }

  async recordAdministration(data: Omit<MedicationAdministration, 'id'>): Promise<MedicationAdministration> {
    const response = await this.client.post('/medications/administrations', data);
    return response.data;
  }

  async getMedicationSchedule(patientId: string, date: string): Promise<Medication[]> {
    const response = await this.client.get(`/patients/${patientId}/medications/schedule`, {
      params: { date },
    });
    return response.data;
  }

  async verifyMedicationBarcode(barcode: string, patientId: string) {
    const response = await this.client.post('/medications/verify-barcode', {
      barcode,
      patientId,
    });
    return response.data;
  }

  // Medication order endpoints
  async createMedicationOrder(order: Omit<MedicationOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationOrder> {
    const response = await this.client.post('/medication-orders', order);
    return response.data;
  }

  async getMedicationOrders(): Promise<MedicationOrder[]> {
    const response = await this.client.get('/medication-orders');
    return response.data;
  }

  async getOrderById(orderId: string): Promise<MedicationOrder> {
    const response = await this.client.get(`/medication-orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.post(`/medication-orders/${orderId}/cancel`);
  }

  // Delivery tracking endpoints
  async getDeliveryTracking(orderId: string): Promise<DeliveryTracking> {
    const response = await this.client.get(`/deliveries/${orderId}/tracking`);
    return response.data;
  }

  async getActiveDeliveries(): Promise<DeliveryTracking[]> {
    const response = await this.client.get('/deliveries/active');
    return response.data;
  }

  // Patient records endpoints
  async getPatientRecords(patientId: string): Promise<PatientRecord[]> {
    const response = await this.client.get(`/patients/${patientId}/records`);
    return response.data;
  }

  async requestRecordAccess(patientId: string, recordId: string): Promise<void> {
    await this.client.post(`/patients/${patientId}/records/${recordId}/request-access`);
  }

  // Adverse reaction endpoints
  async reportAdverseReaction(reaction: Omit<AdverseReaction, 'id' | 'reportedAt'>): Promise<AdverseReaction> {
    const response = await this.client.post('/adverse-reactions', reaction);
    return response.data;
  }

  async getAdverseReactions(patientId: string): Promise<AdverseReaction[]> {
    const response = await this.client.get(`/patients/${patientId}/adverse-reactions`);
    return response.data;
  }

  // Messaging endpoints
  async getMessages(): Promise<Message[]> {
    const response = await this.client.get('/messages');
    return response.data;
  }

  async sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
    const response = await this.client.post('/messages', message);
    return response.data;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.client.put(`/messages/${messageId}/read`);
  }

  async getConversation(recipientId: string): Promise<Message[]> {
    const response = await this.client.get(`/messages/conversation/${recipientId}`);
    return response.data;
  }

  // Handover notes endpoints
  async createHandoverNote(note: Omit<HandoverNote, 'id'>): Promise<HandoverNote> {
    const response = await this.client.post('/handover-notes', note);
    return response.data;
  }

  async getHandoverNotes(date?: string): Promise<HandoverNote[]> {
    const response = await this.client.get('/handover-notes', { params: { date } });
    return response.data;
  }

  async acknowledgeHandover(noteId: string): Promise<void> {
    await this.client.put(`/handover-notes/${noteId}/acknowledge`);
  }

  async getHandoverForPatient(patientId: string): Promise<HandoverNote[]> {
    const response = await this.client.get(`/handover-notes/patient/${patientId}`);
    return response.data;
  }
}

export const nurseApiClient = new NurseApiClient();
export default nurseApiClient;
