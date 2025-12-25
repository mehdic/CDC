/**
 * Admin App Module Exports
 */

// Pages
export { AdminDashboard } from './pages/AdminDashboard';

// Components
export { SystemHealthCard } from './components/SystemHealthCard';
export { UserManagement } from './components/UserManagement';
export { AnalyticsWidget } from './components/AnalyticsWidget';
export { ConfigManagement } from './components/ConfigManagement';
export { AuditLogViewer } from './components/AuditLogViewer';

// Hooks
export {
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
  ADMIN_QUERY_KEYS,
} from './hooks/useAdmin';

// Services
export { adminService } from './services/adminService';

// Types
export type {
  UserType,
  UserStatus,
  PlatformUser,
  CreateUserPayload,
  UpdateUserPayload,
  HealthStatus,
  ServiceHealth,
  SystemMonitoring,
  AdminAnalytics,
  ConfigCategory,
  ConfigItem,
  SystemConfig,
  AuditAction,
  AuditLogEntry,
  AuditLogFilters,
  PaginatedResponse,
  AdminDashboardSummary,
} from './types/admin.types';

export {
  ADMIN_PERMISSIONS,
  USER_TYPE_LABELS,
  USER_STATUS_LABELS,
} from './types/admin.types';
