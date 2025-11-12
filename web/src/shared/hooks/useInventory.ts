import { useFetchList } from './useApi';
import { getUserData } from '../services/authService';

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
  // Get pharmacy_id from user data
  const userData = getUserData();
  const pharmacyId = userData?.pharmacyId;

  // Build query params with pharmacy_id
  const queryParams = {
    pharmacy_id: pharmacyId || '',
  };

  const { data, isLoading, error, refetch } = useFetchList<InventoryItem[]>(
    'inventory/items',
    queryParams,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!pharmacyId, // Only fetch if we have a pharmacy_id
    }
  );

  // Handle both array and paginated response formats
  const items = Array.isArray(data) ? data : (data as any)?.items || [];

  return {
    items,
    loading: isLoading,
    error,
    fetchItems: async (_params?: Record<string, any>) => {
      // Re-fetch with current params
      refetch();
      return items;
    },
  };
};
