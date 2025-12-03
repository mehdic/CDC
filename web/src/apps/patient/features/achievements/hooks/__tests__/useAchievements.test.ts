/**
 * useAchievements Hook Tests
 * Tests for achievement API integration hook
 * Task: T6-021
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAchievements } from '../useAchievements';

// Mock fetch
global.fetch = jest.fn();

describe('useAchievements Hook', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchAchievements', () => {
    it('should fetch all achievements successfully', async () => {
      const mockAchievements = [
        {
          achievementId: '1',
          name: 'First Timer',
          description: 'Complete your first task',
          category: 'adherence' as const,
          tier: 'bronze' as const,
          iconUrl: 'http://example.com/badge1.png',
          pointsAwarded: 100,
          isSecret: false,
          criteria: { type: 'counter' as const, metric: 'tasks', threshold: 1 },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAchievements,
      });

      const { result } = renderHook(() => useAchievements({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchAchievements();
      });

      await waitFor(() => {
        expect(result.current.achievements).toEqual(mockAchievements);
      });
    });

    it('should handle fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useAchievements({ autoFetch: false }));

      await act(async () => {
        await result.current.fetchAchievements();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('fetchPatientAchievements', () => {
    it('should fetch patient achievements when patientId is provided', async () => {
      const mockPatientAchievements = [
        {
          patientId: 'patient123',
          achievementId: '1',
          earnedAt: new Date(),
          progress: 100,
          isLocked: false,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatientAchievements,
      });

      const { result } = renderHook(() =>
        useAchievements({ patientId: 'patient123', autoFetch: false })
      );

      await act(async () => {
        await result.current.fetchPatientAchievements();
      });

      await waitFor(() => {
        expect(result.current.patientAchievements).toEqual(mockPatientAchievements);
      });
    });

    it('should skip fetching when patientId is not provided', async () => {
      const { result } = renderHook(() =>
        useAchievements({ patientId: undefined, autoFetch: false })
      );

      await act(async () => {
        await result.current.fetchPatientAchievements();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createGoal', () => {
    it('should create a new health goal', async () => {
      const mockGoal = {
        goalId: 'goal123',
        goalType: 'weight' as const,
        targetValue: 75,
        currentValue: 80,
        startDate: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
        progress: 0,
        checkIns: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoal,
      });

      const { result } = renderHook(() =>
        useAchievements({ patientId: 'patient123', autoFetch: false })
      );

      const newGoal = {
        goalType: 'weight' as const,
        targetValue: 75,
        currentValue: 80,
        startDate: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active' as const,
        progress: 0,
        checkIns: [],
      };

      let createdGoal;
      await act(async () => {
        createdGoal = await result.current.createGoal(newGoal);
      });

      expect(createdGoal).toEqual(mockGoal);
      expect(result.current.goals).toContainEqual(mockGoal);
    });

    it('should throw error when patientId is missing', async () => {
      const { result } = renderHook(() =>
        useAchievements({ patientId: undefined, autoFetch: false })
      );

      const goalData = {
        goalType: 'weight' as const,
        targetValue: 75,
        currentValue: 80,
        startDate: new Date(),
        targetDate: new Date(),
        status: 'active' as const,
        progress: 0,
        checkIns: [],
      };

      await act(async () => {
        try {
          await result.current.createGoal(goalData);
          fail('Should have thrown error');
        } catch (error) {
          expect((error as Error).message).toContain('Patient ID required');
        }
      });
    });
  });

  describe('joinChallenge', () => {
    it('should join a challenge successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() =>
        useAchievements({ patientId: 'patient123', autoFetch: false })
      );

      await act(async () => {
        await result.current.joinChallenge('challenge123');
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should set loading to true during fetch', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => [] }),
              100
            )
          )
      );

      const { result } = renderHook(() => useAchievements({ autoFetch: false }));

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.fetchAchievements();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
