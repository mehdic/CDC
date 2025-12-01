/**
 * Voice Note Player Component
 * Playback control for voice recordings
 * Shows waveform and playback progress
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Slider,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Download,
  DeleteOutline,
  Speed,
} from '@mui/icons-material';

interface VoiceNotePlayerProps {
  audioUrl: string;
  recordingName?: string;
  duration?: number;
  fileSize?: number;
  language?: string;
  onDelete?: () => void;
  onDownload?: () => void;
}

interface PlaybackSpeed {
  label: string;
  value: number;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  recordingName = 'Voice Recording',
  duration,
  fileSize,
  language,
  onDelete,
  onDownload,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const playbackSpeeds: PlaybackSpeed[] = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ];

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setTotalDuration(audioRef.current.duration);
    }
  }, []);

  const handleSliderChange = useCallback((event: Event, newValue: number | number[]) => {
    const value = typeof newValue === 'number' ? newValue : newValue[0];
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  }, []);

  const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
    const value = typeof newValue === 'number' ? newValue : newValue[0];
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const handleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, []);

  const handlePlaybackEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleError = useCallback(() => {
    setError('Failed to load audio file');
    setIsLoading(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handlePlaybackEnd}
        onError={handleError}
        onCanPlay={handleCanPlay}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">{recordingName}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {language && <Chip label={language} size="small" variant="outlined" />}
            {fileSize && <Chip label={`${formatFileSize(fileSize)}`} size="small" variant="outlined" />}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onDownload && (
            <Tooltip title="Download recording">
              <IconButton size="small" onClick={onDownload}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete recording">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Playback Controls */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* Play/Pause Button */}
        <Grid item>
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
              onClick={handlePlayPause}
              disabled={isLoading || !!error}
              sx={{ minWidth: '80px' }}
            >
              {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
            </Button>
          </Tooltip>
        </Grid>

        {/* Time Display */}
        <Grid item>
          <Typography variant="caption" color="textSecondary" sx={{ minWidth: '50px' }}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </Typography>
        </Grid>

        {/* Playback Speed */}
        <Grid item>
          <Tooltip title={`Playback Speed: ${playbackSpeed}x`}>
            <Button
              size="small"
              startIcon={<Speed />}
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              sx={{ minWidth: '60px' }}
            >
              {playbackSpeed}x
            </Button>
          </Tooltip>
          {showSpeedMenu && (
            <Box
              sx={{
                position: 'absolute',
                mt: 1,
                backgroundColor: 'background.paper',
                border: '1px solid #ddd',
                borderRadius: 1,
                zIndex: 1,
                minWidth: '100px',
              }}
            >
              {playbackSpeeds.map((speed) => (
                <Button
                  key={speed.value}
                  fullWidth
                  size="small"
                  onClick={() => handlePlaybackSpeedChange(speed.value)}
                  sx={{
                    justifyContent: 'flex-start',
                    pl: 2,
                    backgroundColor: playbackSpeed === speed.value ? 'action.selected' : 'transparent',
                  }}
                >
                  {speed.label}
                </Button>
              ))}
            </Box>
          )}
        </Grid>

        {/* Volume Control */}
        <Grid item>
          <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
            <IconButton size="small" onClick={handleMute}>
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>
        </Grid>

        {/* Volume Slider */}
        <Grid item xs>
          <Slider
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.1}
            sx={{ maxWidth: '120px' }}
          />
        </Grid>
      </Grid>

      {/* Progress Slider */}
      <Box sx={{ mb: 2 }}>
        <Slider
          value={currentTime}
          onChange={handleSliderChange}
          min={0}
          max={totalDuration || 100}
          step={0.1}
          sx={{
            '& .MuiSlider-thumb': {
              width: '16px',
              height: '16px',
            },
          }}
        />
      </Box>

      {/* Additional Info */}
      {duration && (
        <Box sx={{ backgroundColor: '#f9f9f9', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            <strong>Duration:</strong> {formatTime(duration)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default VoiceNotePlayer;
