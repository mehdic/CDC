/**
 * useMedicalRecords Hook
 * Custom hook for fetching and managing medical records
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getMyMedicalRecords,
  getMedicalRecordsByType,
  getRecordCounts,
} from '../services/medicalRecordsService';
import {
  MedicalRecord,
  RecordCounts,
  MedicalRecordsFilters,
  RecordType,
} from '../types';

export function useMedicalRecords(filters: MedicalRecordsFilters = {}) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyMedicalRecords(filters);
        setRecords(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [
    filters.recordType,
    filters.activeOnly,
    filters.startDate,
    filters.endDate,
    filters.search,
  ]);

  return { records, loading, error, refetch: () => setLoading(true) };
}

export function useRecordsByType(
  recordType: RecordType,
  activeOnly: boolean = true
) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMedicalRecordsByType(recordType, activeOnly);
        setRecords(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [recordType, activeOnly]);

  return { records, loading, error, refetch: () => setLoading(true) };
}

export function useRecordCounts() {
  const [counts, setCounts] = useState<RecordCounts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRecordCounts();
        setCounts(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading, error, refetch: () => setLoading(true) };
}
