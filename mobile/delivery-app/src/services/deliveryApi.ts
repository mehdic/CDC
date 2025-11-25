/**
 * Delivery API Client
 * Connects to backend delivery-service endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeliveryRequest,
  DeliveryRoute,
  ProofOfDelivery,
  DeliveryStats,
  DeliveryPersonnelProfile,
  Coordinates,
  ApiResponse,
  PaginatedResponse,
  DeliveryStatus,
} from '../types/delivery';

/**
 * API Configuration
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
const TOKEN_KEY = '@delivery_token';

/**
 * Delivery API Client Class
 */
class DeliveryApiClient {
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
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; personnel: DeliveryPersonnelProfile }>> {
    const response = await this.client.post('/auth/delivery/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await this.client.post('/auth/delivery/logout');
  }

  async getProfile(): Promise<ApiResponse<DeliveryPersonnelProfile>> {
    const response = await this.client.get('/delivery/profile');
    return response.data;
  }

  async updateProfile(data: Partial<DeliveryPersonnelProfile>): Promise<ApiResponse<DeliveryPersonnelProfile>> {
    const response = await this.client.put('/delivery/profile', data);
    return response.data;
  }

  /**
   * Delivery Requests
   */
  async getAvailableRequests(filters?: {
    radius?: number;
    maxDistance?: number;
  }): Promise<ApiResponse<PaginatedResponse<DeliveryRequest>>> {
    const response = await this.client.get('/delivery/requests/available', { params: filters });
    return response.data;
  }

  async getMyDeliveries(status?: DeliveryStatus): Promise<ApiResponse<DeliveryRequest[]>> {
    const response = await this.client.get('/delivery/requests/mine', { params: { status } });
    return response.data;
  }

  async getDeliveryById(id: string): Promise<ApiResponse<DeliveryRequest>> {
    const response = await this.client.get(`/delivery/requests/${id}`);
    return response.data;
  }

  async acceptDelivery(id: string): Promise<ApiResponse<DeliveryRequest>> {
    const response = await this.client.post(`/delivery/requests/${id}/accept`);
    return response.data;
  }

  async rejectDelivery(id: string, reason?: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/delivery/requests/${id}/reject`, { reason });
    return response.data;
  }

  /**
   * Delivery Status Updates
   */
  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    location?: Coordinates,
    notes?: string
  ): Promise<ApiResponse<DeliveryRequest>> {
    const response = await this.client.put(`/delivery/requests/${id}/status`, {
      status,
      location,
      notes,
    });
    return response.data;
  }

  async reportDeliveryFailure(
    id: string,
    reason: string,
    notes?: string
  ): Promise<ApiResponse<DeliveryRequest>> {
    const response = await this.client.post(`/delivery/requests/${id}/failure`, {
      reason,
      notes,
    });
    return response.data;
  }

  /**
   * Route Optimization
   */
  async getOptimizedRoute(deliveryIds: string[]): Promise<ApiResponse<DeliveryRoute>> {
    const response = await this.client.post('/delivery/route/optimize', { deliveryIds });
    return response.data;
  }

  async updateRouteProgress(routeId: string, waypointIndex: number): Promise<ApiResponse<void>> {
    const response = await this.client.put(`/delivery/route/${routeId}/progress`, {
      waypointIndex,
    });
    return response.data;
  }

  /**
   * GPS Tracking
   */
  async updateLocation(location: Coordinates): Promise<ApiResponse<void>> {
    const response = await this.client.post('/delivery/location', location);
    return response.data;
  }

  async getLocationHistory(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Coordinates[]>> {
    const response = await this.client.get('/delivery/location/history', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Package Verification
   */
  async verifyPackageQR(qrCode: string): Promise<ApiResponse<{
    valid: boolean;
    deliveryId: string;
    packageDetails: any;
  }>> {
    const response = await this.client.post('/delivery/verify/qr', { qrCode });
    return response.data;
  }

  /**
   * Proof of Delivery
   */
  async submitProofOfDelivery(
    deliveryId: string,
    proof: ProofOfDelivery
  ): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('deliveryId', deliveryId);
    formData.append('timestamp', proof.timestamp);
    formData.append('location', JSON.stringify(proof.location));

    if (proof.signatureImage) {
      formData.append('signature', {
        uri: proof.signatureImage,
        type: 'image/png',
        name: 'signature.png',
      } as any);
    }

    if (proof.photoImage) {
      formData.append('photo', {
        uri: proof.photoImage,
        type: 'image/jpeg',
        name: 'delivery.jpg',
      } as any);
    }

    if (proof.idVerificationImage) {
      formData.append('idVerification', {
        uri: proof.idVerificationImage,
        type: 'image/jpeg',
        name: 'id.jpg',
      } as any);
    }

    if (proof.recipientName) {
      formData.append('recipientName', proof.recipientName);
    }

    if (proof.notes) {
      formData.append('notes', proof.notes);
    }

    const response = await this.client.post(
      `/delivery/requests/${deliveryId}/proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Statistics and Earnings
   */
  async getStats(period: 'today' | 'week' | 'month'): Promise<ApiResponse<DeliveryStats>> {
    const response = await this.client.get('/delivery/stats', { params: { period } });
    return response.data;
  }

  async getEarningsBreakdown(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any>> {
    const response = await this.client.get('/delivery/earnings', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Shift Management
   */
  async startShift(): Promise<ApiResponse<void>> {
    const response = await this.client.post('/delivery/shift/start');
    return response.data;
  }

  async endShift(): Promise<ApiResponse<{ summary: any }>> {
    const response = await this.client.post('/delivery/shift/end');
    return response.data;
  }
}

/**
 * Export singleton instance
 */
export const deliveryApi = new DeliveryApiClient();
export default deliveryApi;
