/**
 * SpecialHandlingAlert Component Integration Tests
 * Tests alert display with realistic scenarios and accessibility features
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { SpecialHandlingAlert, AlertType } from '../SpecialHandlingAlert';

describe('SpecialHandlingAlert Integration Tests', () => {
  /**
   * Integration test: Controlled substance alert workflow
   */
  describe('Workflow: Controlled Substance Alert Display', () => {
    it('should display controlled substance alert with critical badge', () => {
      const { getByTestId, getByText } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="This package contains DEA-controlled medications (Schedule II). Age verification and photo ID verification required at delivery. Signature from recipient required."
          acknowledged={false}
          testID="cs-alert"
        />
      );

      // Alert container should exist
      const alert = getByTestId('cs-alert');
      expect(alert).toBeTruthy();

      // Should display with correct label
      const label = getByTestId('cs-alert-label');
      expect(label.props.children).toBe('Controlled Substance');

      // Should have critical severity badge
      const badge = getByTestId('cs-alert-severity-badge');
      expect(badge).toBeTruthy();

      // Details should include handling instructions
      const details = getByTestId('cs-alert-details');
      expect(details.props.children).toContain('DEA-controlled');
    });

    it('should reduce opacity when acknowledged to indicate secondary status', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Controlled substance handling required"
          acknowledged={true}
          testID="cs-ack-alert"
        />
      );

      const alert = getByTestId('cs-ack-alert');
      // When acknowledged, opacity should be reduced
      expect(alert.props.style[1].opacity).toBe(0.6);

      // Should show acknowledgment badge
      const ackBadge = getByTestId('cs-ack-alert-acknowledged-badge');
      expect(ackBadge).toBeTruthy();
      expect(ackBadge.props.children.props.children).toBe('✓ Acknowledged');
    });
  });

  /**
   * Integration test: Cold chain alert workflow
   */
  describe('Workflow: Cold Chain Alert Display', () => {
    it('should display cold chain alert with temperature requirements', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Maintain temperature at 2-8°C throughout delivery. Monitor temperature logs. Report any excursions immediately to pharmacy."
          acknowledged={false}
          testID="cc-alert"
        />
      );

      // Alert container should exist
      const alert = getByTestId('cc-alert');
      expect(alert).toBeTruthy();

      // Should display with correct label
      const label = getByTestId('cc-alert-label');
      expect(label.props.children).toBe('Cold Chain Required');

      // Should have correct icon
      const icon = getByTestId('cc-alert-icon');
      expect(icon.props.children).toBe('❄️');

      // Details should include temperature requirements
      const details = getByTestId('cc-alert-details');
      expect(details.props.children).toContain('2-8°C');
    });

    it('should show acknowledgment progress for cold chain items', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Maintain temperature at 2-8°C throughout delivery"
          acknowledged={true}
          testID="cc-ack-alert"
        />
      );

      // Should show acknowledged state
      const ackBadge = getByTestId('cc-ack-alert-acknowledged-badge');
      expect(ackBadge).toBeTruthy();

      // Should have reduced opacity indicating acknowledgment
      const alert = getByTestId('cc-ack-alert');
      expect(alert.props.style[1].opacity).toBe(0.6);
    });
  });

  /**
   * Integration test: Multiple alert types in sequence
   */
  describe('Workflow: Multiple Alert Types Display', () => {
    const alertScenarios = [
      {
        type: 'controlled_substance' as AlertType,
        expectedLabel: 'Controlled Substance',
        hasCriticalBadge: true,
      },
      {
        type: 'cold_chain' as AlertType,
        expectedLabel: 'Cold Chain Required',
        hasCriticalBadge: false,
      },
      {
        type: 'signature_required' as AlertType,
        expectedLabel: 'Signature Required',
        hasCriticalBadge: false,
      },
      {
        type: 'id_required' as AlertType,
        expectedLabel: 'ID Verification Required',
        hasCriticalBadge: false,
      },
      {
        type: 'fragile' as AlertType,
        expectedLabel: 'Fragile Item',
        hasCriticalBadge: false,
      },
      {
        type: 'time_sensitive' as AlertType,
        expectedLabel: 'Time-Sensitive Delivery',
        hasCriticalBadge: false,
      },
    ];

    alertScenarios.forEach(({ type, expectedLabel, hasCriticalBadge }) => {
      it(`should display ${type} alert correctly`, () => {
        const { getByTestId, queryByTestId } = render(
          <SpecialHandlingAlert
            type={type}
            details={`Details for ${type}`}
            acknowledged={false}
            testID={`alert-${type}`}
          />
        );

        // Label should match
        const label = getByTestId(`alert-${type}-label`);
        expect(label.props.children).toBe(expectedLabel);

        // Severity badge should appear only for critical types
        const badge = queryByTestId(`alert-${type}-severity-badge`);
        if (hasCriticalBadge) {
          expect(badge).toBeTruthy();
        } else {
          expect(badge).toBeNull();
        }

        // Details should be displayed
        const details = getByTestId(`alert-${type}-details`);
        expect(details.props.children).toContain('Details');
      });
    });
  });

  /**
   * Integration test: Accessibility features
   */
  describe('Workflow: Accessibility Features', () => {
    it('should provide comprehensive accessibility for controlled substance alert', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Contains controlled medications requiring special handling"
          acknowledged={false}
          testID="accessible-cs"
        />
      );

      const alert = getByTestId('accessible-cs');

      // Should be marked as alert role
      expect(alert.props.accessibilityRole).toBe('alert');

      // Should be marked as assertive live region
      expect(alert.props.accessibilityLiveRegion).toBe('assertive');

      // Should have descriptive label
      expect(alert.props.accessibilityLabel).toBe('Controlled Substance alert');

      // Should have hint with details
      expect(alert.props.accessibilityHint).toContain('controlled medications');
    });

    it('should announce severity for critical alerts', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Critical handling required"
          acknowledged={false}
          testID="critical-accessible"
        />
      );

      const badge = getByTestId('critical-accessible-severity-badge');
      expect(badge.props.accessible).toBe(true);
      expect(badge.props.accessibilityLabel).toBe('Critical severity');
    });

    it('should announce acknowledgment state for accessibility', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Cold chain maintenance required"
          acknowledged={true}
          testID="ack-accessible"
        />
      );

      const ackBadge = getByTestId('ack-accessible-acknowledged-badge');
      expect(ackBadge.props.accessible).toBe(true);
      expect(ackBadge.props.accessibilityLabel).toBe(
        'This alert has been acknowledged'
      );
    });
  });

  /**
   * Integration test: Real-world pharmacy scenarios
   */
  describe('Workflow: Real-World Pharmacy Scenarios', () => {
    it('should handle insulin delivery alert (cold chain + time-sensitive)', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Insulin Glargine 100 units/mL. Requires continuous 2-8°C refrigeration. Do not freeze. Administer within 30 minutes of removal from cold storage if temperature exceeds 8°C."
          acknowledged={false}
          testID="insulin-alert"
        />
      );

      const alert = getByTestId('insulin-alert');
      expect(alert).toBeTruthy();

      const details = getByTestId('insulin-alert-details');
      expect(details.props.children).toContain('Insulin');
      expect(details.props.children).toContain('2-8°C');
      expect(details.props.children).toContain('refrigeration');
    });

    it('should handle opioid medication alert (controlled substance + verification)', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="OxyContin (Oxycodone) 30mg. Schedule II controlled substance. Requires patient photo ID verification (18+ years), signature, and confirmation of patient identity. Document ID type and number."
          acknowledged={false}
          testID="opioid-alert"
        />
      );

      const alert = getByTestId('opioid-alert');
      const badge = getByTestId('opioid-alert-severity-badge');
      expect(badge).toBeTruthy();

      const details = getByTestId('opioid-alert-details');
      expect(details.props.children).toContain('OxyContin');
      expect(details.props.children).toContain('Schedule II');
    });

    it('should show progress when alert is acknowledged in workflow', () => {
      const { getByTestId, queryByTestId, rerender } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Controlled medication requiring acknowledgment"
          acknowledged={false}
          testID="workflow-alert"
        />
      );

      // Initially not acknowledged - badge should not exist
      expect(
        queryByTestId('workflow-alert-acknowledged-badge')
      ).toBeNull();

      // Rerender with acknowledged status
      rerender(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Controlled medication requiring acknowledgment"
          acknowledged={true}
          testID="workflow-alert"
        />
      );

      // Should show acknowledgment badge
      const ackBadge = getByTestId('workflow-alert-acknowledged-badge');
      expect(ackBadge).toBeTruthy();
      expect(ackBadge.props.children.props.children).toBe('✓ Acknowledged');
    });
  });

  /**
   * Integration test: Visual hierarchy and emphasis
   */
  describe('Workflow: Visual Hierarchy and Emphasis', () => {
    it('should emphasize critical alerts with red border and badge', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Critical alert test"
          acknowledged={false}
          testID="critical-visual"
        />
      );

      const alert = getByTestId('critical-visual');

      // Should have red border (critical severity)
      const borderColor = alert.props.style[1].borderLeftColor;
      expect(borderColor).toBe('#DC3545'); // Red color code

      // Should have critical badge
      const badge = getByTestId('critical-visual-severity-badge');
      expect(badge).toBeTruthy();

      // Badge background should be red (check the style prop which is an array)
      const badgeStyle = badge.props.style;
      const backgroundColor = Array.isArray(badgeStyle)
        ? badgeStyle.find((s: any) => s && s.backgroundColor)?.backgroundColor
        : badgeStyle.backgroundColor;
      expect(backgroundColor).toBe('#DC3545');
    });

    it('should display cold chain with blue accent color', () => {
      const { getByTestId } = render(
        <SpecialHandlingAlert
          type="cold_chain"
          details="Cold chain test"
          acknowledged={false}
          testID="blue-visual"
        />
      );

      const alert = getByTestId('blue-visual');

      // Should have blue border
      const borderColor = alert.props.style[1].borderLeftColor;
      expect(borderColor).toBe('#1976D2'); // Blue color code

      // Icon should be ice emoji
      const icon = getByTestId('blue-visual-icon');
      expect(icon.props.children).toBe('❄️');
    });

    it('should reduce visibility of acknowledged alerts', () => {
      const { getByTestId: getByTestIdBefore } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test"
          acknowledged={false}
          testID="opacity-test"
        />
      );

      const alertBefore = getByTestIdBefore('opacity-test');
      expect(alertBefore.props.style[1].opacity).toBe(1);

      const { getByTestId: getByTestIdAfter } = render(
        <SpecialHandlingAlert
          type="controlled_substance"
          details="Test"
          acknowledged={true}
          testID="opacity-test"
        />
      );

      const alertAfter = getByTestIdAfter('opacity-test');
      expect(alertAfter.props.style[1].opacity).toBe(0.6);
    });
  });

  /**
   * Integration test: Complete delivery alert set
   */
  describe('Workflow: Complete Delivery Alert Set', () => {
    it('should render all required alerts for complex delivery', () => {
      const alertTypes: AlertType[] = [
        'controlled_substance',
        'cold_chain',
        'id_required',
        'signature_required',
      ];

      const { getByTestId } = render(
        <React.Fragment>
          {alertTypes.map((type, idx) => (
            <SpecialHandlingAlert
              key={type}
              type={type}
              details={`Details for ${type}`}
              acknowledged={idx % 2 === 0} // Alternate acknowledged state
              testID={`complex-alert-${idx}`}
            />
          ))}
        </React.Fragment>
      );

      // All alerts should render
      alertTypes.forEach((_, idx) => {
        const alert = getByTestId(`complex-alert-${idx}`);
        expect(alert).toBeTruthy();
      });
    });
  });
});
