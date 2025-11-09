/**
 * Twilio Video Room Component
 * Shared component for Twilio Video integration
 * Task: T171 - Integrate Twilio Video in web
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Video, {
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
  RemoteVideoTrack,
  RemoteAudioTrack,
  Room,
  connect,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'twilio-video';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  ScreenShare,
  StopScreenShare,
  SignalCellularAlt,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

interface TwilioVideoRoomProps {
  token: string;
  roomName: string;
  onDisconnect: () => void;
  onError?: (error: Error) => void;
  displayName?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  showControls?: boolean;
}

interface Participant {
  sid: string;
  identity: string;
  videoTrack?: RemoteVideoTrack | LocalVideoTrack;
  audioTrack?: RemoteAudioTrack | LocalAudioTrack;
}

// ============================================================================
// TwilioVideoRoom Component
// ============================================================================

const TwilioVideoRoom: React.FC<TwilioVideoRoomProps> = ({
  token,
  roomName,
  onDisconnect,
  onError,
  displayName = 'User',
  audioEnabled = true,
  videoEnabled = true,
  showControls = true,
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track states
  const [isAudioEnabled, setIsAudioEnabled] = useState(audioEnabled);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // ============================================================================
  // Connection & Cleanup
  // ============================================================================

  /**
   * Connect to Twilio Video Room
   */
  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Create local tracks
        const localVideoTrack = videoEnabled ? await createLocalVideoTrack() : undefined;
        const localAudioTrack = audioEnabled ? await createLocalAudioTrack() : undefined;

        // Connect to room
        const room = await connect(token, {
          name: roomName,
          audio: localAudioTrack,
          video: localVideoTrack,
          dominantSpeaker: true,
          networkQuality: { local: 1, remote: 1 },
        });

        setRoom(room);

        // Set local participant
        const localParticipantData: Participant = {
          sid: room.localParticipant.sid,
          identity: room.localParticipant.identity,
          videoTrack: localVideoTrack,
          audioTrack: localAudioTrack,
        };
        setLocalParticipant(localParticipantData);

        // Attach local video track
        if (localVideoTrack && localVideoRef.current) {
          localVideoTrack.attach(localVideoRef.current);
        }

        // Handle existing participants
        const existingParticipants = new Map<string, Participant>();
        room.participants.forEach((participant) => {
          const participantData = addParticipant(participant);
          existingParticipants.set(participant.sid, participantData);
        });
        setParticipants(existingParticipants);

        // Listen for new participants
        room.on('participantConnected', (participant) => {
          setParticipants((prev) => {
            const updated = new Map(prev);
            const participantData = addParticipant(participant);
            updated.set(participant.sid, participantData);
            return updated;
          });
        });

        // Listen for participant disconnections
        room.on('participantDisconnected', (participant) => {
          setParticipants((prev) => {
            const updated = new Map(prev);
            updated.delete(participant.sid);
            return updated;
          });
        });

        // Listen for network quality changes
        room.localParticipant.on('networkQualityLevelChanged', (quality) => {
          if (quality >= 4) setConnectionQuality('excellent');
          else if (quality >= 2) setConnectionQuality('good');
          else setConnectionQuality('poor');
        });

        setIsConnecting(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to video room';
        setError(errorMessage);
        setIsConnecting(false);
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    };

    connectToRoom();

    // Cleanup on unmount
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [token, roomName, audioEnabled, videoEnabled, onError]);

  /**
   * Add remote participant and attach tracks
   */
  const addParticipant = (participant: RemoteParticipant): Participant => {
    const participantData: Participant = {
      sid: participant.sid,
      identity: participant.identity,
    };

    // Attach existing tracks
    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        // Add type guard to filter only video/audio tracks
        if (publication.track.kind === 'video' || publication.track.kind === 'audio') {
          attachTrack(publication.track as RemoteVideoTrack | RemoteAudioTrack, participant.sid);
        }

        if (publication.track.kind === 'video') {
          participantData.videoTrack = publication.track as RemoteVideoTrack;
        } else if (publication.track.kind === 'audio') {
          participantData.audioTrack = publication.track as RemoteAudioTrack;
        }
      }
    });

    // Listen for future track subscriptions
    participant.on('trackSubscribed', (track) => {
      // Add type guard to filter only video/audio tracks
      if (track.kind === 'video' || track.kind === 'audio') {
        attachTrack(track as RemoteVideoTrack | RemoteAudioTrack, participant.sid);
      }
    });

    return participantData;
  };

  /**
   * Attach remote track to video/audio element
   */
  const attachTrack = (track: RemoteVideoTrack | RemoteAudioTrack, participantSid: string) => {
    if (track.kind === 'video') {
      const videoElement = remoteVideosRef.current.get(participantSid);
      if (videoElement) {
        track.attach(videoElement);
      }
    } else if (track.kind === 'audio') {
      track.attach();
    }
  };

  // ============================================================================
  // Controls
  // ============================================================================

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(() => {
    if (room && localParticipant?.audioTrack) {
      if (isAudioEnabled) {
        (localParticipant.audioTrack as LocalAudioTrack).disable();
      } else {
        (localParticipant.audioTrack as LocalAudioTrack).enable();
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [room, localParticipant, isAudioEnabled]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (room && localParticipant?.videoTrack) {
      if (isVideoEnabled) {
        (localParticipant.videoTrack as LocalVideoTrack).disable();
      } else {
        (localParticipant.videoTrack as LocalVideoTrack).enable();
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [room, localParticipant, isVideoEnabled]);

  /**
   * Disconnect from room
   */
  const handleDisconnect = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    onDisconnect();
  }, [room, onDisconnect]);

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    if (!room) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing, return to camera
        const videoTrack = await createLocalVideoTrack();
        const localVideoPublication = Array.from(room.localParticipant.videoTracks.values())[0];

        if (localVideoPublication) {
          await room.localParticipant.unpublishTrack(localVideoPublication.track);
          await room.localParticipant.publishTrack(videoTrack);

          if (localVideoRef.current) {
            videoTrack.attach(localVideoRef.current);
          }
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];

        const twilioScreenTrack = new Video.LocalVideoTrack(screenTrack);

        const localVideoPublication = Array.from(room.localParticipant.videoTracks.values())[0];

        if (localVideoPublication) {
          await room.localParticipant.unpublishTrack(localVideoPublication.track);
          await room.localParticipant.publishTrack(twilioScreenTrack);

          if (localVideoRef.current) {
            twilioScreenTrack.attach(localVideoRef.current);
          }
        }

        setIsScreenSharing(true);

        // Stop screen sharing when user stops sharing
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  }, [room, isScreenSharing]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isConnecting) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>
          Connecting to video room...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">Connection Error</Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Connection Quality Indicator */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Chip
          icon={<SignalCellularAlt />}
          label={connectionQuality}
          color={
            connectionQuality === 'excellent'
              ? 'success'
              : connectionQuality === 'good'
              ? 'primary'
              : 'error'
          }
          size="small"
        />
        <Chip
          icon={<span style={{ fontSize: 12 }}>🔒</span>}
          label="Encrypted"
          color="success"
          size="small"
          sx={{ ml: 1 }}
        />
      </Box>

      {/* Video Grid */}
      <Grid container spacing={2} sx={{ height: 'calc(100% - 80px)' }}>
        {/* Local Video */}
        <Grid item xs={12} md={participants.size > 0 ? 6 : 12}>
          <Paper
            sx={{
              position: 'relative',
              height: '100%',
              minHeight: 400,
              bgcolor: 'black',
              overflow: 'hidden',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror local video
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">
                {displayName} (You)
                {!isVideoEnabled && ' - Video Off'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Remote Videos */}
        {Array.from(participants.values()).map((participant) => (
          <Grid item xs={12} md={6} key={participant.sid}>
            <Paper
              sx={{
                position: 'relative',
                height: '100%',
                minHeight: 400,
                bgcolor: 'black',
                overflow: 'hidden',
              }}
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideosRef.current.set(participant.sid, el);
                    if (participant.videoTrack) {
                      participant.videoTrack.attach(el);
                    }
                  }
                }}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption">{participant.identity}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
            <IconButton
              onClick={toggleAudio}
              color={isAudioEnabled ? 'primary' : 'error'}
              size="large"
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
            <IconButton
              onClick={toggleVideo}
              color={isVideoEnabled ? 'primary' : 'error'}
              size="large"
            >
              {isVideoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
            <IconButton
              onClick={toggleScreenShare}
              color={isScreenSharing ? 'secondary' : 'default'}
              size="large"
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
          </Tooltip>

          <Tooltip title="End call">
            <IconButton onClick={handleDisconnect} color="error" size="large">
              <CallEnd />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default TwilioVideoRoom;
