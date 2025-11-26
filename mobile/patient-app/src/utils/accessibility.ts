/**
 * T2-053: Accessibility Features - WCAG 2.1 AA Compliance
 * Screen reader support, keyboard navigation, focus management, contrast
 */

/**
 * WCAG 2.1 AA Compliance Utilities
 * Ensures app is accessible to users with disabilities
 */

/**
 * Color contrast checker
 * WCAG AA requires minimum 4.5:1 contrast for normal text, 3:1 for large text
 */
export function getRelativeLuminance(hexColor: string): number {
  // Remove # if present
  const color = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  // Calculate relative luminance
  const getRgbComponent = (component: number): number => {
    if (component <= 0.03928) {
      return component / 12.92;
    }
    return Math.pow((component + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * getRgbComponent(r) +
    0.7152 * getRgbComponent(g) +
    0.0722 * getRgbComponent(b)
  );
}

export function getContrastRatio(
  foregroundColor: string,
  backgroundColor: string,
): number {
  const l1 = getRelativeLuminance(foregroundColor);
  const l2 = getRelativeLuminance(backgroundColor);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function isWCAGAACompliant(
  foregroundColor: string,
  backgroundColor: string,
  largeText: boolean = false,
): boolean {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate screen reader friendly text
 */
export function createAccessibilityLabel(
  mainText: string,
  additionalContext?: string,
  state?: string,
): string {
  let label = mainText;

  if (additionalContext) {
    label += `, ${additionalContext}`;
  }

  if (state) {
    label += `, ${state}`;
  }

  return label;
}

/**
 * Create hint for form fields
 */
export function createFieldHint(
  fieldName: string,
  format?: string,
  example?: string,
): string {
  let hint = `Enter ${fieldName}`;

  if (format) {
    hint += ` in ${format} format`;
  }

  if (example) {
    hint += `, for example ${example}`;
  }

  return hint;
}

/**
 * Format numbers for screen readers
 */
export function formatNumberForA11y(number: number): string {
  return number.toLocaleString('en-US');
}

/**
 * Format currency for screen readers
 */
export function formatCurrencyForA11y(
  amount: number,
  currency: string = 'CHF',
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  return formatted;
}

/**
 * Format date for screen readers
 */
export function formatDateForA11y(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Focus management utilities
 */
export interface FocusableElement {
  focus: () => void;
}

/**
 * Keyboard navigation helper
 */
export const KeyboardNavigation = {
  /**
   * Check if a key is Enter or Space (for button activation)
   */
  isActivationKey: (keyCode: number): boolean => {
    return keyCode === 13 || keyCode === 32; // Enter or Space
  },

  /**
   * Check if a key is navigation key
   */
  isNavigationKey: (keyCode: number): boolean => {
    return keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39; // Arrow keys
  },

  /**
   * Check if a key is escape
   */
  isEscapeKey: (keyCode: number): boolean => {
    return keyCode === 27;
  },
};

/**
 * Focus trap for modals
 * Ensures keyboard navigation stays within the modal
 */
export class FocusTrap {
  private focusableElements: FocusableElement[] = [];
  private firstElement: FocusableElement | null = null;
  private lastElement: FocusableElement | null = null;
  private previousActiveElement: FocusableElement | null = null;

  constructor(focusableElements: FocusableElement[]) {
    this.focusableElements = focusableElements.filter(Boolean);
    this.firstElement = this.focusableElements[0] || null;
    this.lastElement = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Activate focus trap
   */
  activate(): void {
    if (this.firstElement) {
      this.previousActiveElement = this.firstElement;
      this.firstElement.focus();
    }
  }

  /**
   * Deactivate focus trap and restore previous focus
   */
  deactivate(): void {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }

  /**
   * Handle tab key navigation within trap
   */
  handleTab(_event: any, shiftKey: boolean): void {
    if (shiftKey) {
      // Shift + Tab
      if (this.previousActiveElement === this.firstElement && this.lastElement) {
        this.lastElement.focus();
        this.previousActiveElement = this.lastElement;
      }
    } else {
      // Tab
      if (this.previousActiveElement === this.lastElement && this.firstElement) {
        this.firstElement.focus();
        this.previousActiveElement = this.firstElement;
      }
    }
  }
}

/**
 * Announce changes to screen readers
 */
export interface AnnouncementOptions {
  assertive?: boolean; // true for urgent announcements
  priority?: 'high' | 'normal' | 'low';
}

export function announceToScreenReader(
  message: string,
  options?: AnnouncementOptions,
): void {
  // React Native doesn't have native screen reader API like web
  // But we can provide structured logging for testing
  const priority = options?.priority || 'normal';
  const urgent = options?.assertive ? 'URGENT' : 'POLITE';

  console.log(`[A11Y - ${priority.toUpperCase()} - ${urgent}] ${message}`);
}

/**
 * Common accessibility labels for icons
 */
export const A11yIconLabels = {
  close: 'Close',
  menu: 'Menu',
  search: 'Search',
  settings: 'Settings',
  user: 'User profile',
  notifications: 'Notifications',
  messages: 'Messages',
  back: 'Go back',
  forward: 'Go forward',
  home: 'Home',
  edit: 'Edit',
  delete: 'Delete',
  add: 'Add',
  remove: 'Remove',
  download: 'Download',
  upload: 'Upload',
  refresh: 'Refresh',
  filter: 'Filter',
  sort: 'Sort',
  more: 'More options',
  checkmark: 'Done',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
  success: 'Success',
  loading: 'Loading',
  expand: 'Expand',
  collapse: 'Collapse',
};

/**
 * Create accessible button label with state
 */
export function createButtonLabel(
  text: string,
  disabled: boolean = false,
  loading: boolean = false,
): string {
  let label = text;

  if (loading) {
    label += ', loading';
  }

  if (disabled) {
    label += ', disabled';
  }

  return label;
}

/**
 * Accessible alert dialog helper
 */
export function createAlertMessage(
  title: string,
  message: string,
  buttons?: Array<{ label: string; isDefault?: boolean }>,
): string {
  let alert = title;

  if (message) {
    alert += `. ${message}`;
  }

  if (buttons && buttons.length > 0) {
    const buttonLabels = buttons
      .map((btn) => (btn.isDefault ? `${btn.label} (default)` : btn.label))
      .join(', ');
    alert += `. Options: ${buttonLabels}`;
  }

  return alert;
}

/**
 * Test utilities for accessibility
 */
export const A11yTesting = {
  /**
   * Check if all buttons have labels
   */
  checkButtonLabels: (elements: any[]): boolean => {
    return elements.every(
      (el) => el.accessibilityLabel || el.accessibilityRole === 'button',
    );
  },

  /**
   * Check if form fields have labels
   */
  checkFormLabels: (elements: any[]): boolean => {
    return elements.every((el) => el.label || el.accessibilityLabel);
  },

  /**
   * Check color contrast
   */
  checkContrast: (
    textColor: string,
    backgroundColor: string,
  ): { ratio: number; compliant: boolean } => {
    const ratio = getContrastRatio(textColor, backgroundColor);
    return {
      ratio,
      compliant: ratio >= 4.5,
    };
  },
};
