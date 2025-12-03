/**
 * Call Transcription Hook
 * Real-time transcription for teleconsultation calls with consent management
 * Task: T5-017 - Implement call transcription for teleconsultation
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export enum SupportedLanguage {
  FRENCH = 'fr-CH',
  GERMAN = 'de-CH',
  ITALIAN = 'it-CH',
  ROMANSH = 'rm-CH',
}

export interface TranscriptionSegment {
  timestamp: number;
  speaker: 'pharmacist' | 'patient';
  text: string;
  confidence: number;
}

export interface CallTranscriptionConfig {
  appointmentId: string;
  language: SupportedLanguage;
  patientConsent: boolean;
  pharmacistId: string;
  patientId: string;
}

export interface CallTranscriptionState {
  isRecording: boolean;
  isTranscribing: boolean;
  segments: TranscriptionSegment[];
  fullTranscript: string;
  error: string | null;
  duration: number;
}

export interface CallTranscriptionActions {
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<void>;
  pauseTranscription: () => void;
  resumeTranscription: () => void;
  saveTranscription: () => Promise<void>;
  clearTranscription: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export const useCallTranscription = (
  config: CallTranscriptionConfig
): [CallTranscriptionState, CallTranscriptionActions] => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  /**
   * Check consent before allowing recording
   */
  const checkConsent = (): boolean => {
    if (!config.patientConsent) {
      setError('Patient consent required for call transcription');
      return false;
    }
    return true;
  };

  /**
   * Start real-time transcription
   */
  const startTranscription = useCallback(async () => {
    if (!checkConsent()) return;

    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder for streaming
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Connect to voice-service WebSocket for real-time transcription
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/voice/transcribe-stream`;

      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      ws.onopen = () => {
        // Send configuration
        ws.send(
          JSON.stringify({
            type: 'config',
            appointmentId: config.appointmentId,
            language: config.language,
            pharmacistId: config.pharmacistId,
            patientId: config.patientId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'transcription') {
            // Add new transcription segment
            const segment: TranscriptionSegment = {
              timestamp: Date.now(),
              speaker: data.speaker || 'pharmacist',
              text: data.text,
              confidence: data.confidence || 0,
            };

            setSegments((prev) => [...prev, segment]);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsTranscribing(false);
      };

      // Send audio chunks to WebSocket
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Send to WebSocket for real-time transcription
          if (ws.readyState === WebSocket.OPEN && !isPaused) {
            ws.send(event.data);
          }
        }
      };

      // Handle stop event
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };

      // Start recording with timeslice for streaming
      mediaRecorder.start(100); // Send chunks every 100ms
      setIsRecording(true);
      setIsTranscribing(true);
      setDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to start transcription. Please check microphone permissions.');
      console.error('Transcription start error:', err);
    }
  }, [config, isPaused]);

  /**
   * Stop transcription
   */
  const stopTranscription = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    }
  }, [isRecording]);

  /**
   * Pause transcription
   */
  const pauseTranscription = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  /**
   * Resume transcription
   */
  const resumeTranscription = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Restart duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  /**
   * Save transcription to patient record
   */
  const saveTranscription = useCallback(async () => {
    if (segments.length === 0) {
      setError('No transcription to save');
      return;
    }

    try {
      // Combine all segments into full transcript
      const fullTranscript = segments
        .map((seg) => `[${seg.speaker}] ${seg.text}`)
        .join('\n');

      // Save to backend
      const response = await fetch('/api/voice/save-transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: config.appointmentId,
          pharmacistId: config.pharmacistId,
          patientId: config.patientId,
          language: config.language,
          segments,
          fullTranscript,
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transcription');
      }

      // Clear after successful save
      clearTranscription();
    } catch (err) {
      setError('Failed to save transcription. Please try again.');
      console.error('Save error:', err);
    }
  }, [segments, config, duration]);

  /**
   * Clear transcription
   */
  const clearTranscription = useCallback(() => {
    setSegments([]);
    setDuration(0);
    setError(null);
    audioChunksRef.current = [];
  }, []);

  /**
   * Compute full transcript
   */
  const fullTranscript = segments
    .map((seg) => seg.text)
    .join(' ')
    .trim();

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [isRecording]);

  const state: CallTranscriptionState = {
    isRecording: isRecording && !isPaused,
    isTranscribing,
    segments,
    fullTranscript,
    error,
    duration,
  };

  const actions: CallTranscriptionActions = {
    startTranscription,
    stopTranscription,
    pauseTranscription,
    resumeTranscription,
    saveTranscription,
    clearTranscription,
  };

  return [state, actions];
};

export default useCallTranscription;
