/**
 * useProofOfDelivery Hook
 * Custom hook for proof of delivery operations
 * Handles signature and photo upload to server
 */

import { useState, useCallback } from 'react';
import {
  ProofOfDelivery,
  DeliveryCompletionPayload,
  UploadProofResponse,
} from '../types/proofOfDelivery';

const API_BASE_URL = import.meta.env.VITE_DELIVERY_SERVICE_URL || 'http://localhost:3004';

export function useProofOfDelivery() {
  const [proof, setProof] = useState<ProofOfDelivery | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload proof of delivery (signature, photo, recipient info)
   */
  const uploadProof = useCallback(
    async (payload: DeliveryCompletionPayload): Promise<ProofOfDelivery | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('deliveryId', payload.deliveryId);
        formData.append('recipientName', payload.recipientName);

        if (payload.signature) {
          const signatureBlob = dataURLtoBlob(
            `data:${payload.signature.mimeType};base64,${payload.signature.base64}`
          );
          formData.append('signature', signatureBlob, `signature-${Date.now()}.png`);
          formData.append('signatureTimestamp', payload.signature.timestamp);
        }

        if (payload.photo) {
          const photoBlob = dataURLtoBlob(
            `data:${payload.photo.mimeType};base64,${payload.photo.base64}`
          );
          formData.append('photo', photoBlob, `photo-${Date.now()}.jpg`);
          formData.append('photoTimestamp', payload.photo.timestamp);

          if (payload.photo.location) {
            formData.append('photoLatitude', payload.photo.location.latitude.toString());
            formData.append('photoLongitude', payload.photo.location.longitude.toString());
            formData.append('photoAccuracy', payload.photo.location.accuracy.toString());
          }
        }

        formData.append('location', JSON.stringify(payload.location));
        if (payload.notes) {
          formData.append('notes', payload.notes);
        }

        const response = await fetch(`${API_BASE_URL}/deliveries/${payload.deliveryId}/complete`, {
          method: 'POST',
          headers: {
            // Don't set Content-Type for FormData - browser will set it with boundary
            // Authorization header would go here when auth is implemented
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload proof of delivery');
        }

        const data: UploadProofResponse = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to upload proof');
        }

        // Fetch proof by ID (inline to avoid circular dependency)
        const proofResponse = await fetch(`${API_BASE_URL}/proofs/${data.proofId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (proofResponse.ok) {
          const proofData: ProofOfDelivery = await proofResponse.json();
          setProof(proofData);
          return proofData;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload proof';
        setError(errorMessage);
        console.error('[useProofOfDelivery] Upload error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch proof of delivery by ID
   */
  const fetchProof = useCallback(async (id: string): Promise<ProofOfDelivery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/proofs/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proof: ${response.statusText}`);
      }

      const data: ProofOfDelivery = await response.json();
      setProof(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proof';
      setError(errorMessage);
      console.error('[useProofOfDelivery] Fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch proof by delivery ID
   */
  const fetchProofByDeliveryId = useCallback(
    async (deliveryId: string): Promise<ProofOfDelivery | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/deliveries/${deliveryId}/proof`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null; // No proof found
          }
          throw new Error(`Failed to fetch proof: ${response.statusText}`);
        }

        const data: ProofOfDelivery = await response.json();
        setProof(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proof';
        setError(errorMessage);
        console.error('[useProofOfDelivery] Fetch by delivery error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [] // No external dependencies needed
  );

  return {
    proof,
    loading,
    error,
    uploadProof,
    fetchProof,
    fetchProofByDeliveryId,
  };
}

/**
 * Helper function to convert data URL to Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  // Extract MIME type from data URL
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  return new Blob([u8arr], { type: mime });
}
