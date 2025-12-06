/**
 * Tests for TwilioVideo Component
 * Task: T155
 */

import { render, act, waitFor } from '@testing-library/react-native';
import React from 'react';

import TwilioVideoComponent from '../src/components/TwilioVideo';

// Store captured props to trigger callbacks in tests
let capturedTwilioProps: any = {};
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockSetLocalVideoEnabled = jest.fn();

// Mock the Twilio SDK with a proper React component
jest.mock('react-native-twilio-video-webrtc', () => {
  const _React = require('react');

  // TwilioVideo component that captures props and provides ref methods
  const TwilioVideo = _React.forwardRef((props: any, ref: any) => {
    // Store props so tests can access and trigger callbacks
    capturedTwilioProps = props;

    // Provide imperative methods via ref
    _React.useImperativeHandle(ref, () => ({
      connect: mockConnect,
      disconnect: mockDisconnect,
      setLocalVideoEnabled: mockSetLocalVideoEnabled,
    }));

    return _React.createElement('TwilioVideo', props);
  });

  return {
    TwilioVideo,
    TwilioVideoLocalView: (props: any) => {
      return _React.createElement('TwilioVideoLocalView', props);
    },
    TwilioVideoParticipantView: (props: any) => {
      return _React.createElement('TwilioVideoParticipantView', props);
    },
  };
});

describe('TwilioVideo', () => {
  const mockProps = {
    accessToken: 'test-access-token',
    roomName: 'test-room',
  };

  beforeEach(() => {
    capturedTwilioProps = {};
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    mockSetLocalVideoEnabled.mockReset();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<TwilioVideoComponent {...mockProps} />);

    expect(getByText('Connecting to video call...')).toBeTruthy();
  });

  it('renders connected state after connection', async () => {
    const onConnected = jest.fn();

    const { getByText } = render(<TwilioVideoComponent {...mockProps} onConnected={onConnected} />);

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Trigger the onRoomDidConnect callback
    await act(async () => {
      if (capturedTwilioProps.onRoomDidConnect) {
        capturedTwilioProps.onRoomDidConnect();
      }
    });

    // Verify callback was called
    await waitFor(() => {
      expect(onConnected).toHaveBeenCalled();
    });
  });

  it('renders audio-only mode when audioOnly prop is true', async () => {
    const { getByText } = render(<TwilioVideoComponent {...mockProps} audioOnly={true} />);

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Trigger the onRoomDidConnect callback
    await act(async () => {
      if (capturedTwilioProps.onRoomDidConnect) {
        capturedTwilioProps.onRoomDidConnect();
      }
    });

    // Wait for connected state and verify audio-only mode is displayed
    await waitFor(() => {
      expect(getByText('Audio Only Mode')).toBeTruthy();
    });
  });

  it('renders waiting state when no remote participants', async () => {
    const { getByText } = render(<TwilioVideoComponent {...mockProps} />);

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Trigger the onRoomDidConnect callback
    await act(async () => {
      if (capturedTwilioProps.onRoomDidConnect) {
        capturedTwilioProps.onRoomDidConnect();
      }
    });

    // Wait for connected state and verify waiting state is displayed
    await waitFor(() => {
      expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
    });
  });

  it('calls onError when connection fails', async () => {
    const onError = jest.fn();
    render(<TwilioVideoComponent {...mockProps} onError={onError} />);

    // Trigger the onRoomDidFailToConnect callback
    await act(async () => {
      if (capturedTwilioProps.onRoomDidFailToConnect) {
        capturedTwilioProps.onRoomDidFailToConnect({ error: 'Connection failed' });
      }
    });

    expect(onError).toHaveBeenCalled();
  });

  it('calls onDisconnected when component unmounts', async () => {
    const onDisconnected = jest.fn();

    const { unmount, getByText } = render(
      <TwilioVideoComponent {...mockProps} onDisconnected={onDisconnected} />
    );

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Trigger the onRoomDidConnect callback first
    await act(async () => {
      if (capturedTwilioProps.onRoomDidConnect) {
        capturedTwilioProps.onRoomDidConnect();
      }
    });

    // Wait for connected state
    await waitFor(() => {
      expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
    });

    // Unmount and check disconnect was called
    unmount();

    expect(onDisconnected).toHaveBeenCalled();
  });

  it('renders local video container when not in audio-only mode', async () => {
    const { getByText, queryByText } = render(
      <TwilioVideoComponent {...mockProps} audioOnly={false} />
    );

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Trigger the onRoomDidConnect callback
    await act(async () => {
      if (capturedTwilioProps.onRoomDidConnect) {
        capturedTwilioProps.onRoomDidConnect();
      }
    });

    // Wait for connected state
    await waitFor(() => {
      expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
    });

    // Local video should be visible (not audio-only mode)
    expect(queryByText('Audio Only Mode')).toBeNull();
  });
});
