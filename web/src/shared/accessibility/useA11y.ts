import { useEffect, useRef, useCallback } from 'react';

/**
 * useA11y Hook
 *
 * Utility hook for common accessibility patterns
 * Helps ensure WCAG 2.1 AA compliance across the application
 */

/**
 * Check if a color pair meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
 */
export const getContrastRatio = (rgb1: string, rgb2: string): number => {
  const getLuminance = (rgb: string): number => {
    // Parse RGB values
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return 0;

    const [r, g, b] = match.map(x => {
      const c = parseInt(x) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Announce a message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if an element is visible on screen
 */
export const isElementVisible = (element: HTMLElement): boolean => {
  if (!element) return false;

  const style = window.getComputedStyle(element);

  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.height > 0 && rect.width > 0;
};

/**
 * Manage focus restoration for modals and dialogs
 */
export const useFocusManagement = (isActive: boolean = true) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current && isActive === false) {
      // Restore focus when closing
      previousFocusRef.current.focus();
    }
  }, [isActive]);

  return {
    storeFocus: () => {
      previousFocusRef.current = document.activeElement as HTMLElement;
    },
    restoreFocus: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    },
  };
};

/**
 * Handle keyboard navigation in lists/menus
 * Arrow keys for navigation, Enter/Space for selection
 */
export const useKeyboardNavigation = (
  itemCount: number,
  onSelect?: (index: number) => void
) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = selectedIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (selectedIndex + 1) % itemCount;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (selectedIndex - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onSelect) {
            onSelect(selectedIndex);
          }
          return;
        default:
          return;
      }

      setSelectedIndex(newIndex);
    },
    [selectedIndex, itemCount, onSelect]
  );

  return { selectedIndex, setSelectedIndex, handleKeyDown };
};

/**
 * Announce changes in page title for screen readers
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    // Announce page change to screen readers
    announceToScreenReader(`Page changed to ${title}`);

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

/**
 * Add required ARIA attributes to interactive elements
 */
export const getAriaAttributes = (
  role: string,
  state?: Record<string, string | boolean>
) => {
  const attrs: Record<string, string | boolean> = { role };

  if (state) {
    Object.entries(state).forEach(([key, value]) => {
      attrs[`aria-${key}`] = value;
    });
  }

  return attrs;
};

// Import React at module level for useKeyboardNavigation hook
import React from 'react';

export default {
  getContrastRatio,
  announceToScreenReader,
  isElementVisible,
  useFocusManagement,
  useKeyboardNavigation,
  usePageTitle,
  getAriaAttributes,
};
