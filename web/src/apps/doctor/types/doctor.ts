/**
 * Doctor App Types
 * Type definitions for doctor-specific models and API responses
 */

// ============================================================================
// Patient Types
// ============================================================================

export interface DoctorPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  medicalHistory: string[];
  allergies: string[];
  lastVisit?: string;
  activeConditions: string[];
  chronicPatient: boolean;
}

export interface PatientListResponse {
  success: boolean;
  data: {
    patients: DoctorPatient[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface PatientListFilters {
  search?: string;
  chronicOnly?: boolean;
  sortBy?: 'name' | 'lastVisit' | 'recent';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  validFrom: string;
  validUntil: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'rejected';
  renewalCount: number;
  maxRenewals: number;
}

export interface Treatment {
  id: string;
  patientId: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'inactive';
  medications: Prescription[];
  notes?: string;
}

export interface TreatmentHistoryItem {
  id: string;
  patientId: string;
  treatmentName: string;
  medications: string[];
  startDate: string;
  endDate: string;
  outcome: string;
}

export interface TreatmentViewResponse {
  success: boolean;
  data: {
    currentTreatments: Treatment[];
    treatmentHistory: TreatmentHistoryItem[];
  };
}

// ============================================================================
// Messaging Types
// ============================================================================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  isRead: boolean;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
}

export interface MessageThread {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface MessageThreadListResponse {
  success: boolean;
  data: {
    threads: MessageThread[];
    total: number;
  };
}

// ============================================================================
// Observance/Compliance Types
// ============================================================================

export interface ObservanceStats {
  patientId: string;
  patientName: string;
  overallCompliance: number; // percentage
  medicationAdherence: number; // percentage
  appointmentAttendance: number; // percentage
  labTestCompletion: number; // percentage
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface ComplianceChart {
  date: string;
  compliance: number;
}

export interface ObservanceStatsResponse {
  success: boolean;
  data: {
    overallStats: ObservanceStats[];
    chartData: ComplianceChart[];
    topCompliantPatients: DoctorPatient[];
    needsAttentionPatients: DoctorPatient[];
  };
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DoctorDashboardAnalytics {
  totalPatients: number;
  activePatients: number;
  chronicPatients: number;
  consultationsThisMonth: number;
  pendingPrescriptions: number;
  prescriptionsThisMonth: number;
  averagePatientCompliance: number;
  appointmentsThisWeek: number;
}

export interface DoctorDashboardResponse {
  success: boolean;
  data: DoctorDashboardAnalytics;
}

export interface RecentConsultation {
  id: string;
  patientId: string;
  patientName: string;
  type: 'in-person' | 'teleconsultation' | 'follow-up';
  date: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  notes?: string;
}

export interface ConsultationResponse {
  success: boolean;
  data: RecentConsultation[];
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}
