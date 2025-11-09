import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  endpoint: string;
}

/**
 * Get API base URL from environment
 * Falls back to default for test environments
 */
const getBaseUrl = (): string => {
  // In test environment, just use default
  // In Vite environment, this will be replaced by the actual env variable
  return 'http://localhost:8000/api';
};

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Add auth token to requests if available
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Handle API errors
 */
const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return {
      message:
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Une erreur est survenue',
      code: axiosError.code,
      details: axiosError.response?.data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Une erreur inconnue est survenue',
  };
};

/**
 * Generic fetch function for GET requests
 */
export const fetchApi = async <TData = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<TData> => {
  try {
    const response = await apiClient.get<TData>(endpoint, config);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Generic mutation function for POST/PUT/PATCH/DELETE requests
 */
export const mutateApi = async <TData = any, TVariables = any>(
  endpoint: string,
  data?: TVariables,
  config?: AxiosRequestConfig
): Promise<TData> => {
  try {
    const method = config?.method || 'POST';
    let response;

    switch (method.toUpperCase()) {
      case 'POST':
        response = await apiClient.post<TData>(endpoint, data, config);
        break;
      case 'PUT':
        response = await apiClient.put<TData>(endpoint, data, config);
        break;
      case 'PATCH':
        response = await apiClient.patch<TData>(endpoint, data, config);
        break;
      case 'DELETE':
        response = await apiClient.delete<TData>(endpoint, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Custom hook for GET requests using React Query
 */
export function useApiQuery<TData = any>(
  queryKey: QueryKey,
  endpoint: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => fetchApi<TData>(endpoint, config),
    ...options,
  });
}

/**
 * Custom hook for POST/PUT/PATCH/DELETE requests using React Query
 */
export function useApiMutation<TData = any, TVariables = any>(
  endpoint: string,
  config?: AxiosRequestConfig,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables: TVariables) =>
      mutateApi<TData, TVariables>(endpoint, variables, config),
    ...options,
  });
}

/**
 * Hook for fetching a list of items
 */
export function useFetchList<TData = any>(
  resourceName: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
  const queryKey = params
    ? [resourceName, 'list', params]
    : [resourceName, 'list'];

  return useApiQuery<TData>(
    queryKey,
    `/${resourceName}`,
    { params },
    options
  );
}

/**
 * Hook for fetching a single item by ID
 */
export function useFetchItem<TData = any>(
  resourceName: string,
  id: string | number,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useApiQuery<TData>(
    [resourceName, 'detail', id],
    `/${resourceName}/${id}`,
    {},
    {
      enabled: !!id,
      ...options,
    }
  );
}

/**
 * Hook for creating a new item
 */
export function useCreateItem<TData = any, TVariables = any>(
  resourceName: string,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    `/${resourceName}`,
    { method: 'POST' },
    options
  );
}

/**
 * Hook for updating an existing item
 */
export function useUpdateItem<TData = any, TVariables = any>(
  resourceName: string,
  id: string | number,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    `/${resourceName}/${id}`,
    { method: 'PUT' },
    options
  );
}

/**
 * Hook for deleting an item
 */
export function useDeleteItem<TData = any>(
  resourceName: string,
  options?: UseMutationOptions<TData, ApiError, string | number>
) {
  return useMutation<TData, ApiError, string | number>({
    mutationFn: (id) =>
      mutateApi<TData>(`/${resourceName}/${id}`, undefined, {
        method: 'DELETE',
      }),
    ...options,
  });
}

export default {
  useApiQuery,
  useApiMutation,
  useFetchList,
  useFetchItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
};
