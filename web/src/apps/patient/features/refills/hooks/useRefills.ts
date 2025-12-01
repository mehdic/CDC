/**
 * useRefills Hook
 * Custom React hook for managing refill requests
 * Task: T2-108
 */

import { useState, useCallback, useEffect } from 'react';
import { RefillRequestResponse } from '../../../types/refill.types';

interface UseRefillsOptions {
  patientId?: string;
  prescriptionId?: string;
  autoFetch?: boolean;
}

interface UseRefillsResult {
  refills: RefillRequestResponse[];
  loading: boolean;
  error: string | null;
  createRefill: (prescriptionId: string, quantityRequested?: number) => Promise<void>;
  approveRefill: (refillId: string, notes?: string) => Promise<void>;
  denyRefill: (refillId: string, reason: string) => Promise<void>;
  fillRefill: (refillId: string, quantityFilled: number) => Promise<void>;
  fetchRefills: () => Promise<void>;
  checkEligibility: (prescriptionId: string) => Promise<any>;
}

export const useRefills = (options: UseRefillsOptions = {}): UseRefillsResult => {
  const {
    patientId,
    prescriptionId,
    autoFetch = true,
  } = options;

  const [refills, setRefills] = useState<RefillRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch refills for patient or prescription
  const fetchRefills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (patientId) {
        params.append('patientId', patientId);
      }
      if (prescriptionId) {
        params.append('prescriptionId', prescriptionId);
      }

      const response = await fetch(`/api/refills?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch refills');
      }

      const data = await response.json();
      setRefills(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch refills');
    } finally {
      setLoading(false);
    }
  }, [patientId, prescriptionId]);

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch && (patientId || prescriptionId)) {
      fetchRefills();
    }
  }, [autoFetch, patientId, prescriptionId, fetchRefills]);

  // Create a new refill request
  const createRefill = useCallback(
    async (rxId: string, quantityRequested: number = 1) => {
      setError(null);

      try {
        const response = await fetch('/api/refills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prescriptionId: rxId,
            patientId,
            quantityRequested,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create refill request');
        }

        const newRefill = await response.json();
        setRefills((prev) => [newRefill, ...prev]);
      } catch (err: any) {
        setError(err.message || 'Failed to create refill request');
        throw err;
      }
    },
    [patientId]
  );

  // Approve refill (pharmacist)
  const approveRefill = useCallback(async (refillId: string, notes?: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/refills/${refillId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pharmacistId: 'current-pharmacist-id', // Would come from auth context
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve refill');
      }

      const updatedRefill = await response.json();
      setRefills((prev) =>
        prev.map((r) => (r.id === refillId ? updatedRefill : r))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to approve refill');
      throw err;
    }
  }, []);

  // Deny refill (pharmacist)
  const denyRefill = useCallback(
    async (refillId: string, reason: string) => {
      setError(null);

      try {
        const response = await fetch(`/api/refills/${refillId}/deny`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pharmacistId: 'current-pharmacist-id', // Would come from auth context
            denialReason: reason,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to deny refill');
        }

        const updatedRefill = await response.json();
        setRefills((prev) =>
          prev.map((r) => (r.id === refillId ? updatedRefill : r))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to deny refill');
        throw err;
      }
    },
    []
  );

  // Fill refill (pharmacist)
  const fillRefill = useCallback(
    async (refillId: string, quantityFilled: number) => {
      setError(null);

      try {
        const response = await fetch(`/api/refills/${refillId}/fill`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pharmacistId: 'current-pharmacist-id', // Would come from auth context
            quantityFilled,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fill refill');
        }

        const updatedRefill = await response.json();
        setRefills((prev) =>
          prev.map((r) => (r.id === refillId ? updatedRefill : r))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to fill refill');
        throw err;
      }
    },
    []
  );

  // Check eligibility for a prescription
  const checkEligibility = useCallback(async (rxId: string) => {
    setError(null);

    try {
      const response = await fetch(
        `/api/prescriptions/${rxId}/eligibility`
      );

      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message || 'Failed to check eligibility');
      throw err;
    }
  }, []);

  return {
    refills,
    loading,
    error,
    createRefill,
    approveRefill,
    denyRefill,
    fillRefill,
    fetchRefills,
    checkEligibility,
  };
};
