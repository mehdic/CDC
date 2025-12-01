import React, { useEffect, useRef } from 'react';

/**
 * FocusTrap Component
 *
 * Traps keyboard focus within a modal or dialog
 * WCAG 2.1 Level A Requirement
 *
 * Ensures focus cycles within the component (e.g., modal) and doesn't escape
 * to the background page. This is critical for modal dialogs.
 */

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  onEscape?: () => void;
  restoreFocusOnUnmount?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  onEscape,
  restoreFocusOnUnmount = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element to restore later
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the trap
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      return Array.from(
        containerRef.current?.querySelectorAll(
          focusableSelectors.join(',')
        ) || []
      ) as HTMLElement[];
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If focus is leaving the last element and Tab is pressed, move to first
      if (
        e.shiftKey === false &&
        activeElement === lastElement
      ) {
        e.preventDefault();
        firstElement.focus();
      }
      // If focus is leaving the first element and Shift+Tab is pressed, move to last
      else if (
        e.shiftKey === true &&
        activeElement === firstElement
      ) {
        e.preventDefault();
        lastElement.focus();
      }
    };

    // Focus the first focusable element when trap activates
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    containerRef.current?.addEventListener('keydown', handleKeyDown);

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocusOnUnmount && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive, onEscape, restoreFocusOnUnmount]);

  return <div ref={containerRef}>{children}</div>;
};

export default FocusTrap;
