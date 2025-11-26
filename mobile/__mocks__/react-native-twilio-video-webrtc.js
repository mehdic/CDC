/**
 * Mock for react-native-twilio-video-webrtc
 */

const mockTwilioVideo = {
  connect: jest.fn((accessToken, options) => {
    // Simulate async connection - trigger callback immediately if set
    setTimeout(() => {
      if (mockTwilioVideo.onRoomDidConnect) {
        mockTwilioVideo.onRoomDidConnect();
      }
    }, 50);
  }),
  disconnect: jest.fn(() => {
    if (mockTwilioVideo.onRoomDidDisconnect) {
      mockTwilioVideo.onRoomDidDisconnect();
    }
  }),
  setOnRoomDidConnect: jest.fn((callback) => {
    mockTwilioVideo.onRoomDidConnect = callback;
    // Trigger immediately after setting
    setTimeout(() => {
      if (callback) callback();
    }, 50);
  }),
  setOnRoomDidDisconnect: jest.fn((callback) => {
    mockTwilioVideo.onRoomDidDisconnect = callback;
  }),
  setOnRoomDidFailToConnect: jest.fn((callback) => {
    mockTwilioVideo.onRoomDidFailToConnect = callback;
  }),
  setOnParticipantAddedVideoTrack: jest.fn((callback) => {
    mockTwilioVideo.onParticipantAddedVideoTrack = callback;
  }),
  setOnParticipantRemovedVideoTrack: jest.fn((callback) => {
    mockTwilioVideo.onParticipantRemovedVideoTrack = callback;
  }),
  setOnNetworkQualityLevelsChanged: jest.fn((callback) => {
    mockTwilioVideo.onNetworkQualityLevelsChanged = callback;
  }),
  setOnReconnecting: jest.fn((callback) => {
    mockTwilioVideo.onReconnecting = callback;
  }),
  setOnReconnected: jest.fn((callback) => {
    mockTwilioVideo.onReconnected = callback;
  }),
  setLocalVideoEnabled: jest.fn(),
  setLocalAudioEnabled: jest.fn(),
  onRoomDidConnect: null,
  onRoomDidDisconnect: null,
  onRoomDidFailToConnect: null,
  onParticipantAddedVideoTrack: null,
  onParticipantRemovedVideoTrack: null,
  onNetworkQualityLevelsChanged: null,
  onReconnecting: null,
  onReconnected: null,
};

// Mock views
const TwilioVideoLocalView = 'TwilioVideoLocalView';
const TwilioVideoParticipantView = 'TwilioVideoParticipantView';

module.exports = {
  TwilioVideo: mockTwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
};
