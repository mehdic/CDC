/**
 * Admin Dashboard Types
 * Type definitions for admin features
 */

/**
 * User types in the MetaPharm Connect platform
 */
export type UserType = 'pharmacist' | 'doctor' | 'nurse' | 'delivery_person' | 'patient' | 'admin';

/**
 * User status options
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * Platform user entity
 */
export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  pharmacyId?: string;
  mfaEnabled: boolean;
}

/**
 * User creation payload
 */
export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  permissions: string[];
  pharmacyId?: string;
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  permissions?: string[];
  pharmacyId?: string;
}

/**
 * System health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Service health check result
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  lastCheck: string;
  version?: string;
  error?: string;
}

/**
 * System monitoring data
 */
export interface SystemMonitoring {
  overall: HealthStatus;
  services: ServiceHealth[];
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  timestamp: string;
}

/**
 * Admin analytics data
 */
export interface AdminAnalytics {
  users: {
    total: number;
    byType: Record<UserType, number>;
    newThisMonth: number;
    activeToday: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    revenue: number;
  };
  prescriptions: {
    total: number;
    processed: number;
    pending: number;
  };
  consultations: {
    total: number;
    completed: number;
    scheduled: number;
  };
  deliveries: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
}

/**
 * System configuration category
 */
export type ConfigCategory = 'general' | 'security' | 'notifications' | 'integrations' | 'features';

/**
 * System configuration item
 */
export interface ConfigItem {
  key: string;
  value: string | number | boolean;
  category: ConfigCategory;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  editable: boolean;
}

/**
 * System configuration
 */
export interface SystemConfig {
  items: ConfigItem[];
  lastModified: string;
  modifiedBy: string;
}

/**
 * Audit log action types
 */
export type AuditAction =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_login'
  | 'user_logout'
  | 'permission_changed'
  | 'config_changed'
  | 'prescription_processed'
  | 'order_created'
  | 'order_updated'
  | 'system_event';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actor: string;
  actorId: string;
  target?: string;
  targetId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
  action?: AuditAction;
  actor?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Admin dashboard summary
 */
export interface AdminDashboardSummary {
  analytics: AdminAnalytics;
  systemHealth: SystemMonitoring;
  recentActivity: AuditLogEntry[];
}

/**
 * Permission definitions for admin features
 */
export const ADMIN_PERMISSIONS = {
  USER_READ: 'admin:user:read',
  USER_CREATE: 'admin:user:create',
  USER_UPDATE: 'admin:user:update',
  USER_DELETE: 'admin:user:delete',
  CONFIG_READ: 'admin:config:read',
  CONFIG_UPDATE: 'admin:config:update',
  AUDIT_READ: 'admin:audit:read',
  ANALYTICS_READ: 'admin:analytics:read',
  SYSTEM_READ: 'admin:system:read',
} as const;

/**
 * User type display labels
 */
export const USER_TYPE_LABELS: Record<UserType, string> = {
  pharmacist: 'Pharmacien',
  doctor: 'Medecin',
  nurse: 'Infirmier(e)',
  delivery_person: 'Livreur',
  patient: 'Patient',
  admin: 'Administrateur',
};

/**
 * User status display labels
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
  pending: 'En attente',
};
