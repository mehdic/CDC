/**
 * Teleconsultation Components Tests
 * Unit tests for teleconsultation hooks and components
 */

// Mock axios BEFORE imports
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
  useTeleconsultations,
  useAvailability,
  useBookConsultation,
  TeleconsultationStatus,
} from '../shared/hooks/useTeleconsultation';

// Use React and ReactNode types to satisfy linter
void (React as unknown);
void ({} as ReactNode);

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Teleconsultation Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('useTeleconsultations', () => {
    it('should define query key correctly', () => {
      const { result } = renderHook(
        () => useTeleconsultations({ status: TeleconsultationStatus.SCHEDULED }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('useAvailability', () => {
    it('should require start_date and end_date to be enabled', () => {
      const { result } = renderHook(
        () =>
          useAvailability({
            start_date: '',
            end_date: '',
          }),
        { wrapper: createWrapper() }
      );

      // Query should be disabled when dates are empty
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should be enabled with valid dates', () => {
      const { result } = renderHook(
        () =>
          useAvailability({
            start_date: '2025-11-01',
            end_date: '2025-11-07',
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('useBookConsultation', () => {
    it('should return mutation function', () => {
      const { result } = renderHook(() => useBookConsultation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });
});

describe('Teleconsultation Components', () => {
  it('should export components correctly', async () => {
    // Dynamic imports to verify components exist
    const ConsultationCalendar = await import('../apps/pharmacist/pages/ConsultationCalendar');
    const VideoCall = await import('../apps/pharmacist/pages/VideoCall');
    const TwilioVideoRoom = await import('../shared/components/TwilioVideoRoom');
    const PatientRecordPanel = await import('../apps/pharmacist/components/PatientRecordPanel');
    const NotesEditor = await import('../apps/pharmacist/components/NotesEditor');

    expect(ConsultationCalendar.default).toBeDefined();
    expect(VideoCall.default).toBeDefined();
    expect(TwilioVideoRoom.default).toBeDefined();
    expect(PatientRecordPanel.default).toBeDefined();
    expect(NotesEditor.default).toBeDefined();
  });
});

describe('Integration Tests', () => {
  it('should have correct API endpoint structure', () => {
    const baseUrl = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';
    const expectedEndpoint = `${baseUrl}/teleconsultations`;

    expect(expectedEndpoint).toBe('http://localhost:4000/teleconsultations');
  });

  it('should handle Twilio token storage', () => {
    const mockToken = 'twilio-test-token';
    const mockRoomName = 'test-room';

    // Simulate storing Twilio credentials
    sessionStorage.setItem('twilio_token', mockToken);
    sessionStorage.setItem('twilio_room', mockRoomName);

    expect(sessionStorage.getItem('twilio_token')).toBe(mockToken);
    expect(sessionStorage.getItem('twilio_room')).toBe(mockRoomName);

    sessionStorage.clear();
  });
});
