/**
 * Mock for react-native-twilio-video-webrtc
 * Supports callback props pattern used by React Native Twilio Video SDK
 */
const React = require('react');

// Store for callback props - shared across instances for test access
let currentCallbacks = {
  onRoomDidConnect: null,
  onRoomDidDisconnect: null,
  onRoomDidFailToConnect: null,
  onParticipantAddedVideoTrack: null,
  onParticipantRemovedVideoTrack: null,
  onNetworkQualityLevelsChanged: null,
};

// Create mock ref methods
const createMockRef = (callbacks) => ({
  connect: jest.fn((options) => {
    // Simulate async connection
    setTimeout(() => {
      if (callbacks.onRoomDidConnect) {
        callbacks.onRoomDidConnect();
      }
    }, 10);
  }),
  disconnect: jest.fn(() => {
    if (callbacks.onRoomDidDisconnect) {
      callbacks.onRoomDidDisconnect();
    }
  }),
  setLocalVideoEnabled: jest.fn(),
  setLocalAudioEnabled: jest.fn(),
});

// TwilioVideo component mock - accepts callback props and ref
const TwilioVideo = React.forwardRef((props, ref) => {
  // Store callbacks for triggering during tests
  currentCallbacks.onRoomDidConnect = props.onRoomDidConnect;
  currentCallbacks.onRoomDidDisconnect = props.onRoomDidDisconnect;
  currentCallbacks.onRoomDidFailToConnect = props.onRoomDidFailToConnect;
  currentCallbacks.onParticipantAddedVideoTrack = props.onParticipantAddedVideoTrack;
  currentCallbacks.onParticipantRemovedVideoTrack = props.onParticipantRemovedVideoTrack;
  currentCallbacks.onNetworkQualityLevelsChanged = props.onNetworkQualityLevelsChanged;

  // Create mock ref with access to callbacks
  const mockRef = createMockRef(currentCallbacks);

  // Expose ref methods via useImperativeHandle pattern
  React.useImperativeHandle(ref, () => mockRef, []);

  // Use useEffect to call ref callback if using callback ref pattern
  React.useEffect(() => {
    if (typeof ref === 'function') {
      ref(mockRef);
    }
  }, []);

  return React.createElement('TwilioVideo', { testID: 'twilio-video' });
});

TwilioVideo.displayName = 'TwilioVideo';

// Helper to trigger callbacks in tests
TwilioVideo._triggerConnect = () => {
  if (currentCallbacks.onRoomDidConnect) {
    currentCallbacks.onRoomDidConnect();
  }
};

TwilioVideo._triggerDisconnect = () => {
  if (currentCallbacks.onRoomDidDisconnect) {
    currentCallbacks.onRoomDidDisconnect();
  }
};

TwilioVideo._triggerParticipantAdded = (participantData) => {
  if (currentCallbacks.onParticipantAddedVideoTrack) {
    currentCallbacks.onParticipantAddedVideoTrack(participantData);
  }
};

TwilioVideo._getCurrentCallbacks = () => currentCallbacks;

// Mock views as simple components
const TwilioVideoLocalView = (props) => {
  return React.createElement('TwilioVideoLocalView', props);
};

const TwilioVideoParticipantView = (props) => {
  return React.createElement('TwilioVideoParticipantView', props);
};

module.exports = {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
};
