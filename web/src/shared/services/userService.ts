/**
 * User Service
 * Handles API calls to user-service (port 4004)
 * Manages master account operations: users, roles, permissions, audit logs, etc.
 */

import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from './authService';

/**
 * User Service API Base URL
 */
const API_BASE = 'http://localhost:4004';

/**
 * Create axios instance with auth header
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
  });

  // Add auth interceptor
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
 * User types
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Role type
 */
export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  userId?: string;
}

/**
 * Location type
 */
export interface Location {
  id: string;
  name: string;
  address: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

/**
 * Session type
 */
export interface Session {
  id: string;
  userId: string;
  userEmail: string;
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Account settings type
 */
export interface AccountSettings {
  pharmacyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  [key: string]: string | undefined;
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * User Service
 */
export const userService = {
  /**
   * Get list of all users for master account
   */
  async getUsers(): Promise<User[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<User[]>>('/account/users');

      if (response.data.success) {
        // Handle different response formats
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray((response.data as any).users)) {
          return (response.data as any).users;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  }): Promise<{ userId: string }> {
    try {
      const client = createAxiosInstance();
      const response = await client.post<ApiResponse<{ userId: string }>>(
        '/account/users/create',
        userData
      );

      if (response.data.success) {
        return response.data.data || response.data as any;
      }

      throw new Error(response.data.error || 'Failed to create user');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user permissions
   */
  async updatePermissions(
    userId: string,
    permissions: string[]
  ): Promise<{ success: boolean }> {
    try {
      const client = createAxiosInstance();
      const response = await client.put<ApiResponse<{ success: boolean }>>(
        `/account/users/${userId}/permissions`,
        { permissions }
      );

      if (response.data.success) {
        return { success: true };
      }

      throw new Error(response.data.error || 'Failed to update permissions');
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },

  /**
   * Get available roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Role[]>>('/account/roles');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray((response.data as any).roles)) {
          return (response.data as any).roles;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch roles');
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  /**
   * Get audit log with optional filtering
   */
  async getAuditLog(filters?: {
    user?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    try {
      const client = createAxiosInstance();
      const params = new URLSearchParams();

      if (filters?.user) params.append('user', filters.user);
      if (filters?.action) params.append('action', filters.action);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await client.get<ApiResponse<AuditLog[]>>(
        `/account/audit-log${queryString}`
      );

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray((response.data as any).logs)) {
          return (response.data as any).logs;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch audit log');
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  },

  /**
   * Get active sessions
   */
  async getSessions(): Promise<Session[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Session[]>>('/account/sessions');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray((response.data as any).sessions)) {
          return (response.data as any).sessions;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch sessions');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  /**
   * Get pharmacy locations
   */
  async getLocations(): Promise<Location[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Location[]>>('/account/locations');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray((response.data as any).locations)) {
          return (response.data as any).locations;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch locations');
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  /**
   * Update account settings
   */
  async updateSettings(settings: AccountSettings): Promise<{ success: boolean }> {
    try {
      const client = createAxiosInstance();
      const response = await client.put<ApiResponse<{ success: boolean }>>(
        '/account/settings',
        settings
      );

      if (response.data.success) {
        return { success: true };
      }

      throw new Error(response.data.error || 'Failed to update settings');
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Setup MFA
   */
  async setupMFA(): Promise<{ qrCodeUrl: string; secret: string }> {
    try {
      const client = createAxiosInstance();
      const response = await client.post<
        ApiResponse<{ qrCodeUrl: string; secret: string }>
      >('/account/mfa/setup');

      if (response.data.success) {
        return response.data.data || (response.data as any);
      }

      throw new Error(response.data.error || 'Failed to setup MFA');
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw error;
    }
  },
};

export default userService;
