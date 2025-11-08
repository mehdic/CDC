/**
 * Tests for RecordingConsent Component
 * Task: T158
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecordingConsent from '../src/components/RecordingConsent';

describe('RecordingConsent', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(getByText('Recording Consent')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <RecordingConsent
        visible={false}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(queryByText('Recording Consent')).toBeNull();
  });

  it('displays privacy information', () => {
    const { getByText, getAllByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(getByText(/Your Privacy Matters/i)).toBeTruthy();
    expect(getAllByText(/HIPAA/i).length).toBeGreaterThan(0);
    expect(getByText(/GDPR/i)).toBeTruthy();
    expect(getByText(/End-to-end encrypted/i)).toBeTruthy();
  });

  it('shows consent toggle', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(getByText(/I consent to this consultation being recorded/i)).toBeTruthy();
  });

  it('shows "Proceed Without Recording" button when canProceedWithoutConsent is true', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        canProceedWithoutConsent={true}
      />
    );

    expect(getByText('Proceed Without Recording')).toBeTruthy();
  });

  it('shows "Cancel Consultation" button when canProceedWithoutConsent is false', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        canProceedWithoutConsent={false}
      />
    );

    expect(getByText('Cancel Consultation')).toBeTruthy();
  });

  it('calls onAccept with false when proceeding without recording', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        canProceedWithoutConsent={true}
      />
    );

    fireEvent.press(getByText('Proceed Without Recording'));

    expect(mockOnAccept).toHaveBeenCalledWith(false);
  });

  it('calls onDecline when cancel button is pressed', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        canProceedWithoutConsent={false}
      />
    );

    fireEvent.press(getByText('Cancel Consultation'));

    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('button text changes based on consent toggle', () => {
    const { getByText } = render(
      <RecordingConsent
        visible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Default state (no consent)
    expect(getByText('Join Without Recording')).toBeTruthy();
  });
});
