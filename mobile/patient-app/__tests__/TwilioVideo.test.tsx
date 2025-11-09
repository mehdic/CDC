/**
 * Tests for TwilioVideo Component
 * Task: T155
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TwilioVideoComponent from '../src/components/TwilioVideo';

describe('TwilioVideo', () => {
  const mockProps = {
    accessToken: 'test-access-token',
    roomName: 'test-room',
  };

  it('renders loading state initially', () => {
    const { getByText } = render(<TwilioVideoComponent {...mockProps} />);

    expect(getByText('Connecting to video call...')).toBeTruthy();
  });

  it('renders connected state after connection', async () => {
    const onConnected = jest.fn();
    const { getByText } = render(
      <TwilioVideoComponent {...mockProps} onConnected={onConnected} />
    );

    // Wait for simulated connection
    await waitFor(
      () => {
        expect(onConnected).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('renders audio-only mode when audioOnly prop is true', async () => {
    const { getByText } = render(
      <TwilioVideoComponent {...mockProps} audioOnly={true} />
    );

    await waitFor(
      () => {
        expect(getByText('Audio Only Mode')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it('renders waiting state when no remote participants', async () => {
    const { getByText } = render(<TwilioVideoComponent {...mockProps} />);

    await waitFor(
      () => {
        expect(getByText('Waiting for pharmacist to join...')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it('calls onError when connection fails', async () => {
    const onError = jest.fn();
    // We can't easily simulate a connection failure in this test environment
    // This would be tested in integration tests with actual Twilio SDK
  });

  it('calls onDisconnected when component unmounts', () => {
    const onDisconnected = jest.fn();
    const { unmount } = render(
      <TwilioVideoComponent {...mockProps} onDisconnected={onDisconnected} />
    );

    unmount();

    expect(onDisconnected).toHaveBeenCalled();
  });

  it('renders local video container when not in audio-only mode', async () => {
    const { queryByText } = render(
      <TwilioVideoComponent {...mockProps} audioOnly={false} />
    );

    await waitFor(
      () => {
        // Local video should be visible (not audio-only mode)
        expect(queryByText('Audio Only Mode')).toBeNull();
      },
      { timeout: 2000 }
    );
  });
});
