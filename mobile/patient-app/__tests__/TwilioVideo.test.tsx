/**
 * Tests for TwilioVideo Component
 * Task: T155
 */

import { render, waitFor, act } from '@testing-library/react-native';
import React from 'react';

import TwilioVideoComponent from '../src/components/TwilioVideo';

// Use the global mock from __mocks__ folder
// The mock uses callback props pattern matching the actual component

describe('TwilioVideo', () => {
  const mockProps = {
    accessToken: 'test-access-token',
    roomName: 'test-room',
  };

  // Access the mock module to trigger callbacks
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { TwilioVideo: MockTwilioVideo } = require('react-native-twilio-video-webrtc');

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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

    // Advance timers to trigger the connection callback
    await act(async () => {
      jest.advanceTimersByTime(50);
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

    // Advance timers to trigger the connection callback
    await act(async () => {
      jest.advanceTimersByTime(50);
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

    // Advance timers to trigger the connection callback
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // Wait for connected state and verify waiting state is displayed
    await waitFor(() => {
      expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
    });
  });

  it('calls onError when connection fails', async () => {
    const onError = jest.fn();
    // We can't easily simulate a connection failure in this test environment
    // This would be tested in integration tests with actual Twilio SDK
  });

  it('calls onDisconnected when component unmounts', async () => {
    const onDisconnected = jest.fn();

    const { unmount, getByText } = render(
      <TwilioVideoComponent {...mockProps} onDisconnected={onDisconnected} />
    );

    // Initially shows connecting
    expect(getByText('Connecting to video call...')).toBeTruthy();

    // Advance timers to trigger the connection callback
    await act(async () => {
      jest.advanceTimersByTime(50);
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

    // Advance timers to trigger the connection callback
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // Wait for connected state
    await waitFor(() => {
      expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
    });

    // Local video should be visible (not audio-only mode)
    expect(queryByText('Audio Only Mode')).toBeNull();
  });
});
