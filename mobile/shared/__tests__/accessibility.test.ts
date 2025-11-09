/**
 * Accessibility Utilities Tests
 */

import {
  getContrastRatio,
  meetsContrastRequirement,
  getButtonLabel,
  getFormFieldLabel,
  getLoadingLabel,
  validateTouchTargetSize,
  getTouchTargetPadding,
  suggestAccessibleTextColor,
  MINIMUM_TOUCH_TARGET_SIZE,
} from '../utils/accessibility';

// Mock i18n
jest.mock('../utils/i18n', () => ({
  t: (key: string) => key,
}));

describe('Accessibility Utilities', () => {
  describe('Color Contrast', () => {
    describe('getContrastRatio', () => {
      it('calculates correct contrast ratio for black and white', () => {
        const ratio = getContrastRatio('#000000', '#FFFFFF');
        expect(ratio).toBeCloseTo(21, 0);
      });

      it('calculates correct contrast ratio for same colors', () => {
        const ratio = getContrastRatio('#FF0000', '#FF0000');
        expect(ratio).toBe(1);
      });

      it('calculates correct contrast ratio for blue and white', () => {
        const ratio = getContrastRatio('#007AFF', '#FFFFFF');
        expect(ratio).toBeGreaterThan(4.0); // Blue has ~4.01 contrast ratio
      });

      it('handles invalid color formats gracefully', () => {
        const ratio = getContrastRatio('invalid', '#FFFFFF');
        expect(ratio).toBe(0);
      });
    });

    describe('meetsContrastRequirement', () => {
      it('checks normal text contrast (4.5:1)', () => {
        const result = meetsContrastRequirement('#000000', '#FFFFFF', false);
        expect(result.passes).toBe(true);
        expect(result.required).toBe(4.5);
        expect(result.ratio).toBeGreaterThan(4.5);
      });

      it('checks large text contrast (3:1)', () => {
        const result = meetsContrastRequirement('#000000', '#FFFFFF', true);
        expect(result.passes).toBe(true);
        expect(result.required).toBe(3.0);
      });

      it('fails for insufficient contrast', () => {
        const result = meetsContrastRequirement('#CCCCCC', '#DDDDDD', false);
        expect(result.passes).toBe(false);
      });
    });

    describe('suggestAccessibleTextColor', () => {
      it('suggests white text for dark backgrounds', () => {
        expect(suggestAccessibleTextColor('#000000')).toBe('#FFFFFF');
        expect(suggestAccessibleTextColor('#333333')).toBe('#FFFFFF');
      });

      it('suggests black text for light backgrounds', () => {
        expect(suggestAccessibleTextColor('#FFFFFF')).toBe('#000000');
        expect(suggestAccessibleTextColor('#EEEEEE')).toBe('#000000');
      });
    });
  });

  describe('ARIA Label Generators', () => {
    describe('getButtonLabel', () => {
      it('generates basic button label', () => {
        expect(getButtonLabel('Submit')).toBe('Submit');
      });

      it('adds disabled state to label', () => {
        const label = getButtonLabel('Submit', true, false);
        expect(label).toContain('Submit');
        expect(label).toContain('disabled');
      });

      it('adds loading state to label', () => {
        const label = getButtonLabel('Submit', false, true);
        expect(label).toContain('Submit');
        expect(label).toContain('common.loading');
      });

      it('adds both disabled and loading states', () => {
        const label = getButtonLabel('Submit', true, true);
        expect(label).toContain('Submit');
        expect(label).toContain('disabled');
        expect(label).toContain('common.loading');
      });
    });

    describe('getFormFieldLabel', () => {
      it('generates basic field label', () => {
        expect(getFormFieldLabel('Email')).toBe('Email');
      });

      it('adds required indicator', () => {
        const label = getFormFieldLabel('Email', true);
        expect(label).toContain('Email');
        expect(label).toContain('validation.required');
      });

      it('adds error message', () => {
        const label = getFormFieldLabel('Email', false, 'Invalid email');
        expect(label).toContain('Email');
        expect(label).toContain('accessibility.error');
        expect(label).toContain('Invalid email');
      });

      it('adds both required and error', () => {
        const label = getFormFieldLabel('Email', true, 'Invalid email');
        expect(label).toContain('Email');
        expect(label).toContain('validation.required');
        expect(label).toContain('accessibility.error');
      });
    });

    describe('getLoadingLabel', () => {
      it('generates basic loading label', () => {
        expect(getLoadingLabel()).toBe('accessibility.loading');
      });

      it('includes message', () => {
        const label = getLoadingLabel('Saving data...');
        expect(label).toContain('accessibility.loading');
        expect(label).toContain('Saving data...');
      });

      it('includes progress', () => {
        const label = getLoadingLabel(undefined, 75);
        expect(label).toContain('accessibility.loading');
        expect(label).toContain('75%');
      });

      it('includes both message and progress', () => {
        const label = getLoadingLabel('Uploading', 50);
        expect(label).toContain('accessibility.loading');
        expect(label).toContain('Uploading');
        expect(label).toContain('50%');
      });
    });
  });

  describe('Touch Target Size', () => {
    it('validates touch target size', () => {
      const validSize = validateTouchTargetSize(44, 44);
      expect(validSize.valid).toBe(true);

      const invalidSize = validateTouchTargetSize(30, 30);
      expect(invalidSize.valid).toBe(false);
    });

    it('calculates required padding for small content', () => {
      const padding = getTouchTargetPadding(20, 20);
      expect(padding.paddingVertical).toBe((MINIMUM_TOUCH_TARGET_SIZE - 20) / 2);
      expect(padding.paddingHorizontal).toBe((MINIMUM_TOUCH_TARGET_SIZE - 20) / 2);
    });

    it('returns zero padding for large content', () => {
      const padding = getTouchTargetPadding(50, 50);
      expect(padding.paddingVertical).toBe(0);
      expect(padding.paddingHorizontal).toBe(0);
    });
  });
});
