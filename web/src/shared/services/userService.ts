/**
 * User Service
 * Handles API calls to user-service (port 4004)
 */

import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from './authService';

const API_BASE = 'http://localhost:4004';

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
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

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  userId?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

export interface Session {
  id: string;
  userId: string;
  userEmail: string;
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: string | boolean | T | undefined;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<User[]> & { users?: User[] }>('/account/users');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.users)) {
          return response.data.users;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  }): Promise<{ userId: string }> {
    try {
      const client = createAxiosInstance();
      const response = await client.post<ApiResponse<{ userId: string }> & { userId?: string }>(
        '/account/users/create',
        userData
      );

      if (response.data.success) {
        return response.data.data || { userId: response.data.userId || '' };
      }

      throw new Error(response.data.error || 'Failed to create user');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updatePermissions(userId: string, permissions: string[]): Promise<{ success: boolean }> {
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

  async getRoles(): Promise<Role[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Role[]> & { roles?: Role[] }>('/account/roles');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.roles)) {
          return response.data.roles;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch roles');
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

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

      const queryString = params.toString() ? `?` + params.toString() : '';
      const response = await client.get<ApiResponse<AuditLog[]> & { logs?: AuditLog[] }>(
        `/account/audit-log` + queryString
      );

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.logs)) {
          return response.data.logs;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch audit log');
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  },

  async getSessions(): Promise<Session[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Session[]> & { sessions?: Session[] }>('/account/sessions');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.sessions)) {
          return response.data.sessions;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch sessions');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  async getLocations(): Promise<Location[]> {
    try {
      const client = createAxiosInstance();
      const response = await client.get<ApiResponse<Location[]> & { locations?: Location[] }>('/account/locations');

      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.locations)) {
          return response.data.locations;
        }
        return [];
      }

      throw new Error(response.data.error || 'Failed to fetch locations');
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

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

  async setupMFA(): Promise<{ qrCodeUrl: string; secret: string }> {
    try {
      const client = createAxiosInstance();
      const response = await client.post<
        ApiResponse<{ qrCodeUrl: string; secret: string }> & { qrCodeUrl?: string; secret?: string }
      >('/account/mfa/setup');

      if (response.data.success) {
        return response.data.data || {
          qrCodeUrl: response.data.qrCodeUrl || '',
          secret: response.data.secret || ''
        };
      }

      throw new Error(response.data.error || 'Failed to setup MFA');
    } catch (error) {
      console.error('Error setting up MFA:', error);
      throw error;
    }
  },
};

export default userService;
