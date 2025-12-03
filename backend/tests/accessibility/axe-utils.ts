/**
 * Axe-core Test Utilities for WCAG 2.1 AA Compliance Testing
 * Provides helper functions and utilities for automated accessibility testing
 */

import { AxeResults, Result } from 'axe-core';

/**
 * Interface for formatted accessibility test results
 */
export interface AccessibilityTestResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  summary: {
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    totalPasses: number;
    totalIncomplete: number;
  };
}

export interface AccessibilityViolation {
  id: string;
  impact: string;
  message: string;
  nodes: string[];
  help: string;
  helpUrl: string;
}

export interface AccessibilityPass {
  id: string;
  message: string;
  nodeCount: number;
}

export interface AccessibilityIncomplete {
  id: string;
  message: string;
  nodeCount: number;
}

/**
 * Format axe-core results into a more readable format
 */
export function formatAxeResults(results: AxeResults): AccessibilityTestResult {
  const violations: AccessibilityViolation[] = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact || 'unknown',
    message: violation.description,
    nodes: violation.nodes.map((node) => node.html),
    help: violation.help,
    helpUrl: violation.helpUrl,
  }));

  const passes: AccessibilityPass[] = results.passes.map((pass) => ({
    id: pass.id,
    message: pass.description,
    nodeCount: pass.nodes.length,
  }));

  const incomplete: AccessibilityIncomplete[] = results.incomplete.map((inc) => ({
    id: inc.id,
    message: inc.description,
    nodeCount: inc.nodes.length,
  }));

  const violationsBySeverity = violations.reduce(
    (acc, violation) => {
      acc[violation.impact] = (acc[violation.impact] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    violations,
    passes,
    incomplete,
    summary: {
      totalViolations: violations.length,
      violationsBySeverity,
      totalPasses: passes.length,
      totalIncomplete: incomplete.length,
    },
  };
}

/**
 * Check if results meet WCAG 2.1 AA standards (no critical violations)
 */
export function isWCAGCompliant(results: AccessibilityTestResult): boolean {
  const criticalViolations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  return criticalViolations.length === 0;
}

/**
 * Get violations by severity level
 */
export function getViolationsBySeverity(
  results: AccessibilityTestResult,
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
): AccessibilityViolation[] {
  return results.violations.filter((v) => v.impact === severity);
}

/**
 * Helper to create a mock DOM element with accessibility attributes
 */
export function createAccessibleElement(
  tag: string,
  options: {
    role?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    ariaHidden?: boolean;
    className?: string;
    id?: string;
    content?: string;
  }
): HTMLElement {
  const element = document.createElement(tag);

  if (options.role) element.setAttribute('role', options.role);
  if (options.ariaLabel) element.setAttribute('aria-label', options.ariaLabel);
  if (options.ariaLabelledBy) element.setAttribute('aria-labelledby', options.ariaLabelledBy);
  if (options.ariaDescribedBy) element.setAttribute('aria-describedby', options.ariaDescribedBy);
  if (options.ariaHidden !== undefined) {
    element.setAttribute('aria-hidden', options.ariaHidden.toString());
  }
  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.content) element.textContent = options.content;

  return element;
}

/**
 * Create a form with accessible labels
 */
export function createAccessibleForm(fields: Array<{
  id: string;
  label: string;
  type: string;
  required?: boolean;
}>): HTMLFormElement {
  const form = document.createElement('form');

  fields.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;
    if (field.required) label.textContent += ' *';

    const input = document.createElement('input');
    input.id = field.id;
    input.type = field.type;
    input.name = field.id;
    if (field.required) input.required = true;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  return form;
}

/**
 * Test color contrast ratio
 * Returns true if contrast ratio meets WCAG AA standards
 */
export function testColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  passes: boolean;
  minRequired: number;
} {
  const ratio = calculateContrastRatio(foreground, background);
  const minRequired = isLargeText ? 3 : 4.5; // Large text needs 3:1, normal text needs 4.5:1

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= minRequired,
    minRequired,
  };
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  const rgb = parseColor(color);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  // Ensure we don't divide by zero
  if (darker === 0 && lighter === 0) {
    return 1.0;
  }

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Default to black if color cannot be parsed
  return { r: 0, g: 0, b: 0 };
}

/**
 * Check if all interactive elements are keyboard accessible
 */
export function checkKeyboardAccessibility(container: HTMLElement = document.body): {
  totalInteractive: number;
  accessibleCount: number;
  inaccessible: HTMLElement[];
} {
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
  );

  const inaccessible: HTMLElement[] = [];

  interactiveElements.forEach((element) => {
    const el = element as HTMLElement;
    const isNaturallyFocusable =
      ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
    const hasTabIndex = el.hasAttribute('tabindex');
    const tabIndex = el.getAttribute('tabindex');

    // Check if element is focusable
    if (!isNaturallyFocusable && (!hasTabIndex || parseInt(tabIndex || '0') < 0)) {
      inaccessible.push(el);
    }
  });

  return {
    totalInteractive: interactiveElements.length,
    accessibleCount: interactiveElements.length - inaccessible.length,
    inaccessible,
  };
}

/**
 * Check for proper heading hierarchy
 */
export function checkHeadingHierarchy(container: HTMLElement = document.body): {
  valid: boolean;
  errors: string[];
  headings: Array<{ level: number; text: string }>;
} {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const errors: string[] = [];
  const headingsList: Array<{ level: number; text: string }> = [];

  let previousLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    const text = heading.textContent || '';

    headingsList.push({ level, text });

    // Check for proper hierarchy (no skipping more than one level)
    if (previousLevel > 0 && level > previousLevel + 1) {
      errors.push(
        `Heading hierarchy skip: H${previousLevel} to H${level} (${text})`
      );
    }

    previousLevel = level;
  });

  return {
    valid: errors.length === 0,
    errors,
    headings: headingsList,
  };
}

/**
 * Check for proper ARIA labels on form fields
 */
export function checkFormLabels(container: HTMLElement = document.body): {
  valid: boolean;
  unlabeledInputs: HTMLInputElement[];
  missingErrorAssociation: HTMLElement[];
} {
  const inputs = container.querySelectorAll('input, select, textarea');
  const unlabeledInputs: HTMLInputElement[] = [];
  const missingErrorAssociation: HTMLElement[] = [];

  inputs.forEach((input) => {
    const inputEl = input as HTMLInputElement;
    const id = inputEl.id;
    const ariaLabel = inputEl.getAttribute('aria-label');
    const ariaLabelledBy = inputEl.getAttribute('aria-labelledby');

    // Check if input has label
    const associatedLabel = id ? container.querySelector(`label[for="${id}"]`) : null;

    if (!ariaLabel && !ariaLabelledBy && !associatedLabel) {
      unlabeledInputs.push(inputEl);
    }

    // Check for error message association
    if (inputEl.hasAttribute('aria-invalid')) {
      const ariaDescribedBy = inputEl.getAttribute('aria-describedby');
      const errorElement = ariaDescribedBy
        ? container.querySelector(`#${ariaDescribedBy}`)
        : null;

      if (!errorElement && ariaDescribedBy) {
        missingErrorAssociation.push(inputEl);
      }
    }
  });

  return {
    valid: unlabeledInputs.length === 0 && missingErrorAssociation.length === 0,
    unlabeledInputs,
    missingErrorAssociation,
  };
}

/**
 * Check for focus indicators on interactive elements
 */
export function checkFocusIndicators(container: HTMLElement = document.body): {
  elementsWithoutFocus: HTMLElement[];
  total: number;
} {
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"]'
  );

  const elementsWithoutFocus: HTMLElement[] = [];

  interactiveElements.forEach((element) => {
    const el = element as HTMLElement;
    const styles = window.getComputedStyle(el);
    const hasFocusOutline = styles.outline !== 'none' || styles.outline !== '';

    // Check if element has visible focus indicator
    if (!hasFocusOutline) {
      elementsWithoutFocus.push(el);
    }
  });

  return {
    elementsWithoutFocus,
    total: interactiveElements.length,
  };
}
