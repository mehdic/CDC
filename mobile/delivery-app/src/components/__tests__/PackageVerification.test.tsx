/**
 * Tests for PackageVerification Component
 * Covers success/failure states, package details display
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { PackageVerificationState, ScanVerificationResult } from '../../types/scanner';
import { PackageVerification } from '../PackageVerification';


describe('PackageVerification Component', () => {
  const mockOnRescan = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const mockVerificationResult: ScanVerificationResult = {
    valid: true,
    deliveryId: 'delivery-123',
    packageId: 'package-123',
    matchesDelivery: true,
    package: {
      id: 'package-123',
      deliveryId: 'delivery-123',
      medications: [
        { id: 'med-1', name: 'Aspirin', quantity: 30 },
        { id: 'med-2', name: 'Ibuprofen', quantity: 15 },
      ],
      specialHandling: ['cold_chain', 'signature_required'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Idle State', () => {
    it('should not render anything when status is idle', () => {
      const state: PackageVerificationState = {
        status: 'idle',
        isLoading: false,
      };

      const { toJSON } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(toJSON()).toBeNull();
    });

    it('should not render anything when status is scanning', () => {
      const state: PackageVerificationState = {
        status: 'scanning',
        isLoading: false,
      };

      const { toJSON } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator and message', () => {
      const state: PackageVerificationState = {
        status: 'verifying',
        isLoading: true,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Verifying package...')).toBeTruthy();
    });
  });

  describe('Success State', () => {
    it('should display success message and icon', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Package Verified')).toBeTruthy();
      expect(getByText('This package matches your delivery assignment')).toBeTruthy();
    });

    it('should display package details on success', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('4012000057147')).toBeTruthy();
      expect(getByText('package-123')).toBeTruthy();
    });

    it('should display medications list', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Medications (2)')).toBeTruthy();
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Ibuprofen')).toBeTruthy();
    });

    it('should display special handling requirements', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Special Handling')).toBeTruthy();
      expect(getByText('cold_chain')).toBeTruthy();
      expect(getByText('signature_required')).toBeTruthy();
    });

    it('should call onConfirm when confirm button pressed', async () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification
          state={state}
          onRescan={mockOnRescan}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = getByText('Confirm & Continue');
      fireEvent.press(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should call onRescan when rescan button pressed', async () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: mockVerificationResult,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      const rescanButton = getByText('Scan Different Package');
      fireEvent.press(rescanButton);

      expect(mockOnRescan).toHaveBeenCalled();
    });
  });

  describe('Failure State', () => {
    it('should display failure message and icon', () => {
      const failureResult: ScanVerificationResult = {
        valid: false,
        deliveryId: 'wrong-delivery',
        packageId: 'wrong-package',
        matchesDelivery: false,
        errors: ['Package does not match delivery'],
      };

      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: '4012000057147',
        result: failureResult,
        error: 'Package does not match delivery assignment',
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Verification Failed')).toBeTruthy();
      expect(getByText('Package does not match delivery assignment')).toBeTruthy();
    });

    it('should display scanned vs expected QR code mismatch', () => {
      const failureResult: ScanVerificationResult = {
        valid: true,
        deliveryId: 'delivery-123',
        packageId: 'wrong-package',
        expectedPackageId: 'expected-package',
        matchesDelivery: false,
      };

      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: 'scanned-code',
        result: failureResult,
        error: 'Package ID mismatch',
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Scanned QR Code')).toBeTruthy();
      expect(getByText('Expected Package ID')).toBeTruthy();
    });

    it('should display error details list', () => {
      const failureResult: ScanVerificationResult = {
        valid: false,
        deliveryId: 'delivery-123',
        packageId: 'package-123',
        matchesDelivery: false,
        errors: ['Package ID does not match', 'Different destination'],
      };

      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: '4012000057147',
        result: failureResult,
        error: 'Verification failed',
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Issues Found')).toBeTruthy();
      expect(getByText(/Package ID does not match/)).toBeTruthy();
      expect(getByText(/Different destination/)).toBeTruthy();
    });

    it('should call onRescan when scan again button pressed', () => {
      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: '4012000057147',
        error: 'Invalid package',
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      const rescanButton = getByText('Scan Again');
      fireEvent.press(rescanButton);

      expect(mockOnRescan).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button pressed', () => {
      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: '4012000057147',
        error: 'Invalid package',
      };

      const { getByText } = render(
        <PackageVerification
          state={state}
          onRescan={mockOnRescan}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing package details gracefully', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: {
          valid: true,
          deliveryId: 'delivery-123',
          packageId: 'package-123',
          matchesDelivery: true,
        },
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      // Should still show success message
      expect(getByText('Package Verified')).toBeTruthy();
    });

    it('should handle empty medications list', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: {
          valid: true,
          deliveryId: 'delivery-123',
          packageId: 'package-123',
          matchesDelivery: true,
          package: {
            id: 'package-123',
            deliveryId: 'delivery-123',
            medications: [],
            specialHandling: [],
          },
        },
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Package Verified')).toBeTruthy();
    });

    it('should handle missing error message in failure state', () => {
      const state: PackageVerificationState = {
        status: 'failed',
        isLoading: false,
        qrCode: '4012000057147',
        result: {
          valid: false,
          deliveryId: 'delivery-123',
          packageId: 'package-123',
          matchesDelivery: false,
        },
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Verification Failed')).toBeTruthy();
    });

    it('should handle null result in success state', () => {
      const state: PackageVerificationState = {
        status: 'verified',
        isLoading: false,
        qrCode: '4012000057147',
        result: undefined,
      };

      const { getByText } = render(
        <PackageVerification state={state} onRescan={mockOnRescan} />
      );

      expect(getByText('Package Verified')).toBeTruthy();
    });
  });
});
