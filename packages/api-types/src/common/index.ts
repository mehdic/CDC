/**
 * Common API Type Definitions
 * Shared types used across all API modules
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export enum UserRole {
  PATIENT = 'patient',
  PHARMACIST = 'pharmacist',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  DELIVERY_PERSONNEL = 'delivery_personnel',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
