import React from 'react';
import './skip-link.css';

/**
 * SkipLink Component
 *
 * Provides keyboard navigation shortcut to jump to main content
 * WCAG 2.1 Level A Requirement
 *
 * Visible only on keyboard focus (Tab key)
 * Placed at the very beginning of the page for screen reader users
 */

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content'
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Set focus to the target element
      target.tabIndex = -1;
      target.focus();
      // Remove tabindex after focus is set
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link"
      aria-label={label}
    >
      {label}
    </a>
  );
};

export default SkipLink;
