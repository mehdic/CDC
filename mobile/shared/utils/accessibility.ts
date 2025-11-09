/**
 * Accessibility Utilities (T274)
 * WCAG 2.1 AA compliance helpers for React Native
 * Screen reader support, keyboard navigation, color contrast
 */

import { AccessibilityInfo, findNodeHandle, Platform } from 'react-native';
import { t } from './i18n';

/**
 * Color contrast ratio calculator
 * WCAG 2.1 AA requires:
 * - Text: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
 * - UI Components: 3:1
 */

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance
 */
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format. Use hex colors (#RRGGBB)');
    return 0;
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export const meetsContrastRequirement = (
  textColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } => {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const required = isLargeText ? 3.0 : 4.5;

  return {
    passes: ratio >= required,
    ratio,
    required,
  };
};

/**
 * Screen reader utilities
 */

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader status:', error);
    return false;
  }
};

/**
 * Announce message to screen reader
 */
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Set accessibility focus to a component
 */
export const setAccessibilityFocus = (reactTag: any): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const tag = findNodeHandle(reactTag);
    if (tag) {
      AccessibilityInfo.setAccessibilityFocus(tag);
    }
  }
};

/**
 * ARIA label generators
 */

/**
 * Generate accessible label for button
 */
export const getButtonLabel = (
  title: string,
  disabled: boolean = false,
  loading: boolean = false
): string => {
  let label = title;
  if (disabled) {
    label += `, ${t('accessibility.button')} disabled`;
  }
  if (loading) {
    label += `, ${t('common.loading')}`;
  }
  return label;
};

/**
 * Generate accessible label for form field
 */
export const getFormFieldLabel = (
  fieldName: string,
  required: boolean = false,
  error: string | null = null
): string => {
  let label = fieldName;
  if (required) {
    label += `, ${t('validation.required')}`;
  }
  if (error) {
    label += `, ${t('accessibility.error')}: ${error}`;
  }
  return label;
};

/**
 * Generate accessible label for loading state
 */
export const getLoadingLabel = (message?: string, progress?: number): string => {
  let label = t('accessibility.loading');
  if (message) {
    label += `, ${message}`;
  }
  if (progress !== undefined) {
    label += `, ${progress}%`;
  }
  return label;
};

/**
 * Accessibility props helpers
 */

/**
 * Get accessibility props for interactive elements
 */
export const getInteractiveAccessibilityProps = (
  label: string,
  hint?: string,
  role:
    | 'button'
    | 'link'
    | 'search'
    | 'image'
    | 'checkbox'
    | 'radio'
    | 'switch' = 'button',
  disabled: boolean = false
) => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityState: { disabled },
  };
};

/**
 * Get accessibility props for form inputs
 */
export const getInputAccessibilityProps = (
  label: string,
  value: string,
  required: boolean = false,
  error: string | null = null
) => {
  return {
    accessible: true,
    accessibilityLabel: getFormFieldLabel(label, required, error),
    accessibilityValue: { text: value },
    accessibilityRequired: required,
    accessibilityInvalid: !!error,
    accessibilityLiveRegion: error ? 'polite' as const : undefined,
  };
};

/**
 * Get accessibility props for alerts/notifications
 */
export const getAlertAccessibilityProps = (
  message: string,
  type: 'error' | 'warning' | 'success' | 'info' = 'info'
) => {
  return {
    accessible: true,
    accessibilityLabel: `${t(`accessibility.${type}`)}: ${message}`,
    accessibilityRole: 'alert' as const,
    accessibilityLiveRegion: 'assertive' as const,
  };
};

/**
 * Keyboard navigation helpers
 */

/**
 * Focus management for keyboard navigation
 */
export interface FocusableElement {
  id: string;
  ref: any;
}

export class FocusManager {
  private elements: FocusableElement[] = [];
  private currentIndex: number = -1;

  register(element: FocusableElement): void {
    this.elements.push(element);
  }

  unregister(id: string): void {
    this.elements = this.elements.filter((el) => el.id !== id);
    if (this.currentIndex >= this.elements.length) {
      this.currentIndex = this.elements.length - 1;
    }
  }

  focusNext(): void {
    if (this.elements.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.setFocus();
  }

  focusPrevious(): void {
    if (this.elements.length === 0) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.setFocus();
  }

  focusFirst(): void {
    if (this.elements.length === 0) return;
    this.currentIndex = 0;
    this.setFocus();
  }

  focusLast(): void {
    if (this.elements.length === 0) return;
    this.currentIndex = this.elements.length - 1;
    this.setFocus();
  }

  private setFocus(): void {
    const element = this.elements[this.currentIndex];
    if (element && element.ref) {
      setAccessibilityFocus(element.ref);
    }
  }
}

/**
 * Touch target size validation
 * WCAG 2.1 AA requires minimum 44x44 points for touch targets
 */
export const MINIMUM_TOUCH_TARGET_SIZE = 44;

export const validateTouchTargetSize = (
  width: number,
  height: number
): { valid: boolean; width: number; height: number } => {
  return {
    valid:
      width >= MINIMUM_TOUCH_TARGET_SIZE &&
      height >= MINIMUM_TOUCH_TARGET_SIZE,
    width,
    height,
  };
};

/**
 * Get recommended touch target padding
 */
export const getTouchTargetPadding = (
  contentWidth: number,
  contentHeight: number
): { paddingVertical: number; paddingHorizontal: number } => {
  const paddingVertical = Math.max(
    0,
    (MINIMUM_TOUCH_TARGET_SIZE - contentHeight) / 2
  );
  const paddingHorizontal = Math.max(
    0,
    (MINIMUM_TOUCH_TARGET_SIZE - contentWidth) / 2
  );

  return { paddingVertical, paddingHorizontal };
};

/**
 * Color accessibility helpers
 */

/**
 * Suggest accessible color based on background
 */
export const suggestAccessibleTextColor = (
  backgroundColor: string
): string => {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);

  return whiteContrast >= 4.5 ? '#FFFFFF' : '#000000';
};

/**
 * Export all utilities
 */
export default {
  getContrastRatio,
  meetsContrastRequirement,
  isScreenReaderEnabled,
  announceForAccessibility,
  setAccessibilityFocus,
  getButtonLabel,
  getFormFieldLabel,
  getLoadingLabel,
  getInteractiveAccessibilityProps,
  getInputAccessibilityProps,
  getAlertAccessibilityProps,
  FocusManager,
  validateTouchTargetSize,
  getTouchTargetPadding,
  suggestAccessibleTextColor,
  MINIMUM_TOUCH_TARGET_SIZE,
};
