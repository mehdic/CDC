/**
 * Voice Recorder Component
 * Captures audio from user microphone for teleconsultations and voice notes
 * Supports real-time waveform visualization and transcription
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Stop,
  PlayArrow,
  CloudUpload,
  Delete as DeleteIcon,
  VolumeUp,
} from '@mui/icons-material';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, metadata: RecordingMetadata) => void;
  onError?: (error: Error) => void;
  maxDurationSeconds?: number;
  language?: 'fr-CH' | 'de-CH' | 'it-CH' | 'rm-CH';
  consultationType?: 'teleconsultation' | 'voice_note' | 'dictation';
  showWaveform?: boolean;
  showTranscription?: boolean;
}

interface RecordingMetadata {
  duration: number;
  fileSize: number;
  mimeType: string;
  sampleRate: number;
  timestamp: Date;
}

interface AudioContextInfo {
  sampleRate: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onError,
  maxDurationSeconds = 600, // 10 minutes
  language = 'fr-CH',
  consultationType = 'voice_note',
  showWaveform = true,
  showTranscription = false,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  /**
   * Request microphone access
   */
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
      throw err;
    }
  }, [onError]);

  /**
   * Initialize audio context and analyser
   */
  const initializeAudioContext = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  }, []);

  /**
   * Draw waveform visualization
   */
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate audio level
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average);

    // Draw canvas
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 100, 200)';
    canvasCtx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [isRecording]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const stream = await requestMicrophoneAccess();
      streamRef.current = stream;

      // Initialize audio context for visualization
      if (showWaveform) {
        initializeAudioContext(stream);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      let recordingDuration = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      // Duration tracking
      const durationInterval = setInterval(() => {
        recordingDuration += 1;
        setDuration(recordingDuration);

        if (recordingDuration >= maxDurationSeconds) {
          stopRecording();
          clearInterval(durationInterval);
        }
      }, 1000);

      // Start waveform animation
      if (showWaveform) {
        drawWaveform();
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Recording failed';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    }
  }, [requestMicrophoneAccess, initializeAudioContext, showWaveform, drawWaveform, maxDurationSeconds, onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused]);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setRecordingBlob(null);
      chunksRef.current = [];

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, []);

  /**
   * Submit recording
   */
  const submitRecording = useCallback(() => {
    if (recordingBlob) {
      const metadata: RecordingMetadata = {
        duration,
        fileSize: recordingBlob.size,
        mimeType: recordingBlob.type,
        sampleRate: audioContextRef.current?.sampleRate || 48000,
        timestamp: new Date(),
      };
      onRecordingComplete(recordingBlob, metadata);
      setRecordingBlob(null);
      setDuration(0);
    }
  }, [recordingBlob, duration, onRecordingComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Voice Recorder
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} alignItems="center">
        {/* Language and Type Info */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Language: ${language}`} size="small" variant="outlined" />
            <Chip label={`Type: ${consultationType}`} size="small" variant="outlined" />
          </Box>
        </Grid>

        {/* Waveform Visualization */}
        {showWaveform && (
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <canvas
                ref={canvasRef}
                width={300}
                height={100}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  width: '100%',
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={audioLevel}
              sx={{
                height: 8,
                borderRadius: '4px',
              }}
            />
          </Grid>
        )}

        {/* Duration Display */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" color={isRecording ? 'error' : 'textPrimary'}>
              {formatTime(duration)}
            </Typography>
            {isRecording && (
              <Box
                sx={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  animation: 'pulse 1.5s infinite',
                  ml: 1,
                }}
              />
            )}
          </Box>
        </Grid>

        {/* Control Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isRecording && !recordingBlob && (
              <Tooltip title="Start recording">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Mic />}
                  onClick={startRecording}
                  disabled={isLoading}
                >
                  Start
                </Button>
              </Tooltip>
            )}

            {isRecording && (
              <>
                <Tooltip title={isPaused ? 'Resume recording' : 'Pause recording'}>
                  <Button
                    variant="outlined"
                    startIcon={isPaused ? <Mic /> : <MicOff />}
                    onClick={pauseRecording}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                </Tooltip>

                <Tooltip title="Stop recording">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopRecording}
                  >
                    Stop
                  </Button>
                </Tooltip>
              </>
            )}

            {recordingBlob && (
              <>
                <Tooltip title="Delete recording">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={cancelRecording}
                  >
                    Delete
                  </Button>
                </Tooltip>

                <Tooltip title="Submit recording for transcription">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CloudUpload />}
                    onClick={submitRecording}
                  >
                    Submit
                  </Button>
                </Tooltip>
              </>
            )}
          </Box>
        </Grid>

        {/* Recording Info */}
        {recordingBlob && (
          <Grid item xs={12}>
            <Alert severity="success">
              Recording complete: {(recordingBlob.size / 1024).toFixed(2)} KB
            </Alert>
          </Grid>
        )}
      </Grid>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Paper>
  );
};

export default VoiceRecorder;
