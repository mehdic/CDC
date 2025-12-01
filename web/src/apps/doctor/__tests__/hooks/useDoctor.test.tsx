/**
 * useDoctor Hook Tests
 * Tests for React Query hooks
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  useDoctorPatients,
  usePatient,
  usePatientPrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
  useRenewPrescription,
  usePatientTreatments,
  useCreateTreatment,
  useUpdateTreatment,
  useDoctorMessageThreads,
  useDoctorMessageThread,
  useSendMessage,
  useDoctorObservanceStats,
  usePatientComplianceChart,
  useDoctorDashboard,
  useRecentConsultations,
} from '../../hooks/useDoctor';
import * as doctorApi from '../../services/doctorApi';

jest.mock('../../services/doctorApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDoctor Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useDoctorPatients', () => {
    it('should fetch doctor patients', async () => {
      const mockData = {
        success: true,
        data: {
          patients: [],
          total: 0,
          page: 1,
          pageSize: 9,
        },
      };

      (doctorApi.getDoctorPatients as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDoctorPatients(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should support filters', async () => {
      const mockData = {
        success: true,
        data: {
          patients: [],
          total: 0,
          page: 1,
          pageSize: 9,
        },
      };

      (doctorApi.getDoctorPatients as jest.Mock).mockResolvedValue(mockData);

      const filters = { search: 'Jean', page: 1 };
      const { result } = renderHook(() => useDoctorPatients(filters), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(doctorApi.getDoctorPatients).toHaveBeenCalledWith(filters);
    });
  });

  describe('usePatient', () => {
    it('should fetch single patient', async () => {
      const mockData = {
        success: true,
        data: {
          id: 'p1',
          firstName: 'Jean',
          lastName: 'Martin',
          email: 'jean@example.com',
          phone: '+41 79 123 45 67',
          dateOfBirth: '1970-05-15',
          medicalHistory: [],
          allergies: [],
          activeConditions: [],
          chronicPatient: false,
        },
      };

      (doctorApi.getPatient as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePatient('p1'), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should not fetch if patientId is empty', () => {
      const { result } = renderHook(() => usePatient(''), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('usePatientPrescriptions', () => {
    it('should fetch patient prescriptions', async () => {
      const mockData = {
        success: true,
        data: [],
      };

      (doctorApi.getPatientPrescriptions as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => usePatientPrescriptions('p1'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useCreatePrescription', () => {
    it('should create prescription', async () => {
      const mockData = {
        success: true,
        data: {
          id: 'm1',
          patientId: 'p1',
          medication: 'Aspirin',
          dosage: '100mg',
          frequency: 'Daily',
          duration: '30 days',
          quantity: 30,
          createdAt: new Date().toISOString(),
          validFrom: new Date().toISOString(),
          validUntil: new Date().toISOString(),
          status: 'active' as const,
          renewalCount: 0,
          maxRenewals: 3,
        },
      };

      (doctorApi.createPrescription as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useCreatePrescription(), { wrapper: createWrapper() });

      result.current.mutate({ patientId: 'p1', medication: 'Aspirin' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDoctorDashboard', () => {
    it('should fetch dashboard data', async () => {
      const mockData = {
        success: true,
        data: {
          totalPatients: 150,
          activePatients: 120,
          chronicPatients: 45,
          consultationsThisMonth: 32,
          pendingPrescriptions: 8,
          prescriptionsThisMonth: 76,
          averagePatientCompliance: 82,
          appointmentsThisWeek: 12,
        },
      };

      (doctorApi.getDoctorDashboard as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDoctorDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useDoctorMessageThreads', () => {
    it('should fetch message threads', async () => {
      const mockData = {
        success: true,
        data: {
          threads: [],
          total: 0,
        },
      };

      (doctorApi.getMessageThreads as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDoctorMessageThreads(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useDoctorObservanceStats', () => {
    it('should fetch observance statistics', async () => {
      const mockData = {
        success: true,
        data: {
          overallStats: [],
          chartData: [],
          topCompliantPatients: [],
          needsAttentionPatients: [],
        },
      };

      (doctorApi.getObservanceStats as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDoctorObservanceStats(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useRecentConsultations', () => {
    it('should fetch recent consultations', async () => {
      const mockData = {
        success: true,
        data: [],
      };

      (doctorApi.getRecentConsultations as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useRecentConsultations(5), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });
});
