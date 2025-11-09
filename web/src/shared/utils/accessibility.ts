/**
 * Accessibility Utilities (T274) - Web Version
 * WCAG 2.1 AA compliance helpers for React Web
 * Screen reader support, keyboard navigation, color contrast
 */

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
 * Announce message to screen reader
 */
export const announceForAccessibility = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Set focus to element
 */
export const setFocus = (elementOrSelector: HTMLElement | string): void => {
  const element =
    typeof elementOrSelector === 'string'
      ? document.querySelector<HTMLElement>(elementOrSelector)
      : elementOrSelector;

  if (element) {
    element.focus();
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
    label += `, button disabled`;
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
    label += ` (${t('validation.required')})`;
  }
  if (error) {
    label += `. ${t('accessibility.error')}: ${error}`;
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
 * Accessibility props helpers for React
 */

/**
 * Get accessibility props for interactive elements
 */
export const getInteractiveAccessibilityProps = (
  label: string,
  hint?: string,
  role: 'button' | 'link' | 'search' | 'img' | 'checkbox' | 'radio' | 'switch' = 'button',
  disabled: boolean = false
) => {
  return {
    role,
    'aria-label': label,
    'aria-describedby': hint,
    'aria-disabled': disabled,
    tabIndex: disabled ? -1 : 0,
  };
};

/**
 * Get accessibility props for form inputs
 */
export const getInputAccessibilityProps = (
  label: string,
  value: string,
  id: string,
  required: boolean = false,
  error: string | null = null
) => {
  return {
    id,
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
    'aria-live': error ? 'polite' : undefined,
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
    role: 'alert',
    'aria-label': `${t(`accessibility.${type}`)}: ${message}`,
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': true,
  };
};

/**
 * Keyboard navigation helpers
 */

/**
 * Handle keyboard navigation for lists/menus
 */
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  options: {
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onEnter?: () => void;
    onEscape?: () => void;
    onTab?: () => void;
  }
): void => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      options.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      options.onArrowDown?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      options.onArrowLeft?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      options.onArrowRight?.();
      break;
    case 'Enter':
      event.preventDefault();
      options.onEnter?.();
      break;
    case 'Escape':
      event.preventDefault();
      options.onEscape?.();
      break;
    case 'Tab':
      options.onTab?.();
      break;
  }
};

/**
 * Focus trap for modals/dialogs
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);

  // Set initial focus
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
};

/**
 * Skip to main content helper
 */
export const addSkipToMainContent = (): void => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-to-main';
  skipLink.style.position = 'absolute';
  skipLink.style.top = '-100px';
  skipLink.style.left = '0';
  skipLink.style.padding = '8px';
  skipLink.style.zIndex = '100';
  skipLink.style.backgroundColor = '#000';
  skipLink.style.color = '#fff';

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-100px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * Color accessibility helpers
 */

/**
 * Suggest accessible color based on background
 */
export const suggestAccessibleTextColor = (backgroundColor: string): string => {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);

  return whiteContrast >= 4.5 ? '#FFFFFF' : '#000000';
};

/**
 * Semantic HTML helpers
 */

/**
 * Generate heading level props
 */
export const getHeadingProps = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => {
  return {
    role: 'heading',
    'aria-level': level,
    'aria-label': text,
  };
};

/**
 * Generate landmark role props
 */
export const getLandmarkProps = (
  landmark: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'search' | 'complementary',
  label?: string
) => {
  return {
    role: landmark,
    'aria-label': label,
  };
};

/**
 * Export all utilities
 */
export default {
  getContrastRatio,
  meetsContrastRequirement,
  announceForAccessibility,
  setFocus,
  getButtonLabel,
  getFormFieldLabel,
  getLoadingLabel,
  getInteractiveAccessibilityProps,
  getInputAccessibilityProps,
  getAlertAccessibilityProps,
  handleKeyboardNavigation,
  trapFocus,
  addSkipToMainContent,
  suggestAccessibleTextColor,
  getHeadingProps,
  getLandmarkProps,
};
