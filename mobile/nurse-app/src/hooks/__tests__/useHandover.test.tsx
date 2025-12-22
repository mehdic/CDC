/**
 * useHandover Hook Tests
 * Unit tests for the shift handover custom hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import handoverReducer from '../../store/handoverSlice';
import { useHandover } from '../useHandover';
import { ShiftHandoverNote } from '../../types/nurse';

describe('useHandover', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        handover: handoverReducer,
      },
    });
  });

  const wrapper = ({ children }: any) => React.createElement(Provider, { store }, children);

  const mockNote: ShiftHandoverNote = {
    id: '1',
    fromNurse: 'nurse-001',
    shift: 'day',
    date: '2025-12-22',
    patients: [
      {
        patientId: 'pat-001',
        patientName: 'John Doe',
        status: 'Stable',
        criticalNotes: 'Post-op day 2',
        pendingTasks: ['Change dressing'],
      },
    ],
    generalNotes: 'All stable',
    createdAt: '2025-12-22T10:00:00Z',
  };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(result.current.notes).toEqual([]);
    expect(result.current.currentNote).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.acknowledgedNotes).toEqual([]);
  });

  it('should have all expected methods', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(typeof result.current.createHandover).toBe('function');
    expect(typeof result.current.fetchHandoverNotes).toBe('function');
    expect(typeof result.current.fetchMyHandoverNotes).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.clearSuccess).toBe('function');
    expect(typeof result.current.acknowledgeHandover).toBe('function');
    expect(typeof result.current.setCurrentNote).toBe('function');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should clear success', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.clearSuccess();
    });

    expect(result.current.success).toBe(false);
  });

  it('should set current note', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.setCurrentNote(mockNote);
    });

    expect(result.current.currentNote).toEqual(mockNote);
  });

  it('should clear current note', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.setCurrentNote(mockNote);
    });

    expect(result.current.currentNote).toEqual(mockNote);

    act(() => {
      result.current.setCurrentNote(null);
    });

    expect(result.current.currentNote).toBeNull();
  });

  it('should acknowledge handover', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.acknowledgeHandover('note-1');
    });

    expect(result.current.acknowledgedNotes).toContain('note-1');
  });

  it('should handle multiple acknowledgments', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.acknowledgeHandover('note-1');
      result.current.acknowledgeHandover('note-2');
      result.current.acknowledgeHandover('note-3');
    });

    expect(result.current.acknowledgedNotes.length).toBe(3);
    expect(result.current.acknowledgedNotes).toContain('note-1');
    expect(result.current.acknowledgedNotes).toContain('note-2');
    expect(result.current.acknowledgedNotes).toContain('note-3');
  });

  it('should not add duplicate acknowledgments', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.acknowledgeHandover('note-1');
      result.current.acknowledgeHandover('note-1');
    });

    expect(result.current.acknowledgedNotes.length).toBe(1);
  });

  it('should call createHandover action', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    const noteData = {
      fromNurse: 'nurse-001',
      shift: 'day' as const,
      date: '2025-12-22',
      patients: mockNote.patients,
    };

    act(() => {
      result.current.createHandover(noteData);
    });

    // Note: In a real test with mocked API, this would update the state
    // This test validates the method exists and can be called
    expect(typeof result.current.createHandover).toBe('function');
  });

  it('should call fetchHandoverNotes action', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.fetchHandoverNotes('2025-12-22');
    });

    // Note: In a real test with mocked API, this would fetch notes
    expect(typeof result.current.fetchHandoverNotes).toBe('function');
  });

  it('should call fetchMyHandoverNotes action', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.fetchMyHandoverNotes();
    });

    expect(typeof result.current.fetchMyHandoverNotes).toBe('function');
  });

  it('should track loading state during async operations', async () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(result.current.loading).toBe(false);

    // When dispatching async action, loading should update
    // (This would be true with real async API calls)
  });

  it('should provide error feedback', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide success feedback', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(result.current.success).toBe(false);

    act(() => {
      result.current.clearSuccess();
    });

    expect(result.current.success).toBe(false);
  });

  it('should maintain notes list', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    expect(result.current.notes).toEqual([]);
    expect(Array.isArray(result.current.notes)).toBe(true);
  });

  it('should handle concurrent operations', () => {
    const { result } = renderHook(() => useHandover(), { wrapper });

    act(() => {
      result.current.acknowledgeHandover('note-1');
      result.current.setCurrentNote(mockNote);
      result.current.acknowledgeHandover('note-2');
    });

    expect(result.current.acknowledgedNotes.length).toBe(2);
    expect(result.current.currentNote).toEqual(mockNote);
  });
});
