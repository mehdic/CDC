/**
 * PackageInfo Component Unit Tests
 * Comprehensive tests for collapsible package info component
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { DeliveryPackage } from '../../types/delivery';
import { PackageInfo } from '../PackageInfo';

describe('PackageInfo Component', () => {
  // Mock package data
  const mockPackage: DeliveryPackage = {
    id: 'PKG001',
    qrCode: 'QR123456',
    medications: [
      {
        id: 'MED001',
        name: 'Aspirin',
        quantity: 1,
        dosage: '500mg',
        requiresColdChain: false,
        isControlledSubstance: false,
      },
      {
        id: 'MED002',
        name: 'Amoxicillin',
        quantity: 2,
        dosage: '250mg',
        requiresColdChain: false,
        isControlledSubstance: false,
      },
    ],
    specialHandling: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render package info', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      expect(getByTestId('package-info')).toBeTruthy();
    });

    it('should render package title', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const title = getByTestId('package-info-title');
      expect(title.props.children).toEqual(['Package ', 1]);
    });

    it('should render package title for second package', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={1} />);

      const title = getByTestId('package-info-title');
      expect(title.props.children).toEqual(['Package ', 2]);
    });

    it('should render QR code', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const qrCode = getByTestId('package-info-qr-code');
      expect(qrCode.props.children).toEqual(['QR: ', 'QR123456']);
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} testID="custom-package" />
      );

      expect(getByTestId('custom-package')).toBeTruthy();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should start collapsed by default', () => {
      const { queryByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      expect(queryByTestId('package-info-medications')).toBeNull();
    });

    it('should expand when header is pressed', () => {
      const { getByTestId, queryByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} />
      );

      expect(queryByTestId('package-info-medications')).toBeNull();

      fireEvent.press(getByTestId('package-info-header'));

      expect(getByTestId('package-info-medications')).toBeTruthy();
    });

    it('should collapse when header is pressed again', () => {
      const { getByTestId, queryByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} />
      );

      fireEvent.press(getByTestId('package-info-header'));
      expect(getByTestId('package-info-medications')).toBeTruthy();

      fireEvent.press(getByTestId('package-info-header'));
      expect(queryByTestId('package-info-medications')).toBeNull();
    });

    it('should toggle expand icon', () => {
      const { getByTestId, queryByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      // Initially collapsed - medications should not be visible
      expect(queryByTestId('package-info-medications')).toBeNull();

      // After pressing, should expand - medications should be visible
      fireEvent.press(getByTestId('package-info-header'));
      expect(getByTestId('package-info-medications')).toBeTruthy();
    });

    it('should support controlled expansion', () => {
      const mockOnToggle = jest.fn();
      const { getByTestId } = render(
        <PackageInfo
          package={mockPackage}
          packageIndex={0}
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      expect(getByTestId('package-info-medications')).toBeTruthy();
    });

    it('should call onToggle when controlled', () => {
      const mockOnToggle = jest.fn();
      const { getByTestId } = render(
        <PackageInfo
          package={mockPackage}
          packageIndex={0}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      fireEvent.press(getByTestId('package-info-header'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should not auto-expand when controlled', () => {
      const mockOnToggle = jest.fn();
      const { queryByTestId, getByTestId } = render(
        <PackageInfo
          package={mockPackage}
          packageIndex={0}
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      fireEvent.press(getByTestId('package-info-header'));
      // Should still be collapsed because isExpanded=false
      expect(queryByTestId('package-info-medications')).toBeNull();
    });
  });

  describe('Special Handling', () => {
    it('should render special handling when present', () => {
      const packageWithHandling = {
        ...mockPackage,
        specialHandling: ['cold_chain', 'signature_required'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithHandling} packageIndex={0} />
      );

      expect(getByTestId('package-info-special-handling')).toBeTruthy();
    });

    it('should not render special handling when empty', () => {
      const { queryByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      expect(queryByTestId('package-info-special-handling')).toBeNull();
    });

    it('should render cold chain badge', () => {
      const packageWithColdChain = {
        ...mockPackage,
        specialHandling: ['cold_chain'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithColdChain} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-cold_chain')).toBeTruthy();
    });

    it('should render narcotics badge', () => {
      const packageWithNarcotics = {
        ...mockPackage,
        specialHandling: ['narcotics'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithNarcotics} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-narcotics')).toBeTruthy();
    });

    it('should render signature required badge', () => {
      const packageWithSignature = {
        ...mockPackage,
        specialHandling: ['signature_required'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithSignature} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-signature_required')).toBeTruthy();
    });

    it('should render ID verification badge', () => {
      const packageWithIDVerif = {
        ...mockPackage,
        specialHandling: ['id_verification'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithIDVerif} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-id_verification')).toBeTruthy();
    });

    it('should render time sensitive badge', () => {
      const packageWithTimeSensitive = {
        ...mockPackage,
        specialHandling: ['time_sensitive'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithTimeSensitive} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-time_sensitive')).toBeTruthy();
    });

    it('should render multiple special handling badges', () => {
      const packageWithMultiple = {
        ...mockPackage,
        specialHandling: ['cold_chain', 'narcotics', 'signature_required'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithMultiple} packageIndex={0} />
      );

      expect(getByTestId('package-info-handling-cold_chain')).toBeTruthy();
      expect(getByTestId('package-info-handling-narcotics')).toBeTruthy();
      expect(getByTestId('package-info-handling-signature_required')).toBeTruthy();
    });

    it('should display correct icon for cold chain', () => {
      const packageWithColdChain = {
        ...mockPackage,
        specialHandling: ['cold_chain'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithColdChain} packageIndex={0} />
      );

      const badge = getByTestId('package-info-handling-cold_chain');
      expect(badge.props.children.props.children).toContain('❄️');
    });

    it('should display correct icon for narcotics', () => {
      const packageWithNarcotics = {
        ...mockPackage,
        specialHandling: ['narcotics'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithNarcotics} packageIndex={0} />
      );

      const badge = getByTestId('package-info-handling-narcotics');
      expect(badge.props.children.props.children).toContain('⚠️');
    });
  });

  describe('Medications List', () => {
    it('should render medications when expanded', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medications')).toBeTruthy();
    });

    it('should render medication count', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const title = getByTestId('package-info-medications-title');
      expect(title.props.children).toEqual(['Medications (', 2, '):']);
    });

    it('should render first medication', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medication-0')).toBeTruthy();
    });

    it('should render medication name', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const name = getByTestId('package-info-medication-0-name');
      expect(name.props.children).toBe('Aspirin');
    });

    it('should render medication details', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const details = getByTestId('package-info-medication-0-details');
      expect(details.props.children).toEqual([1, 'x - ', '500mg']);
    });

    it('should render controlled substance warning', () => {
      const packageWithControlled = {
        ...mockPackage,
        medications: [
          {
            ...mockPackage.medications[0],
            isControlledSubstance: true,
          },
        ],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithControlled} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medication-0-controlled')).toBeTruthy();
    });

    it('should not render controlled substance warning when false', () => {
      const { queryByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      expect(queryByTestId('package-info-medication-0-controlled')).toBeNull();
    });

    it('should render cold chain warning', () => {
      const packageWithColdChain = {
        ...mockPackage,
        medications: [
          {
            ...mockPackage.medications[0],
            requiresColdChain: true,
          },
        ],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithColdChain} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medication-0-cold-chain')).toBeTruthy();
    });

    it('should not render cold chain warning when false', () => {
      const { queryByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      expect(queryByTestId('package-info-medication-0-cold-chain')).toBeNull();
    });

    it('should render both warnings when both true', () => {
      const packageWithBoth = {
        ...mockPackage,
        medications: [
          {
            ...mockPackage.medications[0],
            isControlledSubstance: true,
            requiresColdChain: true,
          },
        ],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithBoth} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medication-0-controlled')).toBeTruthy();
      expect(getByTestId('package-info-medication-0-cold-chain')).toBeTruthy();
    });

    it('should render multiple medications', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      expect(getByTestId('package-info-medication-0')).toBeTruthy();
      expect(getByTestId('package-info-medication-1')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible header', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityRole).toBe('button');
      expect(header.props.accessibilityLabel).toBe('Package 1');
    });

    it('should have accessibility hint', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityHint).toContain('Expand');
      expect(header.props.accessibilityHint).toContain('2 medications');
    });

    it('should have accessibility hint for single medication', () => {
      const packageWithOne = {
        ...mockPackage,
        medications: [mockPackage.medications[0]],
      };

      const { getByTestId } = render(<PackageInfo package={packageWithOne} packageIndex={0} />);

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityHint).toContain('1 medication');
    });

    it('should update accessibility hint when expanded', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityHint).toContain('Collapse');
    });

    it('should have accessibility state', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityState).toEqual({ expanded: false });
    });

    it('should update accessibility state when expanded', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const header = getByTestId('package-info-header');
      expect(header.props.accessibilityState).toEqual({ expanded: true });
    });

    it('should mark title as header', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const title = getByTestId('package-info-title');
      expect(title.props.accessibilityRole).toBe('header');
    });

    it('should have accessible QR code label', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={0} />);

      const qrCode = getByTestId('package-info-qr-code');
      expect(qrCode.props.accessibilityLabel).toBe('QR code: QR123456');
    });

    it('should have accessible special handling list', () => {
      const packageWithHandling = {
        ...mockPackage,
        specialHandling: ['cold_chain'] as any[],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithHandling} packageIndex={0} />
      );

      const handling = getByTestId('package-info-special-handling');
      expect(handling.props.accessibilityRole).toBe('list');
      expect(handling.props.accessibilityLabel).toContain('cold chain');
    });

    it('should mark medications title as header', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const title = getByTestId('package-info-medications-title');
      expect(title.props.accessibilityRole).toBe('header');
    });

    it('should have accessible medication labels', () => {
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} isExpanded={true} />
      );

      const med = getByTestId('package-info-medication-0');
      expect(med.props.accessibilityLabel).toContain('Aspirin');
      expect(med.props.accessibilityLabel).toContain('Quantity: 1');
      expect(med.props.accessibilityLabel).toContain('500mg');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom style', () => {
      const customStyle = { backgroundColor: '#F0F0F0' };
      const { getByTestId } = render(
        <PackageInfo package={mockPackage} packageIndex={0} style={customStyle} />
      );

      const container = getByTestId('package-info');
      // Style is an array when custom style is applied
      const styles = Array.isArray(container.props.style) ? container.props.style : [container.props.style];
      expect(styles).toContainEqual(customStyle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty medications array', () => {
      const packageWithNoMeds = {
        ...mockPackage,
        medications: [],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithNoMeds} packageIndex={0} isExpanded={true} />
      );

      const title = getByTestId('package-info-medications-title');
      expect(title.props.children).toEqual(['Medications (', 0, '):']);
    });

    it('should handle long QR codes', () => {
      const packageWithLongQR = {
        ...mockPackage,
        qrCode: 'A'.repeat(100),
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithLongQR} packageIndex={0} />
      );

      const qrCode = getByTestId('package-info-qr-code');
      expect(qrCode.props.children[1]).toBe('A'.repeat(100));
    });

    it('should handle large medication quantities', () => {
      const packageWithLargeQty = {
        ...mockPackage,
        medications: [
          {
            ...mockPackage.medications[0],
            quantity: 9999,
          },
        ],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithLargeQty} packageIndex={0} isExpanded={true} />
      );

      const details = getByTestId('package-info-medication-0-details');
      expect(details.props.children).toEqual([9999, 'x - ', '500mg']);
    });

    it('should handle long medication names', () => {
      const longName = 'A'.repeat(200);
      const packageWithLongName = {
        ...mockPackage,
        medications: [
          {
            ...mockPackage.medications[0],
            name: longName,
          },
        ],
      };

      const { getByTestId } = render(
        <PackageInfo package={packageWithLongName} packageIndex={0} isExpanded={true} />
      );

      const name = getByTestId('package-info-medication-0-name');
      expect(name.props.children).toBe(longName);
    });

    it('should handle high package index', () => {
      const { getByTestId } = render(<PackageInfo package={mockPackage} packageIndex={99} />);

      const title = getByTestId('package-info-title');
      expect(title.props.children).toEqual(['Package ', 100]);
    });
  });
});
