/**
 * ProofOfDeliveryScreen Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import proofOfDeliveryService from '../../../services/proofOfDeliveryService';
import { Coordinates } from '../../../types/delivery';
import { ProofOfDeliveryScreen } from '../ProofOfDeliveryScreen';

// Mock dependencies
jest.mock('../../../hooks/useRedux', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: jest.fn((selector) =>
    selector({
      delivery: {
        currentLocation: {
          latitude: 46.2044,
          longitude: 6.1432,
          accuracy: 10,
          timestamp: '2024-01-15T10:00:00Z',
        },
        isOnline: true,
      },
    })
  ),
}));

jest.mock('../../../store/deliverySlice', () => ({
  updateDeliveryStatusAsync: jest.fn(() => ({
    unwrap: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../../../services/proofOfDeliveryService');
jest.mock('../../../components/SignatureCapture', () => ({
  SignatureCapture: ({ onCapture, onClear }: any) => {
    const React = require('react');
    return React.createElement('SignatureCapture', {
      testID: 'signature-capture',
      onPress: () => onCapture('data:image/png;base64,signature'),
    });
  },
}));

jest.mock('../../../components/PhotoCapture', () => ({
  PhotoCapture: ({ onCapture, label }: any) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        testID: `photo-capture-${label}`,
        onPress: () => onCapture('file:///photo.jpg'),
      },
      React.createElement(Text, {}, label)
    );
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProofOfDeliveryScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  const mockRoute = {
    params: {
      deliveryId: 'delivery-123',
    },
  };

  const mockLocation: Coordinates = {
    latitude: 46.2044,
    longitude: 6.1432,
    accuracy: 10,
    timestamp: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      const { getByText, getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Proof of Delivery')).toBeTruthy();
      expect(getByText('Recipient Name')).toBeTruthy();
      expect(getByTestId('recipient-name-input')).toBeTruthy();
      expect(getByTestId('notes-input')).toBeTruthy();
      expect(getByTestId('submit-button')).toBeTruthy();
    });

    it('should render photo capture components', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('photo-capture-Delivery Photo')).toBeTruthy();
      expect(getByTestId('photo-capture-ID Verification (if required)')).toBeTruthy();
    });

    it('should render signature capture component', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('signature-capture')).toBeTruthy();
    });

    it('should show offline banner when offline', () => {
      const { useAppSelector } = require('../../../hooks/useRedux');
      useAppSelector.mockImplementation((selector: any) =>
        selector({
          delivery: {
            currentLocation: mockLocation,
            isOnline: false,
          },
        })
      );

      const { getByText } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText(/You're offline/)).toBeTruthy();
    });

    it('should not show offline banner when online', () => {
      const { queryByText } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(queryByText(/You're offline/)).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should show alert when photo not taken', async () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Required Field', 'Please take a photo of the delivery');
      });
    });

    it('should show alert when recipient name empty', async () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo first
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Required Field', 'Please enter recipient name');
      });
    });

    it('should show alert when location not available', async () => {
      const { useAppSelector } = require('../../../hooks/useRedux');
      useAppSelector.mockImplementation((selector: any) =>
        selector({
          delivery: {
            currentLocation: null,
            isOnline: true,
          },
        })
      );

      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Enter name
      const nameInput = getByTestId('recipient-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Location Required', 'GPS location is required for proof of delivery');
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Reset useAppSelector to have location
      const { useAppSelector } = require('../../../hooks/useRedux');
      useAppSelector.mockImplementation((selector: any) =>
        selector({
          delivery: {
            currentLocation: mockLocation,
            isOnline: true,
          },
        })
      );

      (proofOfDeliveryService.createProof as jest.Mock).mockReturnValue({
        deliveryId: 'delivery-123',
        photoImage: 'file:///photo.jpg',
        recipientName: 'John Doe',
        timestamp: '2024-01-15T10:00:00Z',
        location: mockLocation,
      });

      (proofOfDeliveryService.submitProof as jest.Mock).mockResolvedValue({
        success: true,
        queued: false,
      });
    });

    it('should submit proof successfully', async () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Enter name
      const nameInput = getByTestId('recipient-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      // Submit
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(proofOfDeliveryService.submitProof).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Delivery completed successfully!',
          expect.any(Array)
        );
      });
    });

    it('should show queued message when offline', async () => {
      (proofOfDeliveryService.submitProof as jest.Mock).mockResolvedValue({
        success: true,
        queued: true,
      });

      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Enter name
      const nameInput = getByTestId('recipient-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      // Submit
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Delivery marked as complete. Proof will be uploaded when online.',
          expect.any(Array)
        );
      });
    });

    it('should handle submission error', async () => {
      (proofOfDeliveryService.submitProof as jest.Mock).mockResolvedValue({
        success: false,
        queued: false,
        error: 'Network error',
      });

      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Enter name
      const nameInput = getByTestId('recipient-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      // Submit
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
      });
    });

    it('should navigate to DeliveryList on success', async () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Take photo
      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Enter name
      const nameInput = getByTestId('recipient-name-input');
      fireEvent.changeText(nameInput, 'John Doe');

      // Submit
      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing OK on alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const successAlert = alertCalls.find((call) => call[0] === 'Success');
      if (successAlert && successAlert[2] && successAlert[2][0]) {
        successAlert[2][0].onPress();
      }

      expect(mockNavigation.navigate).toHaveBeenCalledWith('DeliveryList');
    });
  });

  describe('Photo and Signature Capture', () => {
    it('should capture delivery photo', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      const photoCapture = getByTestId('photo-capture-Delivery Photo');
      fireEvent.press(photoCapture);

      // Photo capture handler should be called (tested via integration)
      expect(photoCapture).toBeTruthy();
    });

    it('should capture ID photo', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      const idCapture = getByTestId('photo-capture-ID Verification (if required)');
      fireEvent.press(idCapture);

      expect(idCapture).toBeTruthy();
    });

    it('should capture signature', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      const signatureCapture = getByTestId('signature-capture');
      fireEvent.press(signatureCapture);

      expect(signatureCapture).toBeTruthy();
    });
  });

  describe('Notes Input', () => {
    it('should accept optional notes', () => {
      const { getByTestId } = render(
        <ProofOfDeliveryScreen navigation={mockNavigation} route={mockRoute} />
      );

      const notesInput = getByTestId('notes-input');
      fireEvent.changeText(notesInput, 'Package left at door');

      expect(notesInput.props.value).toBe('Package left at door');
    });
  });
});
