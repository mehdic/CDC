/**
 * Unit Tests for Custom Hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePatients } from '../hooks/usePatients';
import { useOrders } from '../hooks/useOrders';
import { useNotifications } from '../hooks/useNotifications';
import * as nurseApi from '../services/nurseApi';

jest.mock('../services/nurseApi');

describe('usePatients hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches patients successfully', async () => {
    const mockPatients = [
      {
        id: 'patient-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        room: '101',
        ward: 'Cardiologie',
        dateOfBirth: '1980-01-01',
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        contactNumber: '+41 79 123 45 67',
        emergencyContact: {
          name: 'Marie',
          phone: '+41 79 987 65 43',
          relationship: 'Épouse',
        },
        nurseNotes: [],
        lastUpdated: '2024-12-01T10:00:00Z',
      },
    ];

    (nurseApi.getPatients as jest.Mock).mockResolvedValue(mockPatients);

    const { result } = renderHook(() => usePatients());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.patients).toEqual(mockPatients);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    (nurseApi.getPatients as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePatients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });
});

describe('useOrders hook', () => {
  it('fetches orders successfully', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        patientId: 'patient-1',
        patientName: 'Jean Dupont',
        room: '101',
        medications: [],
        urgency: 'routine' as const,
        status: 'pending' as const,
        pharmacyId: 'pharmacy-1',
        pharmacyName: 'Pharmacie Centrale',
        createdBy: 'nurse-1',
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
      },
    ];

    (nurseApi.getOrders as jest.Mock).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
  });

  it('refetches orders on demand', async () => {
    (nurseApi.getOrders as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.refetch();

    expect(nurseApi.getOrders).toHaveBeenCalledTimes(2);
  });
});

describe('useNotifications hook', () => {
  it('fetches notifications successfully', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'order_confirmed' as const,
        title: 'Commande confirmée',
        message: 'Votre commande a été confirmée',
        timestamp: '2024-12-01T10:00:00Z',
        read: false,
        priority: 'medium' as const,
      },
    ];

    (nurseApi.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks notification as read', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'order_confirmed' as const,
        title: 'Commande confirmée',
        message: 'Votre commande a été confirmée',
        timestamp: '2024-12-01T10:00:00Z',
        read: false,
        priority: 'medium' as const,
      },
    ];

    (nurseApi.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);
    (nurseApi.markNotificationRead as jest.Mock).mockResolvedValue();

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.markAsRead('notif-1');

    expect(nurseApi.markNotificationRead).toHaveBeenCalledWith('notif-1');
  });
});
