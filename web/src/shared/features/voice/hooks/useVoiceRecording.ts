/**
 * useVoiceRecording Hook
 * Custom React hook for managing voice recording lifecycle
 * Handles recording, transcription, and API communication
 */

import { useState, useCallback, useRef } from 'react';

interface RecordingMetadata {
  duration: number;
  fileSize: number;
  mimeType: string;
  sampleRate: number;
  timestamp: Date;
}

interface TranscriptionResult {
  id: string;
  recordingId: string;
  text: string;
  confidence: number;
  language: string;
  detectedLanguage: string;
  hasDoctor: boolean;
  hasPharmaTerms: boolean;
  keywords: string[];
  status: 'completed' | 'failed';
}

interface VoiceRecordingState {
  recordingId: string | null;
  isRecording: boolean;
  isTranscribing: boolean;
  transcription: TranscriptionResult | null;
  error: string | null;
  recordingBlob: Blob | null;
}

interface UseVoiceRecordingOptions {
  apiBaseUrl?: string;
  userId?: string;
  userRole?: string;
  language?: 'fr-CH' | 'de-CH' | 'it-CH' | 'rm-CH';
  consultationType?: 'teleconsultation' | 'voice_note' | 'dictation';
}

export const useVoiceRecording = (options: UseVoiceRecordingOptions = {}) => {
  const {
    apiBaseUrl = '/api',
    userId = '',
    userRole = 'patient',
    language = 'fr-CH',
    consultationType = 'voice_note',
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    recordingId: null,
    isRecording: false,
    isTranscribing: false,
    transcription: null,
    error: null,
    recordingBlob: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Upload recording to backend
   */
  const uploadRecording = useCallback(
    async (blob: Blob, metadata: RecordingMetadata): Promise<string | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const formData = new FormData();
        formData.append('audio', blob);
        formData.append('userId', userId);
        formData.append('userRole', userRole);
        formData.append('consultationType', consultationType);
        formData.append('language', language);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await fetch(`${apiBaseUrl}/voice/recordings`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data.id) {
          setState((prev) => ({
            ...prev,
            recordingId: data.data.id,
            recordingBlob: blob,
          }));
          return data.data.id;
        }

        throw new Error('Invalid response format');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    [apiBaseUrl, userId, userRole, consultationType, language],
  );

  /**
   * Transcribe recording
   */
  const transcribeRecording = useCallback(
    async (recordingId: string): Promise<TranscriptionResult | null> => {
      try {
        setState((prev) => ({ ...prev, isTranscribing: true, error: null }));

        abortControllerRef.current = new AbortController();

        const response = await fetch(`${apiBaseUrl}/voice/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recordingId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setState((prev) => ({
            ...prev,
            transcription: data.data,
            isTranscribing: false,
          }));
          return data.data;
        }

        throw new Error('Invalid transcription response');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }

        const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isTranscribing: false,
        }));
        return null;
      }
    },
    [apiBaseUrl],
  );

  /**
   * Complete workflow: record -> upload -> transcribe
   */
  const completeWorkflow = useCallback(
    async (blob: Blob, metadata: RecordingMetadata): Promise<TranscriptionResult | null> => {
      try {
        // Upload
        const recordingId = await uploadRecording(blob, metadata);

        if (!recordingId) {
          throw new Error('Failed to upload recording');
        }

        // Transcribe
        const result = await transcribeRecording(recordingId);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Workflow failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    [uploadRecording, transcribeRecording],
  );

  /**
   * Cancel ongoing transcription
   */
  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({
        ...prev,
        isTranscribing: false,
        error: 'Transcription cancelled',
      }));
    }
  }, []);

  /**
   * Fetch existing transcription
   */
  const fetchTranscription = useCallback(
    async (recordingId: string): Promise<TranscriptionResult | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const response = await fetch(
          `${apiBaseUrl}/voice/transcriptions/recording/${recordingId}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch transcription: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setState((prev) => ({ ...prev, transcription: data.data }));
          return data.data;
        }

        throw new Error('Invalid response format');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Fetch failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    [apiBaseUrl],
  );

  /**
   * Save transcription changes
   */
  const saveTranscriptionChanges = useCallback(
    async (text: string, notes: string): Promise<boolean> => {
      try {
        if (!state.transcription) {
          throw new Error('No transcription to save');
        }

        const response = await fetch(
          `${apiBaseUrl}/voice/transcriptions/${state.transcription.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              notes,
              updatedAt: new Date().toISOString(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Save failed: ${response.statusText}`);
        }

        setState((prev) => ({
          ...prev,
          transcription: prev.transcription
            ? { ...prev.transcription, text }
            : null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Save failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [state.transcription, apiBaseUrl],
  );

  /**
   * Delete recording
   */
  const deleteRecording = useCallback(
    async (recordingId: string): Promise<boolean> => {
      try {
        const response = await fetch(`${apiBaseUrl}/voice/recordings/${recordingId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.statusText}`);
        }

        setState((prev) => ({
          ...prev,
          recordingId: null,
          transcription: null,
          recordingBlob: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Delete failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [apiBaseUrl],
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      recordingId: null,
      isRecording: false,
      isTranscribing: false,
      transcription: null,
      error: null,
      recordingBlob: null,
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    uploadRecording,
    transcribeRecording,
    completeWorkflow,
    cancelTranscription,
    fetchTranscription,
    saveTranscriptionChanges,
    deleteRecording,
    clearError,
    reset,
  };
};

export default useVoiceRecording;
