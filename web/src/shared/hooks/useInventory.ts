import { useFetchList } from './useApi';

/**
 * Inventory item type
 */
export interface InventoryItem {
  id: string;
  medication_name: string;
  medication_gtin: string;
  quantity: number;
  unit: string;
  reorder_threshold: number;
  batch_number: string;
  expiry_date: string | null;
  is_controlled: boolean;
  storage_location: string;
}

/**
 * Hook for fetching inventory data
 * Uses the useApi hook pattern for consistent data management
 */
export const useInventoryData = () => {
  const { data, isLoading, error } = useFetchList<InventoryItem[]>(
    'inventory',
    {},
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    items: data || [],
    loading: isLoading,
    error,
    fetchItems: async (_params?: Record<string, any>) => {
      // Note: React Query handles refetching automatically
      // This function is provided for API compatibility
      return data || [];
    },
  };
};
