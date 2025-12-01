import React, { useEffect, useRef } from 'react';

/**
 * AriaLive Component
 *
 * Announces dynamic content changes to screen readers
 * WCAG 2.1 Level A Requirement (aria-live regions)
 *
 * Used for status messages, error messages, notifications, etc.
 * that appear dynamically and need to be announced to assistive technologies.
 */

type AriaLivePolite = 'polite' | 'assertive' | 'off';

interface AriaLiveProps {
  message?: string | null;
  level?: AriaLivePolite;
  role?: 'status' | 'alert' | 'log';
  className?: string;
  children?: React.ReactNode;
  autoHide?: number;
}

export const AriaLive: React.FC<AriaLiveProps> = ({
  message,
  level = 'polite',
  role = 'status',
  className = '',
  children,
  autoHide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoHide && (message || children)) {
      // Clear existing timeout
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }

      // Set new timeout to clear message after autoHide milliseconds
      autoHideTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.textContent = '';
        }
      }, autoHide);
    }

    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [message, autoHide, children]);

  // Base classes for aria-live region
  const ariaLiveClasses = [
    'aria-live-region',
    `aria-live-${level}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={ariaLiveClasses}
      aria-live={level}
      aria-atomic="true"
      role={role}
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      {message || children}
    </div>
  );
};

/**
 * Hook for managing AriaLive announcements
 */
export const useAriaLive = (defaultLevel: AriaLivePolite = 'polite') => {
  const [message, setMessage] = React.useState<string>('');
  const [level, setLevel] = React.useState<AriaLivePolite>(defaultLevel);

  const announce = React.useCallback(
    (text: string, assertive: boolean = false) => {
      setLevel(assertive ? 'assertive' : 'polite');
      setMessage(text);
    },
    []
  );

  const clear = React.useCallback(() => {
    setMessage('');
  }, []);

  return { message, level, announce, clear };
};

export default AriaLive;
