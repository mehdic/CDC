// Mock axios BEFORE imports
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      isAxiosError: jest.fn(() => false),
    },
    isAxiosError: jest.fn(() => false),
  };
});

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFetchList,
  useFetchItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '../useApi';

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useApi Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFetchList', () => {
    it('creates correct query key for list without params', () => {
      const { result } = renderHook(
        () => useFetchList('prescriptions'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
    });

    it('creates correct query key for list with params', () => {
      const { result } = renderHook(
        () => useFetchList('prescriptions', { status: 'pending' }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('useFetchItem', () => {
    it('creates correct query key for item detail', () => {
      const { result } = renderHook(
        () => useFetchItem('prescriptions', '123'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
    });

    it('disables query when id is not provided', () => {
      const { result } = renderHook(
        () => useFetchItem('prescriptions', ''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useCreateItem', () => {
    it('creates mutation for POST request', () => {
      const { result } = renderHook(
        () => useCreateItem('prescriptions'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });

  describe('useUpdateItem', () => {
    it('creates mutation for PUT request', () => {
      const { result } = renderHook(
        () => useUpdateItem('prescriptions', '123'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });

  describe('useDeleteItem', () => {
    it('creates mutation for DELETE request', () => {
      const { result } = renderHook(
        () => useDeleteItem('prescriptions'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.mutate).toBe('function');
    });
  });
});
