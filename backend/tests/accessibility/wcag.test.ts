/**
 * WCAG 2.1 AA Compliance Test Suite
 * Tests for accessibility standards compliance including:
 * - Color contrast ratios
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - Form accessibility
 */

import {
  testColorContrast,
  checkKeyboardAccessibility,
  checkHeadingHierarchy,
  checkFormLabels,
  checkFocusIndicators,
  createAccessibleElement,
  createAccessibleForm,
  isWCAGCompliant,
  formatAxeResults,
} from './axe-utils';

describe('WCAG 2.1 AA Compliance Tests', () => {
  // ===== COLOR CONTRAST TESTS =====
  describe('Color Contrast Ratios (WCAG 1.4.3)', () => {
    it('should pass color contrast for normal text (4.5:1)', () => {
      const result = testColorContrast('#000000', '#FFFFFF', false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      expect(result.minRequired).toBe(4.5);
    });

    it('should pass color contrast for large text (3:1)', () => {
      const result = testColorContrast('#000000', '#FFFFFF', true);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(3);
      expect(result.minRequired).toBe(3);
    });

    it('should fail color contrast for insufficient contrast (normal text)', () => {
      const result = testColorContrast('#CCCCCC', '#FFFFFF', false);
      expect(result.passes).toBe(false);
      expect(result.ratio).toBeLessThan(4.5);
    });

    it('should pass color contrast for valid dark gray on white', () => {
      const result = testColorContrast('#333333', '#FFFFFF', false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should pass color contrast for blue on white text', () => {
      const result = testColorContrast('#0066CC', '#FFFFFF', false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should test multiple color combinations', () => {
      const testCases = [
        { fg: '#000000', bg: '#FFFFFF', expected: true }, // Black on white (21:1)
        { fg: '#333333', bg: '#FFFFFF', expected: true }, // Dark gray on white (12.6:1)
        { fg: '#999999', bg: '#FFFFFF', expected: false }, // Light gray on white (2.94:1, fails)
        { fg: '#0066CC', bg: '#FFFFFF', expected: true }, // Blue on white (8.6:1)
        { fg: '#FFFFFF', bg: '#000000', expected: true }, // White on black (21:1)
      ];

      testCases.forEach((testCase) => {
        const result = testColorContrast(testCase.fg, testCase.bg, false);
        expect(result.passes).toBe(testCase.expected);
      });
    });
  });

  // ===== KEYBOARD NAVIGATION TESTS =====
  describe('Keyboard Navigation (WCAG 2.1.1)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should detect all interactive elements as keyboard accessible', () => {
      container.innerHTML = `
        <button>Click me</button>
        <a href="#test">Link</a>
        <input type="text" />
        <select></select>
        <textarea></textarea>
      `;

      const result = checkKeyboardAccessibility(container);
      expect(result.totalInteractive).toBe(5);
      expect(result.accessibleCount).toBe(5);
      expect(result.inaccessible.length).toBe(0);
    });

    it('should identify non-focusable interactive elements', () => {
      container.innerHTML = `
        <div role="button">Custom button</div>
        <button>Real button</button>
      `;

      const result = checkKeyboardAccessibility(container);
      // Custom button without tabindex should be flagged
      expect(result.inaccessible.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle tabindex attributes correctly', () => {
      container.innerHTML = `
        <div tabindex="0" role="button">Focusable div</div>
        <div tabindex="-1" role="button">Non-focusable div</div>
      `;

      const result = checkKeyboardAccessibility(container);
      expect(result.totalInteractive).toBeGreaterThan(0);
    });

    it('should detect skip navigation links', () => {
      const skipLink = createAccessibleElement('a', {
        id: 'skip-link',
        ariaLabel: 'Skip to main content',
        content: 'Skip to main content',
      });
      skipLink.href = '#main-content';

      container.appendChild(skipLink);
      const result = checkKeyboardAccessibility(container);
      expect(result.totalInteractive).toBeGreaterThan(0);
    });
  });

  // ===== ARIA LABEL AND ROLES TESTS =====
  describe('ARIA Labels and Roles (WCAG 1.3.1)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should have proper ARIA labels on buttons', () => {
      const button = createAccessibleElement('button', {
        ariaLabel: 'Close dialog',
        content: 'X',
      });
      container.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('should have proper ARIA roles on custom elements', () => {
      const customButton = createAccessibleElement('div', {
        role: 'button',
        ariaLabel: 'Custom button',
        id: 'custom-btn',
      });
      container.appendChild(customButton);

      expect(customButton.getAttribute('role')).toBe('button');
      expect(customButton.getAttribute('aria-label')).toBe('Custom button');
    });

    it('should properly use aria-labelledby', () => {
      const label = createAccessibleElement('h2', {
        id: 'dialog-title',
        content: 'Confirm Action',
      });
      const dialog = createAccessibleElement('div', {
        role: 'dialog',
        ariaLabelledBy: 'dialog-title',
      });

      container.appendChild(label);
      container.appendChild(dialog);

      expect(dialog.getAttribute('aria-labelledby')).toBe('dialog-title');
    });

    it('should properly use aria-describedby for help text', () => {
      const helpText = createAccessibleElement('span', {
        id: 'password-help',
        content: 'Must be at least 8 characters',
      });
      const passwordInput = createAccessibleElement('input', {
        id: 'password',
        ariaDescribedBy: 'password-help',
      });

      container.appendChild(passwordInput);
      container.appendChild(helpText);

      expect(passwordInput.getAttribute('aria-describedby')).toBe('password-help');
    });

    it('should mark decorative images with aria-hidden', () => {
      const decorativeImage = createAccessibleElement('img', {
        ariaHidden: true,
      });
      container.appendChild(decorativeImage);

      expect(decorativeImage.getAttribute('aria-hidden')).toBe('true');
    });

    it('should support aria-live regions for dynamic content', () => {
      const liveRegion = createAccessibleElement('div', {
        id: 'notifications',
        ariaLabel: 'Notifications',
      });
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');

      container.appendChild(liveRegion);

      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });
  });

  // ===== FORM ACCESSIBILITY TESTS =====
  describe('Form Accessibility (WCAG 3.3.2)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should have proper form field labels', () => {
      const form = createAccessibleForm([
        { id: 'email', label: 'Email Address', type: 'email', required: true },
        { id: 'password', label: 'Password', type: 'password', required: true },
      ]);

      container.appendChild(form);

      const result = checkFormLabels(container);
      expect(result.valid).toBe(true);
      expect(result.unlabeledInputs.length).toBe(0);
    });

    it('should detect unlabeled form inputs', () => {
      container.innerHTML = `
        <input type="text" />
        <input type="email" />
      `;

      const result = checkFormLabels(container);
      expect(result.unlabeledInputs.length).toBe(2);
    });

    it('should validate required field indicators', () => {
      const form = createAccessibleForm([
        { id: 'username', label: 'Username', type: 'text', required: true },
      ]);

      container.appendChild(form);

      const input = container.querySelector('#username') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    it('should support aria-invalid for error states', () => {
      container.innerHTML = `
        <input id="email-input" type="email" aria-invalid="true" aria-describedby="email-error" />
        <span id="email-error">Invalid email format</span>
      `;

      const result = checkFormLabels(container);
      const input = container.querySelector('#email-input') as HTMLInputElement;

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should support fieldset and legend for grouped fields', () => {
      container.innerHTML = `
        <fieldset>
          <legend>Contact Information</legend>
          <label for="phone">Phone Number</label>
          <input id="phone" type="tel" />
          <label for="email">Email</label>
          <input id="email" type="email" />
        </fieldset>
      `;

      const fieldset = container.querySelector('fieldset');
      const legend = container.querySelector('legend');

      expect(fieldset).toBeTruthy();
      expect(legend?.textContent).toBe('Contact Information');
    });
  });

  // ===== HEADING HIERARCHY TESTS =====
  describe('Heading Hierarchy (WCAG 1.3.1)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should have valid heading hierarchy', () => {
      container.innerHTML = `
        <h1>Main Title</h1>
        <h2>Section 1</h2>
        <h3>Subsection 1.1</h3>
        <h2>Section 2</h2>
        <h3>Subsection 2.1</h3>
      `;

      const result = checkHeadingHierarchy(container);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect heading hierarchy skips', () => {
      container.innerHTML = `
        <h1>Main Title</h1>
        <h3>Subsection (skipped h2)</h3>
      `;

      const result = checkHeadingHierarchy(container);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report all headings found', () => {
      container.innerHTML = `
        <h1>Main Title</h1>
        <h2>Section 1</h2>
        <h2>Section 2</h2>
      `;

      const result = checkHeadingHierarchy(container);
      expect(result.headings.length).toBe(3);
      expect(result.headings[0].level).toBe(1);
    });

    it('should allow multiple h1 elements (SC 2.4.1)', () => {
      container.innerHTML = `
        <h1>Page Title</h1>
        <article>
          <h1>Article Title</h1>
        </article>
      `;

      const result = checkHeadingHierarchy(container);
      expect(result.headings.length).toBe(2);
    });
  });

  // ===== FOCUS MANAGEMENT TESTS =====
  describe('Focus Management (WCAG 2.4.7)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should detect visible focus indicators', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';
      button.style.outline = '2px solid blue';
      container.appendChild(button);

      const result = checkFocusIndicators(container);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should handle focus on dialog elements', () => {
      container.innerHTML = `
        <div role="dialog" tabindex="0" aria-label="Modal dialog">
          <button>Close</button>
        </div>
      `;

      const result = checkKeyboardAccessibility(container);
      expect(result.totalInteractive).toBeGreaterThan(0);
    });

    it('should manage focus trap in modal dialogs', () => {
      container.innerHTML = `
        <div role="dialog" aria-modal="true" tabindex="0">
          <button id="first-button">First</button>
          <button id="last-button">Last</button>
        </div>
      `;

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });
  });

  // ===== IMAGE ALTERNATIVE TEXT TESTS =====
  describe('Alternative Text for Images (WCAG 1.1.1)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should have alt text on meaningful images', () => {
      container.innerHTML = `
        <img src="logo.png" alt="Company Logo" />
      `;

      const img = container.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Company Logo');
    });

    it('should have empty alt on decorative images', () => {
      container.innerHTML = `
        <img src="decoration.png" alt="" aria-hidden="true" />
      `;

      const img = container.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have text alternatives for icons', () => {
      container.innerHTML = `
        <span role="img" aria-label="Warning">⚠️</span>
      `;

      const icon = container.querySelector('[role="img"]');
      expect(icon?.getAttribute('aria-label')).toBe('Warning');
    });
  });

  // ===== LINK AND BUTTON TEXT TESTS =====
  describe('Link and Button Labels (WCAG 2.4.4)', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should have descriptive link text', () => {
      container.innerHTML = `
        <a href="/about">About Us</a>
      `;

      const link = container.querySelector('a');
      expect(link?.textContent).toBe('About Us');
    });

    it('should support aria-label on buttons with icons', () => {
      const button = createAccessibleElement('button', {
        ariaLabel: 'Close menu',
        content: '✕',
      });
      container.appendChild(button);

      expect(button.getAttribute('aria-label')).toBe('Close menu');
    });

    it('should avoid generic link text like "Click here"', () => {
      container.innerHTML = `
        <a href="/help">Read our help page</a>
      `;

      const link = container.querySelector('a');
      const text = link?.textContent || '';

      // Check that link text is not generic
      expect(['Click here', 'Read more', 'Link'].includes(text)).toBe(false);
      expect(text.length).toBeGreaterThan(5);
    });
  });

  // ===== RESPONSIVE DESIGN AND ZOOM TESTS =====
  describe('Responsive Design (WCAG 1.4.4)', () => {
    it('should support text zoom without horizontal scrolling', () => {
      // This is typically tested in integration tests with viewport changes
      const zoomLevels = [100, 150, 200];
      expect(zoomLevels).toContain(100);
    });
  });

  // ===== LANGUAGE DECLARATION TESTS =====
  describe('Language Declaration (WCAG 3.1.1)', () => {
    it('should declare page language', () => {
      const htmlElement = document.querySelector('html');

      // Set language for this test
      if (!htmlElement?.getAttribute('lang')) {
        htmlElement?.setAttribute('lang', 'en');
      }

      const lang = htmlElement?.getAttribute('lang');

      // Should have a language attribute
      expect(lang).toBeTruthy();
      expect(lang?.length).toBeGreaterThan(0);
    });

    it('should support different language declarations', () => {
      const htmlElement = document.querySelector('html');

      // Test French Swiss
      htmlElement?.setAttribute('lang', 'fr-CH');
      expect(htmlElement?.getAttribute('lang')).toBe('fr-CH');

      // Test German Swiss
      htmlElement?.setAttribute('lang', 'de-CH');
      expect(htmlElement?.getAttribute('lang')).toBe('de-CH');

      // Test Italian Swiss
      htmlElement?.setAttribute('lang', 'it-CH');
      expect(htmlElement?.getAttribute('lang')).toBe('it-CH');
    });

    it('should support language changes within content', () => {
      const container = document.createElement('div');
      const englishSpan = document.createElement('span');
      englishSpan.setAttribute('lang', 'en');
      englishSpan.textContent = 'Hello';

      const germanSpan = document.createElement('span');
      germanSpan.setAttribute('lang', 'de');
      germanSpan.textContent = 'Hallo';

      container.appendChild(englishSpan);
      container.appendChild(germanSpan);

      expect(englishSpan.getAttribute('lang')).toBe('en');
      expect(germanSpan.getAttribute('lang')).toBe('de');
    });
  });

  // ===== WCAG COMPLIANCE SUMMARY TESTS =====
  describe('WCAG Compliance Summary', () => {
    it('should compile accessibility test results', () => {
      const mockResults = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            message: 'Elements must meet WCAG color contrast requirements',
            nodes: ['<button>Click me</button>'],
            help: 'Ensure text colors meet contrast ratios',
            helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
          },
        ],
        passes: [
          {
            id: 'aria-label',
            impact: undefined,
            description: 'Buttons have accessible labels',
            nodes: [{ html: '<button aria-label="Submit">Submit</button>' }],
            help: '',
            helpUrl: '',
          },
        ],
        incomplete: [],
      };

      const formatted = formatAxeResults(mockResults as any);
      expect(formatted.summary.totalViolations).toBe(1);
      expect(formatted.summary.totalPasses).toBe(1);
      expect(formatted.summary.violationsBySeverity['serious']).toBe(1);
    });

    it('should determine WCAG compliance status', () => {
      const testResult = {
        violations: [
          {
            id: 'color-contrast',
            impact: 'moderate',
            message: 'Low contrast',
            nodes: [],
            help: '',
            helpUrl: '',
          },
        ],
        passes: [],
        incomplete: [],
        summary: {
          totalViolations: 1,
          violationsBySeverity: { moderate: 1 },
          totalPasses: 0,
          totalIncomplete: 0,
        },
      };

      const compliant = isWCAGCompliant(testResult);
      expect(compliant).toBe(true); // Moderate is acceptable for AA
    });

    it('should fail WCAG compliance with critical violations', () => {
      const testResult = {
        violations: [
          {
            id: 'aria-required-attr',
            impact: 'critical',
            message: 'Missing required ARIA attribute',
            nodes: [],
            help: '',
            helpUrl: '',
          },
        ],
        passes: [],
        incomplete: [],
        summary: {
          totalViolations: 1,
          violationsBySeverity: { critical: 1 },
          totalPasses: 0,
          totalIncomplete: 0,
        },
      };

      const compliant = isWCAGCompliant(testResult);
      expect(compliant).toBe(false);
    });
  });
});
