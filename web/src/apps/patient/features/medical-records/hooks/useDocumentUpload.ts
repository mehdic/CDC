/**
 * useDocumentUpload Hook
 * Custom hook for uploading medical documents
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import { useState } from 'react';
import { uploadDocument } from '../services/medicalRecordsService';
import { DocumentUploadRequest, DocumentUploadResponse } from '../types';

export function useDocumentUpload() {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [uploadedDocument, setUploadedDocument] =
    useState<DocumentUploadResponse | null>(null);

  const upload = async (request: DocumentUploadRequest) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate progress (in real implementation, use axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadDocument(request);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedDocument(result);

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setUploadedDocument(null);
  };

  return {
    upload,
    uploading,
    uploadProgress,
    error,
    uploadedDocument,
    reset,
  };
}
