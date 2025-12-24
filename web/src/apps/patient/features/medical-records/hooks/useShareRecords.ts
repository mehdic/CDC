/**
 * useShareRecords Hook
 * Custom hook for sharing medical records with healthcare providers
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import { useState } from 'react';
import { shareRecords } from '../services/medicalRecordsService';
import { ShareRecordRequest, ShareRecordResponse } from '../types';

export function useShareRecords() {
  const [sharing, setSharing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [shareResult, setShareResult] = useState<ShareRecordResponse | null>(
    null
  );

  const share = async (request: ShareRecordRequest) => {
    try {
      setSharing(true);
      setError(null);
      const result = await shareRecords(request);
      setShareResult(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSharing(false);
    }
  };

  const reset = () => {
    setSharing(false);
    setError(null);
    setShareResult(null);
  };

  return {
    share,
    sharing,
    error,
    shareResult,
    reset,
  };
}
