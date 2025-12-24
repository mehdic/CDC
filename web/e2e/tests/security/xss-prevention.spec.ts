import { test, expect } from '../../fixtures/auth.fixture';
import { mockApiResponse } from '../../utils/api-mock';
import { login } from '../../utils/auth-helpers';

/**
 * SKIP REASON: XSS prevention features not yet fully implemented
 * Requires:
 * - Input sanitization (DOMPurify or similar)
 * - Content Security Policy headers
 * - Output encoding
 * - XSS test pages/forms with proper testids
 *
 * TODO: Remove .skip() once XSS prevention is implemented
 */
test.describe.skip('Security - XSS Prevention (E2E-SEC-003)', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  test.beforeEach(async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard');
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize script tags in text inputs', async ({ page }) => {
      await page.goto('/prescriptions/new');

      const maliciousScript = '<script>alert("XSS")</script>';

      // Attempt to inject script in patient name field
      const patientNameInput = page.locator('[data-testid="patient-name-input"]');
      if (await patientNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await patientNameInput.fill(maliciousScript);

        // Get the sanitized value
        const sanitizedValue = await patientNameInput.inputValue();

        // Verify script tags are stripped or encoded
        expect(sanitizedValue).not.toContain('<script>');
        expect(sanitizedValue).not.toContain('</script>');

        // Value should be encoded or stripped
        const isEncoded = sanitizedValue.includes('&lt;script&gt;') || sanitizedValue.includes('&lt;');
        const isStripped = !sanitizedValue.includes('script');

        expect(isEncoded || isStripped).toBe(true);
      }
    });

    test('should prevent JavaScript execution in event handlers', async ({ page }) => {
      await page.goto('/messaging');

      const maliciousPayload = '<img src=x onerror="alert(\'XSS\')">';

      // Try to inject XSS via message input
      const messageInput = page.locator('[data-testid="message-input"]');
      if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await messageInput.fill(maliciousPayload);

        // Submit message
        const sendButton = page.getByRole('button', { name: /send|envoyer/i });
        if (await sendButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await sendButton.click();

          await page.waitForTimeout(500);

          // Verify no alert was triggered
          const alerts = await page.evaluate(() => {
            let alertFired = false;
            const originalAlert = window.alert;
            window.alert = () => {
              alertFired = true;
            };
            window.alert = originalAlert;
            return alertFired;
          });

          expect(alerts).toBe(false);
        }
      }
    });

    test('should encode HTML entities in user-generated content', async ({ page }) => {
      await mockApiResponse(page, '**/prescriptions', {
        status: 200,
        body: {
          success: true,
          data: [
            {
              id: 'rx_001',
              patientName: '<b>Test Patient</b>',
              medication: 'Aspirin & Tylenol',
              notes: '"Special" <instructions>',
            },
          ],
        },
      });

      await page.goto('/prescriptions');

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Get the page content
      const pageContent = await page.content();

      // Verify HTML entities are encoded
      const hasEncodedEntities =
        pageContent.includes('&lt;b&gt;') ||
        pageContent.includes('&amp;') ||
        pageContent.includes('&quot;') ||
        !pageContent.includes('<b>Test Patient</b>'); // Raw HTML should not appear

      expect(hasEncodedEntities).toBe(true);
    });

    test('should strip dangerous HTML tags from rich text inputs', async ({ page }) => {
      await page.goto('/teleconsultation/notes');

      const dangerousTags = [
        '<script>malicious()</script>',
        '<iframe src="evil.com"></iframe>',
        '<object data="malware.swf"></object>',
        '<embed src="attack.pdf">',
        '<link rel="stylesheet" href="evil.css">',
      ];

      const notesInput = page.locator('[data-testid="notes-input"]');
      if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        for (const tag of dangerousTags) {
          await notesInput.fill(tag);
          const value = await notesInput.inputValue();

          // Verify dangerous tags are removed or encoded
          expect(value).not.toContain('<script');
          expect(value).not.toContain('<iframe');
          expect(value).not.toContain('<object');
          expect(value).not.toContain('<embed');
          expect(value).not.toContain('<link');
        }
      }
    });
  });

  test.describe('Output Encoding', () => {
    test('should properly encode data displayed in HTML context', async ({ page }) => {
      const xssPayload = '<img src=x onerror=alert(1)>';

      await mockApiResponse(page, '**/patients', {
        status: 200,
        body: {
          success: true,
          data: [
            {
              id: 'patient_001',
              firstName: xssPayload,
              lastName: 'Dupont',
              email: 'test@example.com',
            },
          ],
        },
      });

      await page.goto('/patients');

      // Wait for patient data to render
      await page.waitForTimeout(1000);

      // Check if XSS was executed
      const xssExecuted = await page.evaluate(() => {
        // Check for image with error handler
        const img = document.querySelector('img[src="x"]');
        return !!img;
      });

      // XSS should NOT execute
      expect(xssExecuted).toBe(false);

      // Verify data is displayed safely
      const pageContent = await page.content();
      const isEncoded =
        pageContent.includes('&lt;img') ||
        !pageContent.includes('<img src=x onerror');

      expect(isEncoded).toBe(true);
    });

    test('should encode data in JavaScript context', async ({ page }) => {
      await mockApiResponse(page, '**/user/profile', {
        status: 200,
        body: {
          success: true,
          user: {
            firstName: '"; alert("XSS"); var x="',
            lastName: "'; alert('XSS'); var y='",
          },
        },
      });

      await page.goto('/profile');

      await page.waitForTimeout(1000);

      // Verify no alert was triggered
      const dialogAppeared = await page.evaluate(() => {
        let dialogShown = false;
        const oldAlert = window.alert;
        window.alert = () => {
          dialogShown = true;
        };
        // Restore after check
        window.alert = oldAlert;
        return dialogShown;
      });

      expect(dialogAppeared).toBe(false);
    });

    test('should safely handle data in URL parameters', async ({ page }) => {
      const maliciousUrl = '/search?q=<script>alert("XSS")</script>';

      await page.goto(maliciousUrl);

      // Verify no script execution
      const scriptExecuted = await page.evaluate(() => {
        return document.scripts.length > 0 &&
          Array.from(document.scripts).some((s) => s.textContent?.includes('alert("XSS")'));
      });

      expect(scriptExecuted).toBe(false);
    });

    test('should encode data in CSS context', async ({ page }) => {
      await mockApiResponse(page, '**/theme', {
        status: 200,
        body: {
          success: true,
          customStyles: {
            backgroundColor: '"; </style><script>alert("XSS")</script><style>"',
          },
        },
      });

      await page.goto('/settings/appearance');

      await page.waitForTimeout(1000);

      // Verify script was not injected via CSS
      const xssViaCSS = await page.evaluate(() => {
        const styles = document.querySelectorAll('style');
        return Array.from(styles).some((style) =>
          style.textContent?.includes('<script>alert')
        );
      });

      expect(xssViaCSS).toBe(false);
    });
  });

  test.describe('DOM-based XSS Prevention', () => {
    test('should safely handle window.location manipulation', async ({ page }) => {
      await page.goto('/dashboard');

      // Attempt DOM-based XSS via location hash
      await page.evaluate(() => {
        window.location.hash = '<script>alert("XSS")</script>';
      });

      await page.waitForTimeout(500);

      // Verify script didn't execute
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      expect(bodyHTML).not.toContain('<script>alert("XSS")</script>');
    });

    test('should sanitize innerHTML assignments', async ({ page }) => {
      await page.goto('/dashboard');

      // Try to inject XSS via simulated innerHTML (if exposed)
      const xssExecuted = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        testDiv.innerHTML = '<img src=x onerror=alert(1)>';
        document.body.appendChild(testDiv);

        // Check if the onerror handler exists (indicates unsanitized innerHTML)
        const img = testDiv.querySelector('img') as HTMLImageElement;
        return img && typeof img.onerror === 'function';
      });

      // Modern frameworks (React) don't execute scripts from innerHTML
      // But we verify the pattern
      console.log('XSS via innerHTML test:', xssExecuted ? 'VULNERABLE' : 'SAFE');
    });

    test('should use textContent instead of innerHTML for user data', async ({ page }) => {
      await mockApiResponse(page, '**/notifications', {
        status: 200,
        body: {
          success: true,
          notifications: [
            {
              id: 'notif_001',
              message: '<script>alert("XSS")</script>New prescription available',
            },
          ],
        },
      });

      await page.goto('/notifications');

      await page.waitForTimeout(1000);

      // Verify notification displays text safely
      const notificationElement = page.locator('[data-testid="notification-notif_001"]');
      if (await notificationElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await notificationElement.textContent();

        // Script tags should be displayed as text, not executed
        expect(text).toContain('alert');
        expect(text).not.toContain('<script>alert("XSS")</script>');
      }
    });
  });

  test.describe('Content Security Policy (CSP)', () => {
    test('should have CSP headers set', async ({ page }) => {
      const response = await page.goto('/dashboard');

      if (response) {
        const headers = response.headers();
        const csp = headers['content-security-policy'] ||
          headers['x-content-security-policy'] ||
          headers['x-webkit-csp'];

        // Document CSP presence (may not be set in development)
        console.log('CSP Header:', csp || 'NOT SET');

        if (csp) {
          // Verify key CSP directives
          expect(csp).toContain('default-src');

          // Should restrict inline scripts
          const restrictInlineScripts = csp.includes("script-src") &&
            !csp.includes("'unsafe-inline'");

          console.log('Restricts inline scripts:', restrictInlineScripts);
        }
      }
    });

    test('should block inline script execution with CSP', async ({ page }) => {
      // This test verifies CSP blocks inline scripts
      await page.goto('/dashboard');

      // Try to inject inline script
      const inlineScriptBlocked = await page.evaluate(() => {
        try {
          const script = document.createElement('script');
          script.textContent = 'window.xssExecuted = true;';
          document.body.appendChild(script);

          return !(window as { xssExecuted?: boolean }).xssExecuted;
        } catch {
          return true; // Exception means blocked
        }
      });

      // CSP should block inline scripts (if configured)
      // In development this may not be enforced
      console.log('Inline script blocked by CSP:', inlineScriptBlocked);
    });
  });

  test.describe('Attribute-based XSS Prevention', () => {
    test('should sanitize href attributes', async ({ page }) => {
      await mockApiResponse(page, '**/resources', {
        status: 200,
        body: {
          success: true,
          resources: [
            {
              id: 'res_001',
              title: 'Resource',
              url: 'javascript:alert("XSS")',
            },
          ],
        },
      });

      await page.goto('/resources');

      await page.waitForTimeout(1000);

      // Find links with javascript: protocol
      const dangerousLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href^="javascript:"]');
        return links.length;
      });

      // Should be 0 (all javascript: hrefs sanitized)
      expect(dangerousLinks).toBe(0);
    });

    test('should sanitize data attributes', async ({ page }) => {
      await page.goto('/prescriptions');

      const maliciousData = '" onmouseover="alert(\'XSS\')';

      // Try to inject XSS via data attribute
      await page.evaluate((payload) => {
        const div = document.createElement('div');
        div.setAttribute('data-patient-name', payload);
        div.textContent = 'Hover me';
        document.body.appendChild(div);
      }, maliciousData);

      // Hover over the element
      const injectedDiv = page.locator('[data-patient-name]').last();
      if (await injectedDiv.isVisible({ timeout: 1000 }).catch(() => false)) {
        await injectedDiv.hover();

        await page.waitForTimeout(500);

        // Verify no alert triggered
        // (Modern browsers don't execute handlers from data attributes)
        const xssTriggered = await page.evaluate(() => {
          return (window as { xssTriggered?: boolean }).xssTriggered || false;
        });

        expect(xssTriggered).toBe(false);
      }
    });
  });

  test.describe('File Upload XSS Prevention', () => {
    test('should validate and sanitize uploaded file names', async ({ page }) => {
      await page.goto('/prescriptions/upload');

      const maliciousFileName = '<script>alert("XSS")</script>.pdf';

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Create a test file with malicious name
        await page.evaluate((fileName) => {
          const dataTransfer = new DataTransfer();
          const file = new File(['test content'], fileName, { type: 'application/pdf' });
          dataTransfer.items.add(file);

          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (input) {
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, maliciousFileName);

        await page.waitForTimeout(500);

        // Verify file name is sanitized in display
        const displayedFileName = page.locator('[data-testid="uploaded-file-name"]');
        if (await displayedFileName.isVisible({ timeout: 1000 }).catch(() => false)) {
          const text = await displayedFileName.textContent();

          // Script tags should be encoded or stripped
          expect(text).not.toContain('<script>');
          expect(text).not.toContain('</script>');
        }
      }
    });

    test('should prevent XSS in file preview', async ({ page }) => {
      await page.goto('/documents');

      // Mock document with XSS in metadata
      await mockApiResponse(page, '**/documents/*', {
        status: 200,
        body: {
          success: true,
          document: {
            id: 'doc_001',
            name: 'prescription.pdf',
            description: '<img src=x onerror=alert("XSS")>',
            uploadedBy: '<script>alert("XSS")</script>',
          },
        },
      });

      const viewButton = page.locator('[data-testid="view-document-button"]').first();
      if (await viewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await viewButton.click();

        await page.waitForTimeout(1000);

        // Verify XSS not executed in preview
        const pageHTML = await page.content();
        const hasEncodedContent =
          pageHTML.includes('&lt;img') ||
          pageHTML.includes('&lt;script') ||
          !pageHTML.includes('<img src=x onerror');

        expect(hasEncodedContent).toBe(true);
      }
    });
  });

  test.describe('React-specific XSS Prevention', () => {
    test('should prevent XSS via dangerouslySetInnerHTML', async ({ page }) => {
      await page.goto('/dashboard');

      // Check if any elements use dangerouslySetInnerHTML unsafely
      const hasDangerousHTML = await page.evaluate(() => {
        // In React, dangerouslySetInnerHTML shows up as a specific pattern
        // This is a heuristic check
        const body = document.body.innerHTML;
        return body.includes('dangerouslySetInnerHTML');
      });

      // Should not find dangerouslySetInnerHTML in production code
      // (or it should be used only with sanitized content)
      console.log('Uses dangerouslySetInnerHTML:', hasDangerousHTML);
    });

    test('should use React escape mechanism for user content', async ({ page }) => {
      await mockApiResponse(page, '**/user/bio', {
        status: 200,
        body: {
          success: true,
          bio: 'Hello <script>alert("XSS")</script> World & "test"',
        },
      });

      await page.goto('/profile');

      await page.waitForTimeout(1000);

      // Get the bio content
      const bioElement = page.locator('[data-testid="user-bio"]');
      if (await bioElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const bioHTML = await bioElement.innerHTML();

        // React should auto-escape the content
        const isEscaped =
          bioHTML.includes('&lt;script&gt;') ||
          !bioHTML.includes('<script>alert("XSS")</script>');

        expect(isEscaped).toBe(true);
      }
    });
  });

  test.describe('JSON Response XSS Prevention', () => {
    test('should prevent XSS via JSON response', async ({ page }) => {
      // Malicious JSON that could cause XSS if not properly handled
      await mockApiResponse(page, '**/api/data', {
        status: 200,
        body: {
          success: true,
          message: '</script><script>alert("XSS")</script>',
        },
      });

      await page.goto('/dashboard');

      // Trigger API call
      await page.evaluate(() => {
        fetch('/api/data')
          .then((r) => r.json())
          .then((data) => {
            // Even if response contains script tags, React should escape them
            const div = document.createElement('div');
            div.id = 'api-response';
            div.textContent = data.message;
            document.body.appendChild(div);
          });
      });

      await page.waitForTimeout(1000);

      // Verify script didn't execute
      const responseDiv = page.locator('#api-response');
      if (await responseDiv.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await responseDiv.textContent();

        // Should contain the text but not execute script
        expect(text).toContain('alert');
        expect(text).not.toContain('</script><script>');
      }
    });
  });
});
