/**
 * Admin Service
 * API calls for admin dashboard features
 */

import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '@shared/services/authService';
import type {
  PlatformUser,
  CreateUserPayload,
  UpdateUserPayload,
  SystemMonitoring,
  AdminAnalytics,
  SystemConfig,
  ConfigItem,
  AuditLogEntry,
  AuditLogFilters,
  PaginatedResponse,
  AdminDashboardSummary,
  UserType,
} from '../types/admin.types';

const API_BASE = 'http://localhost:4000/api';

/**
 * Create axios instance with auth interceptor
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Admin service methods
 */
export const adminService = {
  // ============================================================================
  // Dashboard Summary
  // ============================================================================

  /**
   * Get dashboard summary with analytics, health, and recent activity
   */
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<AdminDashboardSummary>>('/admin/dashboard');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch dashboard summary');
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  // ============================================================================
  // User Management
  // ============================================================================

  /**
   * Get all platform users with optional filtering
   */
  async getUsers(filters?: {
    userType?: UserType;
    status?: string;
    search?: string;
  }): Promise<PlatformUser[]> {
    try {
      const client = createAxiosInstance();
      const params = new URLSearchParams();

      if (filters?.userType) params.append('userType', filters.userType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await client.get<ApiResponse<PlatformUser[]> & { users?: PlatformUser[] }>(
        `/admin/users${queryString}`
      );

      if (response.data.success) {
        return response.data.data || response.data.users || [];
      }

      throw new Error(response.data.error || 'Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<PlatformUser> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<PlatformUser>>(`/admin/users/${userId}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch user');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserPayload): Promise<{ userId: string }> {
    try {
      const client = createAxiosInstance();
      const response = await client.post<ApiResponse<{ userId: string }>>('/admin/users', userData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to create user');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update an existing user
   */
  async updateUser(userId: string, userData: UpdateUserPayload): Promise<{ success: boolean }> {
    try {
      const client = createAxiosInstance();
      const response = await client.put<ApiResponse<{ success: boolean }>>(
        `/admin/users/${userId}`,
        userData
      );

      if (response.data.success) {
        return { success: true };
      }

      throw new Error(response.data.error || 'Failed to update user');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    try {
      const client = createAxiosInstance();
      const response = await client.delete<ApiResponse<{ success: boolean }>>(
        `/admin/users/${userId}`
      );

      if (response.data.success) {
        return { success: true };
      }

      throw new Error(response.data.error || 'Failed to delete user');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // ============================================================================
  // System Monitoring
  // ============================================================================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemMonitoring> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<SystemMonitoring>>('/admin/system/health');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch system health');
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get admin analytics data
   */
  async getAnalytics(dateRange?: { start?: string; end?: string }): Promise<AdminAnalytics> {
    try {
      const client = createAxiosInstance();
      const params = new URLSearchParams();

      if (dateRange?.start) params.append('startDate', dateRange.start);
      if (dateRange?.end) params.append('endDate', dateRange.end);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await client.get<ApiResponse<AdminAnalytics>>(
        `/admin/analytics${queryString}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch analytics');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Get system configuration
   */
  async getConfig(): Promise<SystemConfig> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<SystemConfig>>('/admin/config');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch configuration');
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  },

  /**
   * Update a configuration item
   */
  async updateConfig(
    key: string,
    value: ConfigItem['value']
  ): Promise<{ success: boolean }> {
    try {
      const client = createAxiosInstance();
      const response = await client.put<ApiResponse<{ success: boolean }>>('/admin/config', {
        key,
        value,
      });

      if (response.data.success) {
        return { success: true };
      }

      throw new Error(response.data.error || 'Failed to update configuration');
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  },

  // ============================================================================
  // Audit Logs
  // ============================================================================

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLogEntry>> {
    try {
      const client = createAxiosInstance();
      const params = new URLSearchParams();

      if (filters?.action) params.append('action', filters.action);
      if (filters?.actor) params.append('actor', filters.actor);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await client.get<ApiResponse<PaginatedResponse<AuditLogEntry>>>(
        `/admin/audit-logs${queryString}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch audit logs');
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(filters?: AuditLogFilters): Promise<Blob> {
    try {
      const client = createAxiosInstance();
      const params = new URLSearchParams();

      if (filters?.action) params.append('action', filters.action);
      if (filters?.actor) params.append('actor', filters.actor);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await client.get(`/admin/audit-logs/export${queryString}`, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  },
};

export default adminService;
