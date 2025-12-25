/**
 * Admin Hooks
 * React Query hooks for admin dashboard features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import type {
  PlatformUser,
  CreateUserPayload,
  UpdateUserPayload,
  UserType,
  AuditLogFilters,
  ConfigItem,
} from '../types/admin.types';

/**
 * Query keys for admin features
 */
export const ADMIN_QUERY_KEYS = {
  dashboard: ['admin', 'dashboard'] as const,
  users: ['admin', 'users'] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  systemHealth: ['admin', 'system', 'health'] as const,
  analytics: ['admin', 'analytics'] as const,
  config: ['admin', 'config'] as const,
  auditLogs: ['admin', 'audit-logs'] as const,
};

// ============================================================================
// Dashboard Summary Hook
// ============================================================================

/**
 * Hook to fetch admin dashboard summary
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.dashboard,
    queryFn: () => adminService.getDashboardSummary(),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

// ============================================================================
// User Management Hooks
// ============================================================================

/**
 * Hook to fetch all platform users
 */
export function useUsers(filters?: {
  userType?: UserType;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.users, filters],
    queryFn: () => adminService.getUsers(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single user
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.user(userId),
    queryFn: () => adminService.getUser(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserPayload) => adminService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserPayload }) =>
      adminService.updateUser(userId, userData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.user(variables.userId) });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
}

// ============================================================================
// System Monitoring Hooks
// ============================================================================

/**
 * Hook to fetch system health status
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.systemHealth,
    queryFn: () => adminService.getSystemHealth(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

// ============================================================================
// Analytics Hooks
// ============================================================================

/**
 * Hook to fetch admin analytics
 */
export function useAdminAnalytics(dateRange?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.analytics, dateRange],
    queryFn: () => adminService.getAnalytics(dateRange),
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Configuration Hooks
// ============================================================================

/**
 * Hook to fetch system configuration
 */
export function useSystemConfig() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.config,
    queryFn: () => adminService.getConfig(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook to update configuration
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: ConfigItem['value'] }) =>
      adminService.updateConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.config });
    },
  });
}

// ============================================================================
// Audit Log Hooks
// ============================================================================

/**
 * Hook to fetch audit logs with filtering and pagination
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.auditLogs, filters],
    queryFn: () => adminService.getAuditLogs(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to export audit logs
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (filters?: AuditLogFilters) => adminService.exportAuditLogs(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

export default {
  useAdminDashboard,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSystemHealth,
  useAdminAnalytics,
  useSystemConfig,
  useUpdateConfig,
  useAuditLogs,
  useExportAuditLogs,
};
