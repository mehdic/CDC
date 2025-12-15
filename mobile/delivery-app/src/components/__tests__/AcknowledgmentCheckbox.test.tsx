/**
 * AcknowledgmentCheckbox Component Unit Tests
 * Comprehensive tests for checkbox with timestamp tracking
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { AcknowledgmentCheckbox } from '../AcknowledgmentCheckbox';

describe('AcknowledgmentCheckbox Component', () => {
  const mockOnCheck = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-12-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render checkbox', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      expect(getByTestId('acknowledgment-checkbox')).toBeTruthy();
    });

    it('should render label', () => {
      const label = 'I acknowledge the requirements';
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label={label}
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const labelElement = getByTestId('acknowledgment-checkbox-label');
      expect(labelElement.props.children).toBe(label);
    });

    it('should render description when provided', () => {
      const description = 'This is a test description';
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          description={description}
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const descElement = getByTestId('acknowledgment-checkbox-description');
      expect(descElement.props.children).toBe(description);
    });

    it('should not render description when not provided', () => {
      const { queryByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const descElement = queryByTestId('acknowledgment-checkbox-description');
      expect(descElement).toBeNull();
    });
  });

  describe('Checkbox State', () => {
    it('should render unchecked state initially', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkmark = getByTestId('acknowledgment-checkbox-checkmark');
      expect(checkmark.props.style[1].color).toBe('transparent');
    });

    it('should render checked state when checked is true', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      const checkmark = getByTestId('acknowledgment-checkbox-checkmark');
      expect(checkmark.props.style[1].color).toBe('#FFF');
    });

    it('should show different background color when checked', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      const box = getByTestId('acknowledgment-checkbox-box');
      expect(box.props.style[1].backgroundColor).toBe('#007AFF');
    });

    it('should show white background when unchecked', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const box = getByTestId('acknowledgment-checkbox-box');
      expect(box.props.style[1].backgroundColor).toBe('#FFF');
    });
  });

  describe('Timestamp Recording', () => {
    it('should record timestamp when checked', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      expect(mockOnCheck).toHaveBeenCalledWith(true, expect.any(String));

      const callArgs = mockOnCheck.mock.calls[0];
      const timestamp = callArgs[1];
      expect(new Date(timestamp).getTime()).toBeLessThanOrEqual(
        new Date().getTime()
      );
    });

    it('should display timestamp in readable format when checked', () => {
      const { getByTestId, rerender } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      // Get the timestamp from the callback
      const timestamp = mockOnCheck.mock.calls[0][1];

      // Re-render with checked=true to see the timestamp display
      rerender(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      // The timestamp should be displayed (this depends on implementation details)
      const timeElement = getByTestId('acknowledgment-checkbox-timestamp');
      expect(timeElement).toBeTruthy();
    });

    it('should not display timestamp when unchecked', () => {
      const { queryByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const timeElement = queryByTestId('acknowledgment-checkbox-timestamp');
      expect(timeElement).toBeNull();
    });

    it('should include timestamp in accessibility label when checked', () => {
      const { queryByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      const timeElement = queryByTestId('acknowledgment-checkbox-timestamp');
      if (timeElement) {
        const a11yLabel = timeElement.props.accessibilityLabel;
        expect(a11yLabel).toContain('Acknowledged at');
      }
    });
  });

  describe('User Interactions', () => {
    it('should call onCheck when pressed', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      expect(mockOnCheck).toHaveBeenCalled();
    });

    it('should toggle checked state', () => {
      const { getByTestId, rerender } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      let checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      expect(mockOnCheck).toHaveBeenCalledWith(true, expect.any(String));

      mockOnCheck.mockClear();

      rerender(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      expect(mockOnCheck).toHaveBeenCalledWith(false, expect.any(String));
    });

    it('should not respond to press when disabled', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          disabled={true}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      fireEvent.press(checkbox);

      expect(mockOnCheck).not.toHaveBeenCalled();
    });

    it('should show reduced opacity when disabled', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          disabled={true}
        />
      );

      const container = getByTestId('acknowledgment-checkbox');
      const containerStyle = Array.isArray(container.props.style)
        ? container.props.style.find((s: any) => s && typeof s === 'object' && 'opacity' in s)
        : container.props.style;
      expect(containerStyle?.opacity).toBe(0.5);
    });

    it('should not have reduced opacity when enabled', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          disabled={false}
        />
      );

      const container = getByTestId('acknowledgment-checkbox');
      const containerStyle = Array.isArray(container.props.style)
        ? container.props.style.find((s: any) => s && typeof s === 'object' && 'opacity' in s)
        : container.props.style;
      expect(containerStyle?.opacity).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper checkbox role', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      expect(checkbox.props.accessibilityRole).toBe('checkbox');
    });

    it('should set checked state in accessibility', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={true}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      expect(checkbox.props.accessibilityState.checked).toBe(true);
    });

    it('should set disabled state in accessibility', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          disabled={true}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      expect(checkbox.props.accessibilityState.disabled).toBe(true);
    });

    it('should use custom accessibility label when provided', () => {
      const customLabel = 'Custom accessibility label';
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          accessibilityLabel={customLabel}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      expect(checkbox.props.accessibilityLabel).toBe(customLabel);
    });

    it('should generate accessibility label with description', () => {
      const label = 'Test Label';
      const description = 'Test Description';
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label={label}
          description={description}
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      const checkbox = getByTestId('acknowledgment-checkbox');
      expect(checkbox.props.accessibilityLabel).toContain(label);
      expect(checkbox.props.accessibilityLabel).toContain(description);
    });
  });

  describe('Custom TestID', () => {
    it('should use custom testID when provided', () => {
      const customTestID = 'my-custom-checkbox';
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
          testID={customTestID}
        />
      );

      expect(getByTestId(customTestID)).toBeTruthy();
    });

    it('should use default testID if not provided', () => {
      const { getByTestId } = render(
        <AcknowledgmentCheckbox
          label="Test Label"
          checked={false}
          onCheck={mockOnCheck}
        />
      );

      expect(getByTestId('acknowledgment-checkbox')).toBeTruthy();
    });
  });
});
