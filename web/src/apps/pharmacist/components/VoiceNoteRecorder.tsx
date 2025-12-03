/**
 * Voice Note Recorder Component
 * Records voice notes with real-time Azure Speech transcription for pharmacist consultations
 * Tasks: T5-016, T5-017 - Voice transcription for Swiss healthcare
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

export enum SupportedLanguage {
  FRENCH = 'fr-CH',
  GERMAN = 'de-CH',
  ITALIAN = 'it-CH',
  ROMANSH = 'rm-CH',
}

export interface VoiceNoteRecorderProps {
  appointmentId?: string;
  conversationId?: string;
  consultationType: string;
  language: SupportedLanguage;
  onSave: (transcription: string, audioUrl: string) => Promise<void>;
  readonly?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: SupportedLanguage;
  hasDoctor: boolean;
  hasPharmaTerms: boolean;
  keywords: string[];
}

// ============================================================================
// Main Component
// ============================================================================

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  appointmentId,
  conversationId,
  consultationType,
  language,
  onSave,
  readonly = false,
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Transcription state
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number | null>(null);
  const [medicalKeywords, setMedicalKeywords] = useState<string[]>([]);

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Errors
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get language display name
   */
  const getLanguageName = (lang: SupportedLanguage): string => {
    const names = {
      [SupportedLanguage.FRENCH]: 'Français (CH)',
      [SupportedLanguage.GERMAN]: 'Deutsch (CH)',
      [SupportedLanguage.ITALIAN]: 'Italiano (CH)',
      [SupportedLanguage.ROMANSH]: 'Rumantsch (CH)',
    };
    return names[lang];
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number): 'error' | 'warning' | 'success' => {
    if (confidence < 0.6) return 'error';
    if (confidence < 0.8) return 'warning';
    return 'success';
  };

  /**
   * Format duration (seconds to MM:SS)
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm', // Best browser support
      });

      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle stop event
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Trigger transcription
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  /**
   * Transcribe audio using backend API
   */
  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', language);
      formData.append('consultationType', consultationType);
      if (appointmentId) formData.append('appointmentId', appointmentId);
      if (conversationId) formData.append('conversationId', conversationId);

      // Call voice-service API
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result: TranscriptionResult = await response.json();

      setTranscriptionText(result.text);
      setTranscriptionConfidence(result.confidence);
      setMedicalKeywords(result.keywords);
    } catch (err) {
      setError('Transcription failed. Please try again or edit manually.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Play/pause audio
   */
  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  /**
   * Delete recording
   */
  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscriptionText('');
    setTranscriptionConfidence(null);
    setMedicalKeywords([]);
    setRecordingDuration(0);
    setError(null);

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
  };

  /**
   * Save voice note with transcription
   */
  const handleSave = async () => {
    if (!audioUrl || !transcriptionText) {
      setError('Cannot save: No recording or transcription available');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(transcriptionText, audioUrl);
      deleteRecording(); // Clear after successful save
    } catch (err) {
      setError('Failed to save voice note. Please try again.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Voice Note Recorder
      </Typography>

      <Stack spacing={2}>
        {/* Language Info */}
        <Box>
          <Chip
            label={`Language: ${getLanguageName(language)}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Recording Controls */}
        {!audioBlob && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              {!isRecording ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                  disabled={readonly || isRecording}
                  size="large"
                >
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<StopIcon />}
                    onClick={stopRecording}
                    size="large"
                  >
                    Stop Recording
                  </Button>
                  <Chip
                    label={formatDuration(recordingDuration)}
                    color="error"
                    icon={<MicIcon />}
                  />
                </>
              )}
            </Stack>
          </Box>
        )}

        {/* Transcription Progress */}
        {isTranscribing && (
          <Box>
            <Alert severity="info" icon={<CircularProgress size={20} />}>
              Transcribing audio using Azure Speech (Swiss multilingual)...
            </Alert>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        )}

        {/* Playback Controls */}
        {audioUrl && !isRecording && (
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              color="primary"
              onClick={togglePlayback}
              size="large"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {formatDuration(recordingDuration)}
            </Typography>
            <IconButton color="error" onClick={deleteRecording} size="small">
              <DeleteIcon />
            </IconButton>
            <Tooltip title="Re-record">
              <IconButton color="secondary" onClick={startRecording} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {/* Transcription Result */}
        {transcriptionText && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography variant="subtitle2">Transcription:</Typography>
              {transcriptionConfidence !== null && (
                <Tooltip title={`Azure Speech Confidence: ${(transcriptionConfidence * 100).toFixed(1)}%`}>
                  <Chip
                    label={`${(transcriptionConfidence * 100).toFixed(1)}% confidence`}
                    size="small"
                    color={getConfidenceColor(transcriptionConfidence)}
                  />
                </Tooltip>
              )}
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={6}
              value={transcriptionText}
              onChange={(e) => setTranscriptionText(e.target.value)}
              disabled={readonly}
              placeholder="Transcribed text will appear here..."
              helperText="You can edit the transcription before saving"
            />

            {/* Medical Keywords */}
            {medicalKeywords.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Detected medical terms:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {medicalKeywords.map((keyword, idx) => (
                    <Chip
                      key={idx}
                      label={keyword}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Save Button */}
        {transcriptionText && audioUrl && (
          <Box>
            <Button
              variant="contained"
              color="success"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={readonly || isSaving || !transcriptionText}
              fullWidth
            >
              {isSaving ? 'Saving...' : 'Save Voice Note'}
            </Button>
          </Box>
        )}

        {/* Privacy Notice */}
        <Alert severity="info" icon={false}>
          <Typography variant="caption">
            Voice recordings are processed in Switzerland (Zurich) using Azure Speech Services.
            All data is encrypted and complies with FADP/DSG regulations.
          </Typography>
        </Alert>
      </Stack>
    </Paper>
  );
};

export default VoiceNoteRecorder;
