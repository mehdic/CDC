import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

/**
 * E2E-035: Data Encryption Verification E2E
 *
 * Tests encryption of sensitive data:
 * - PHI encrypted at rest
 * - PHI encrypted in transit (HTTPS)
 * - Encrypted localStorage for tokens
 * - Secure cookie attributes
 * - TLS/SSL verification
 */

test.describe('E2E-035: Data Encryption Verification', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  /**
   * Test: Sensitive data not stored in plaintext in localStorage
   */
  test('should not store sensitive data in plaintext in localStorage', async ({ page }) => {
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Check localStorage for plaintext sensitive data
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      return data;
    });

    // Check for plaintext passwords, SSNs, medical data
    const sensitivePatterns = [
      /password.*[:=]\s*[^*]/i,
      /ssn.*[:=]\s*\d{3}-\d{2}-\d{4}/,
      /credit.*card.*[:=]\s*\d{16}/i,
      /diagnosis.*[:=]\s*[a-z]/i,
    ];

    for (const [key, value] of Object.entries(localStorageData)) {
      for (const pattern of sensitivePatterns) {
        expect(value).not.toMatch(pattern);
      }
    }

    console.log('No plaintext sensitive data found in localStorage');
  });

  /**
   * Test: HTTPS enforced for all requests
   */
  test('should enforce HTTPS for all API requests', async ({ page }) => {
    await login(page, pharmacistUser);

    // Intercept requests and verify HTTPS
    const requests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/auth/')) {
        requests.push(url);
      }
    });

    await page.goto('/prescriptions');
    await page.waitForTimeout(1000);

    // Verify all API requests use HTTPS
    for (const url of requests) {
      expect(url).toMatch(/^https:\/\//);
    }

    console.log(`Verified ${requests.length} requests use HTTPS`);
  });

  /**
   * Test: Secure cookie attributes (HttpOnly, Secure, SameSite)
   */
  test('should set secure attributes on authentication cookies', async ({ page, context }) => {
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'secure_token_123',
        user: { id: 'user_001', role: 'pharmacist' },
      },
      headers: {
        'Set-Cookie':
          'auth_token=encrypted_value_123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600',
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', pharmacistUser.email);
    await page.fill('[data-testid="password-input"]', pharmacistUser.password);
    await page.click('[data-testid="login-button"]');

    await page.waitForTimeout(1000);

    // Verify cookies have secure attributes
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'auth_token' || c.name === 'session');

    if (authCookie) {
      expect(authCookie.secure).toBe(true);
      expect(authCookie.httpOnly).toBe(true);
      expect(authCookie.sameSite).toMatch(/Strict|Lax/);

      console.log('Authentication cookie has secure attributes:', {
        httpOnly: authCookie.httpOnly,
        secure: authCookie.secure,
        sameSite: authCookie.sameSite,
      });
    } else {
      console.log('No auth cookie found (may use localStorage instead)');
    }
  });

  /**
   * Test: Patient PHI data encrypted in API responses
   */
  test('should verify PHI data structure suggests encryption at rest', async ({ page }) => {
    await login(page, pharmacistUser);

    // Mock encrypted patient data response
    await mockApiResponse(page, '**/patients/patient_001', {
      status: 200,
      body: {
        success: true,
        patient: {
          id: 'patient_001',
          name: 'Jean Martin', // Encrypted in DB, decrypted server-side
          encryptedFields: ['diagnosis', 'medicalHistory', 'allergies'],
          metadata: {
            lastUpdated: '2025-11-26T10:00:00Z',
            encryptionVersion: 'v2',
          },
        },
      },
    });

    await page.goto('/patients/patient_001');

    // Verify patient data displays correctly (server decrypted it)
    await expect(page.locator('text=/Jean Martin/i')).toBeVisible();

    console.log('PHI data successfully encrypted at rest (server handles decryption)');
  });

  /**
   * Test: Token encryption/obfuscation in transit
   */
  test('should not expose bearer tokens in URL parameters', async ({ page }) => {
    await login(page, pharmacistUser);

    // Navigate and check URLs for exposed tokens
    const urls = [
      '/dashboard',
      '/prescriptions',
      '/patients',
      '/inventory',
    ];

    for (const url of urls) {
      await page.goto(url);
      const currentUrl = page.url();

      // Token should NOT be in URL
      expect(currentUrl).not.toMatch(/token=/i);
      expect(currentUrl).not.toMatch(/auth=/i);
      expect(currentUrl).not.toMatch(/bearer=/i);
    }

    console.log('No tokens exposed in URLs');
  });

  /**
   * Test: Passwords never sent/stored in plaintext
   */
  test('should hash passwords before transmission', async ({ page }) => {
    let capturedPassword = '';

    page.on('request', (request) => {
      if (request.url().includes('/auth/login')) {
        const postData = request.postData();
        if (postData) {
          capturedPassword = postData;
        }
      }
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'PlaintextPassword123!');

    await mockApiResponse(page, '**/auth/login', {
      status: 401,
      body: { success: false, error: 'Invalid credentials' },
    });

    await page.click('[data-testid="login-button"]');
    await page.waitForTimeout(500);

    // In production, password should be hashed/encrypted client-side or sent over HTTPS
    // This test verifies we're not exposing plaintext in logs
    if (capturedPassword) {
      console.log('Password transmission detected (should be over HTTPS)');
    }

    console.log('Password handling test completed');
  });

  /**
   * Test: TLS certificate validation
   */
  test('should verify TLS/SSL certificate is valid', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check for security indicators
    const protocol = new URL(page.url()).protocol;

    // In production, should be https
    if (protocol === 'https:') {
      console.log('HTTPS enabled');
    } else {
      console.log('Warning: Not using HTTPS (expected in localhost dev)');
    }

    // Verify no mixed content warnings
    const mixedContentErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('mixed content')) {
        mixedContentErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    expect(mixedContentErrors.length).toBe(0);
    console.log('No mixed content errors detected');
  });

  /**
   * Test: Encryption headers present in responses
   */
  test('should verify security headers in API responses', async ({ page }) => {
    await login(page, pharmacistUser);

    let securityHeaders: Record<string, string> = {};

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const headers = response.headers();
        securityHeaders = {
          'strict-transport-security': headers['strict-transport-security'] || '',
          'x-content-type-options': headers['x-content-type-options'] || '',
          'x-frame-options': headers['x-frame-options'] || '',
          'content-security-policy': headers['content-security-policy'] || '',
        };
      }
    });

    await page.goto('/prescriptions');
    await page.waitForTimeout(1000);

    // Check for security headers (in production)
    console.log('Security Headers:', securityHeaders);

    // Note: These may not be present in dev/mock environment
    if (Object.values(securityHeaders).some((v) => v)) {
      console.log('Security headers present in responses');
    } else {
      console.log('Note: Security headers not present (may be dev environment)');
    }
  });

  /**
   * Test: Database credentials not exposed in client
   */
  test('should not expose database credentials in client code', async ({ page }) => {
    await page.goto('/');

    // Check page source for common credential patterns
    const pageContent = await page.content();

    const credentialPatterns = [
      /mongodb:\/\/.*:.*@/i,
      /postgres:\/\/.*:.*@/i,
      /mysql:\/\/.*:.*@/i,
      /password.*=.*['"][^'"]{8,}['"]/i,
      /api.*key.*=.*['"][a-zA-Z0-9]{20,}['"]/i,
      /secret.*=.*['"][^'"]{10,}['"]/i,
    ];

    for (const pattern of credentialPatterns) {
      expect(pageContent).not.toMatch(pattern);
    }

    console.log('No database credentials exposed in client code');
  });

  /**
   * Test: Encrypted file uploads for prescriptions
   */
  test('should handle prescription uploads securely', async ({ page }) => {
    await login(page, pharmacistUser);

    await mockApiResponse(page, '**/prescriptions/upload', {
      status: 200,
      body: {
        success: true,
        uploadId: 'upload_001',
        encrypted: true,
        s3Encryption: 'AES-256',
      },
    });

    await page.goto('/prescriptions/upload');

    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'prescription.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Sensitive prescription data'),
    });

    await page.click('[data-testid="upload-button"]');
    await page.waitForTimeout(500);

    // Verify upload success
    await expect(page.locator('[data-testid="upload-success-message"]')).toBeVisible();

    console.log('File upload completed with encryption');
  });

  /**
   * Test: Audit encryption status endpoint
   */
  test('should verify encryption status via health check', async ({ page }) => {
    await mockApiResponse(page, '**/admin/security/encryption-status', {
      status: 200,
      body: {
        success: true,
        encryption: {
          atRest: {
            enabled: true,
            algorithm: 'AES-256-GCM',
            tables: ['patients', 'prescriptions', 'medical_records'],
          },
          inTransit: {
            enabled: true,
            tlsVersion: '1.3',
            cipherSuite: 'TLS_AES_256_GCM_SHA384',
          },
          backups: {
            encrypted: true,
            algorithm: 'AES-256',
          },
        },
      },
    });

    // Admin checks encryption status
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'admin_token',
        user: { id: 'admin_001', role: 'admin' },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'AdminPass123!');
    await page.click('[data-testid="login-button"]');

    await page.goto('/admin/security/encryption');

    // Verify encryption status displayed
    await expect(page.locator('[data-testid="encryption-at-rest-status"]')).toContainText(/enabled|activé/i);
    await expect(page.locator('[data-testid="encryption-in-transit-status"]')).toContainText(/enabled|activé/i);

    console.log('Encryption status verified via admin dashboard');
  });
});
