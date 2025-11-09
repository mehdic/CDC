/**
 * Tests for VideoControls Component
 * Task: T156
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VideoControls from '../src/components/VideoControls';

describe('VideoControls', () => {
  const mockProps = {
    audioEnabled: true,
    videoEnabled: true,
    audioOnly: false,
    onToggleAudio: jest.fn(),
    onToggleVideo: jest.fn(),
    onSwitchToAudioOnly: jest.fn(),
    onSwitchToVideo: jest.fn(),
    onEndCall: jest.fn(),
  };

  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Alert.alert
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders all control buttons', () => {
    const { getByText } = render(<VideoControls {...mockProps} />);

    expect(getByText('Mute')).toBeTruthy();
    expect(getByText('Video On')).toBeTruthy();
    expect(getByText('Audio Only')).toBeTruthy();
    expect(getByText('End Call')).toBeTruthy();
  });

  it('shows "Unmute" when audio is disabled', () => {
    const { getByText } = render(
      <VideoControls {...mockProps} audioEnabled={false} />
    );

    expect(getByText('Unmute')).toBeTruthy();
  });

  it('shows "Video Off" when video is disabled', () => {
    const { getByText } = render(
      <VideoControls {...mockProps} videoEnabled={false} />
    );

    expect(getByText('Video Off')).toBeTruthy();
  });

  it('calls onToggleAudio when audio button is pressed', () => {
    const { getByText } = render(<VideoControls {...mockProps} />);

    fireEvent.press(getByText('Mute'));

    expect(mockProps.onToggleAudio).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleVideo when video button is pressed', () => {
    const { getByText } = render(<VideoControls {...mockProps} />);

    fireEvent.press(getByText('Video On'));

    expect(mockProps.onToggleVideo).toHaveBeenCalledTimes(1);
  });

  it('shows alert when end call button is pressed', () => {
    const { getByText } = render(<VideoControls {...mockProps} />);

    fireEvent.press(getByText('End Call'));

    expect(alertSpy).toHaveBeenCalledWith(
      'End Call',
      'Are you sure you want to end this consultation?',
      expect.any(Array)
    );
  });

  it('hides video control when in audio-only mode', () => {
    const { queryByText } = render(
      <VideoControls {...mockProps} audioOnly={true} />
    );

    expect(queryByText('Video On')).toBeNull();
    expect(queryByText('Video Off')).toBeNull();
  });

  it('shows "Enable Video" when in audio-only mode', () => {
    const { getByText } = render(
      <VideoControls {...mockProps} audioOnly={true} />
    );

    expect(getByText('Enable Video')).toBeTruthy();
  });

  it('shows confirmation alert when switching to audio-only', () => {
    const { getByText } = render(<VideoControls {...mockProps} />);

    fireEvent.press(getByText('Audio Only'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Audio Only Mode',
      expect.stringContaining('save data'),
      expect.any(Array)
    );
  });
});
