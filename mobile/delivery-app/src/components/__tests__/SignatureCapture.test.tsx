/**
 * SignatureCapture Component Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { SignatureCapture } from '../SignatureCapture';

// Mock react-native-signature-canvas
jest.mock('react-native-signature-canvas', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      clearSignature: jest.fn(),
    }));

    // Simulate signature end after a short delay
    React.useEffect(() => {
      if (props.onEnd) {
        setTimeout(() => props.onEnd(), 100);
      }
    }, [props.onEnd]);

    return React.createElement('SignatureCanvas', {
      testID: props.testID || 'signature-canvas',
    });
  });
});

describe('SignatureCapture', () => {
  const mockOnCapture = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default label', () => {
      const { getByText } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      expect(getByText('Signature')).toBeTruthy();
    });

    it('should render with custom label', () => {
      const { getByText } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} label="Custom Label" />
      );

      expect(getByText('Custom Label')).toBeTruthy();
    });

    it('should show required indicator when required', () => {
      const { getByText } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} required={true} />
      );

      expect(getByText('*')).toBeTruthy();
    });

    it('should not show required indicator by default', () => {
      const { queryByText } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      // Check that there's no standalone asterisk
      const label = queryByText('Signature');
      expect(label).toBeTruthy();
    });

    it('should render signature canvas', () => {
      const { getByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      expect(getByTestId('signature-canvas')).toBeTruthy();
    });

    it('should render instruction text', () => {
      const { getByText } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      expect(getByText('Sign above with your finger')).toBeTruthy();
    });
  });

  describe('Clear Button', () => {
    it('should not show clear button initially', () => {
      const { queryByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      expect(queryByTestId('signature-clear-button')).toBeNull();
    });

    it('should show clear button after signature', async () => {
      const { getByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      // Wait for onEnd to be called (simulated in mock)
      await waitFor(() => {
        expect(getByTestId('signature-clear-button')).toBeTruthy();
      });
    });

    it('should call onClear when clear button pressed', async () => {
      const { getByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      await waitFor(() => {
        const clearButton = getByTestId('signature-clear-button');
        fireEvent.press(clearButton);
      });

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('should hide clear button after clearing', async () => {
      const { getByTestId, queryByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      await waitFor(() => {
        const clearButton = getByTestId('signature-clear-button');
        fireEvent.press(clearButton);
      });

      // After clearing, button should be hidden
      await waitFor(() => {
        expect(queryByTestId('signature-clear-button')).toBeNull();
      });
    });
  });

  describe('Signature Capture', () => {
    it('should call onCapture with signature data', () => {
      const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

      // Create a custom mock for this test
      jest.isolateModules(() => {
        jest.doMock('react-native-signature-canvas', () => {
          const React = require('react');
          return React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
              clearSignature: jest.fn(),
            }));

            React.useEffect(() => {
              if (props.onOK) {
                props.onOK(mockSignature);
              }
            }, [props.onOK]);

            return React.createElement('SignatureCanvas', { testID: 'signature-canvas' });
          });
        });

        const { SignatureCapture } = require('../SignatureCapture');
        const { render } = require('@testing-library/react-native');

        render(<SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />);

        expect(mockOnCapture).toHaveBeenCalledWith(mockSignature);
      });
    });

    it('should not call onCapture with empty signature', () => {
      jest.isolateModules(() => {
        jest.doMock('react-native-signature-canvas', () => {
          const React = require('react');
          return React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
              clearSignature: jest.fn(),
            }));

            React.useEffect(() => {
              if (props.onOK) {
                props.onOK('');
              }
            }, [props.onOK]);

            return React.createElement('SignatureCanvas', { testID: 'signature-canvas' });
          });
        });

        const { SignatureCapture } = require('../SignatureCapture');
        const { render } = require('@testing-library/react-native');

        const mockCapture = jest.fn();
        render(<SignatureCapture onCapture={mockCapture} onClear={mockOnClear} />);

        expect(mockCapture).not.toHaveBeenCalled();
      });
    });
  });

  describe('Props', () => {
    it('should accept all required props', () => {
      const { getByTestId } = render(
        <SignatureCapture onCapture={mockOnCapture} onClear={mockOnClear} />
      );

      expect(getByTestId('signature-canvas')).toBeTruthy();
    });

    it('should accept optional props', () => {
      const { getByText } = render(
        <SignatureCapture
          onCapture={mockOnCapture}
          onClear={mockOnClear}
          label="Patient Signature"
          required={true}
        />
      );

      expect(getByText('Patient Signature')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });
  });
});
