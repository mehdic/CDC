/**
 * SpecialHandlingAlert Component Unit Tests
 * Comprehensive tests for special handling alerts
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { SpecialHandlingAlert, AlertType } from '../SpecialHandlingAlert';

describe('SpecialHandlingAlert Component', () => {
  const mockOnAcknowledge = jest.fn();

  const testCases: Array<{
    type: AlertType;
    details: string;
    expectedLabel: string;
    expectedIcon: string;
  }> = [
    {
      type: 'controlled_substance',
      details: 'Contains DEA-controlled medications',
      expectedLabel: 'Controlled Substance',
      expectedIcon: '⚠️',
    },
    {
      type: 'cold_chain',
      details: 'Must maintain 2-8°C temperature',
      expectedLabel: 'Cold Chain Required',
      expectedIcon: '❄️',
    },
    {
      type: 'fragile',
      details: 'Handle with care - fragile items',
      expectedLabel: 'Fragile Item',
      expectedIcon: '📦',
    },
    {
      type: 'signature_required',
      details: 'Signature required from recipient',
      expectedLabel: 'Signature Required',
      expectedIcon: '✍️',
    },
    {
      type: 'id_required',
      details: 'Age verification required (18+)',
      expectedLabel: 'ID Verification Required',
      expectedIcon: '🆔',
    },
    {
      type: 'time_sensitive',
      details: 'Must be delivered within time window',
      expectedLabel: 'Time-Sensitive Delivery',
      expectedIcon: '⏱️',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render alert container', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
        />
      );

      expect(getByTestId('special-handling-alert')).toBeTruthy();
    });

    testCases.forEach(({ type, details, expectedLabel, expectedIcon }) => {
      it(`should render ${type} alert with correct label and icon`, () => {
        const { getByTestId } = render(
          <SpecialHandlingAlert
            type={type}
            details={details}
            acknowledged={false}
            onAcknowledge={mockOnAcknowledge}
            testID={`alert-${type}`}
          />
        );

        const label = getByTestId(`alert-${type}-label`);
        expect(label.props.children).toBe(expectedLabel);

        const icon = getByTestId(`alert-${type}-icon`);
        expect(icon.props.children).toBe(expectedIcon);
      });

      it(`should render ${type} alert details`, () => {
        const { getByTestId } = render(
          <SpecialHandlingAlert
            type={type}
            details={details}
            acknowledged={false}
            onAcknowledge={mockOnAcknowledge}
            testID={`alert-${type}`}
          />
        );

        const detailsElement = getByTestId(`alert-${type}-details`);
        expect(detailsElement.props.children).toBe(details);
      });
    });

    it('should show critical severity badge for controlled substances', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="critical-alert"
        />
      );

      const badge = getByTestId('critical-alert-severity-badge');
      expect(badge).toBeTruthy();
    });

    it('should not show severity badge for non-critical types', () => {
      const { queryByTestId } = render(
        <SpecialHandlingAlert
          type="fragile"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="fragile-alert"
        />
      );

      const badge = queryByTestId('fragile-alert-severity-badge');
      expect(badge).toBeNull();
    });
  });

  describe('Acknowledged State', () => {
    it('should not show acknowledged badge when not acknowledged', () => {
      const { queryByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="cold-chain-alert"
        />
      );

      const badge = queryByTestId('cold-chain-alert-acknowledged-badge');
      expect(badge).toBeNull();
    });

    it('should show acknowledged badge when acknowledged', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Test details"
          acknowledged={true}
          onAcknowledge={mockOnAcknowledge}
          testID="cold-chain-alert"
        />
      );

      const badge = getByTestId('cold-chain-alert-acknowledged-badge');
      expect(badge).toBeTruthy();
      expect(badge.props.children.props.children).toBe('✓ Acknowledged');
    });

    it('should reduce opacity when acknowledged', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="signature_required"
          details="Test details"
          acknowledged={true}
          onAcknowledge={mockOnAcknowledge}
          testID="sig-alert"
        />
      );

      const container = getByTestId('sig-alert');
      expect(container.props.style[1].opacity).toBe(0.6);
    });

    it('should maintain full opacity when not acknowledged', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="signature_required"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="sig-alert"
        />
      );

      const container = getByTestId('sig-alert');
      expect(container.props.style[1].opacity).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="accessible-alert"
        />
      );

      const alert = getByTestId('accessible-alert');
      expect(alert.props.accessible).toBe(true);
      expect(alert.props.accessibilityRole).toBe('alert');
      expect(alert.props.accessibilityLiveRegion).toBe('assertive');
      expect(alert.props.accessibilityLabel).toBe('Controlled Substance alert');
    });

    it('should have accessibility hint with details', () => {
      const details = 'Important handling information';
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details={details}
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="accessible-alert"
        />
      );

      const alert = getByTestId('accessible-alert');
      expect(alert.props.accessibilityHint).toBe(details);
    });

    it('should have accessibility label for severity badge', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID="critical-alert"
        />
      );

      const badge = getByTestId('critical-alert-severity-badge');
      expect(badge.props.accessible).toBe(true);
      expect(badge.props.accessibilityLabel).toBe('Critical severity');
    });

    it('should announce acknowledgment state', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Test details"
          acknowledged={true}
          onAcknowledge={mockOnAcknowledge}
          testID="ack-alert"
        />
      );

      const badge = getByTestId('ack-alert-acknowledged-badge');
      expect(badge.props.accessible).toBe(true);
      expect(badge.props.accessibilityLabel).toBe(
        'This alert has been acknowledged'
      );
    });
  });

  describe('Custom TestID', () => {
    it('should use custom testID when provided', () => {
      const customTestID = 'my-custom-alert';
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="fragile"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
          testID={customTestID}
        />
      );

      expect(getByTestId(customTestID)).toBeTruthy();
    });

    it('should use default testID if not provided', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="fragile"
          details="Test details"
          acknowledged={false}
          onAcknowledge={mockOnAcknowledge}
        />
      );

      expect(getByTestId('special-handling-alert')).toBeTruthy();
    });
  });

  describe('All Alert Types', () => {
    testCases.forEach(({ type, details }) => {
      it(`should render and not crash for type ${type}`, () => {
        const { getByTestId } = render(
          <SpecialHandlingAlert
            type={type}
            details={details}
            acknowledged={false}
            onAcknowledge={mockOnAcknowledge}
            testID={`test-${type}`}
          />
        );

        expect(getByTestId(`test-${type}`)).toBeTruthy();
      });
    });
  });
});
