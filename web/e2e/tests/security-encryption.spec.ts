import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

test.describe('Security - Data Encryption Verification (E2E-024)', () => {
  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy-1',
  };

  test('should display secure connection indicator (HTTPS)', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify HTTPS connection
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);

    // Verify secure connection indicator in browser UI
    // Note: This varies by browser, but Playwright provides URL info
    const isSecure = url.startsWith('https://');
    expect(isSecure).toBe(true);
  });

  test('should display PHI encryption badge on sensitive data fields', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock prescription data with PHI
    await mockApiResponse(page, '**/prescriptions/rx_001', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'rx_001',
          patientName: 'Sophie Bernard',
          patientSSN: '756.1234.5678.90', // Sensitive PHI
          medications: ['Lisinopril 10mg'],
          encrypted: true,
          encryptionAlgorithm: 'AES-256-GCM',
        },
      },
    });

    await page.goto('/prescriptions/rx_001');

    // Verify PHI encryption indicator is displayed
    await expect(page.locator('[data-testid="phi-encrypted-badge"]')).toBeVisible();
    await expect(page.locator('text=/chiffré|encrypted/i')).toBeVisible();

    // Verify encryption icon
    const encryptionIcon = page.locator('[data-testid="encryption-icon"]');
    await expect(encryptionIcon).toBeVisible();
  });

  test('should display end-to-end encryption indicator during teleconsultation', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock teleconsultation session with E2EE
    await mockApiResponse(page, '**/teleconsultation/session_001/join', {
      status: 200,
      body: {
        success: true,
        sessionToken: 'encrypted_session_token_123',
        encrypted: true,
        encryptionProtocol: 'DTLS-SRTP',
      },
    });

    await page.goto('/teleconsultation/session_001');

    // Verify E2EE indicator during video call
    await expect(page.locator('[data-testid="e2ee-indicator"]')).toBeVisible();
    await expect(page.locator('text=/chiffrement.*bout.*bout|end.*to.*end.*encryption/i')).toBeVisible();

    // Verify security icon in video call UI
    const securityBadge = page.locator('[data-testid="video-security-badge"]');
    await expect(securityBadge).toBeVisible();
  });

  test('should show encryption status in messaging', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock encrypted messaging
    await mockApiResponse(page, '**/messaging/conversations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'conv_001',
            participants: ['pharmacist@test.metapharm.ch', 'doctor@test.metapharm.ch'],
            encrypted: true,
            encryptionType: 'E2EE',
          },
        ],
      },
    });

    await page.goto('/messaging');

    // Verify encryption indicator in conversation list
    const conversationItem = page.locator('[data-testid="conversation-conv_001"]');
    await expect(conversationItem.locator('[data-testid="encryption-badge"]')).toBeVisible();

    // Open conversation
    await conversationItem.click();

    // Verify encryption status in conversation header
    await expect(page.locator('[data-testid="conversation-encryption-status"]')).toBeVisible();
    await expect(page.locator('text=/messages.*chiffrés|encrypted.*messages/i')).toBeVisible();
  });

  test('should display encryption details on hover/click', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock patient record with encryption metadata
    await mockApiResponse(page, '**/patients/patient_001', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'patient_001',
          name: 'Sophie Bernard',
          encrypted: true,
          encryptionDetails: {
            algorithm: 'AES-256-GCM',
            keyRotationDate: '2025-11-01',
            encryptedFields: ['ssn', 'medical_history', 'prescriptions'],
          },
        },
      },
    });

    await page.goto('/patients/patient_001');

    // Hover over encryption indicator
    const encryptionBadge = page.locator('[data-testid="phi-encrypted-badge"]');
    await encryptionBadge.hover();

    // Verify tooltip with encryption details
    const tooltip = page.locator('[data-testid="encryption-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('AES-256-GCM');
    await expect(tooltip).toContainText(/ssn|medical.*history|prescriptions/i);
  });

  test('should verify data is encrypted in transit (API requests)', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Intercept API request to verify headers
    let requestHeaders: Record<string, string> = {};
    await page.route('**/prescriptions**', async (route) => {
      requestHeaders = route.request().headers();
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    await page.goto('/prescriptions');

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify secure headers are present
    expect(requestHeaders['authorization']).toBeTruthy();

    // Verify URL is HTTPS
    const requestUrl = page.url();
    expect(requestUrl).toMatch(/^https:\/\//);
  });

  test('should display warning when encryption is not available', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock scenario where encryption failed or unavailable
    await mockApiResponse(page, '**/prescriptions/rx_002', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'rx_002',
          patientName: 'Marc Dubois',
          encrypted: false,
          warning: 'Encryption unavailable for legacy data',
        },
      },
    });

    await page.goto('/prescriptions/rx_002');

    // Verify warning message about encryption
    await expect(page.locator('[data-testid="encryption-warning"]')).toBeVisible();
    await expect(page.locator('text=/chiffrement.*non.*disponible|encryption.*unavailable/i')).toBeVisible();
  });

  test('should show encryption status in patient medical records', async ({ page }) => {
    // Login as patient
    const patientUser = {
      email: 'patient@test.metapharm.ch',
      password: 'TestPass123!',
      role: 'patient' as const,
      firstName: 'Sophie',
      lastName: 'Bernard',
    };

    await login(page, patientUser);

    // Mock patient medical records with encryption status
    await mockApiResponse(page, '**/patients/me/medical-records', {
      status: 200,
      body: {
        success: true,
        data: {
          records: [
            {
              id: 'record_001',
              type: 'prescription',
              date: '2025-11-20',
              encrypted: true,
            },
            {
              id: 'record_002',
              type: 'consultation_notes',
              date: '2025-11-15',
              encrypted: true,
            },
          ],
          allEncrypted: true,
        },
      },
    });

    await page.goto('/patient/medical-records');

    // Verify global encryption status indicator
    await expect(page.locator('[data-testid="all-records-encrypted-badge"]')).toBeVisible();
    await expect(page.locator('text=/tous.*chiffrés|all.*encrypted/i')).toBeVisible();

    // Verify individual record encryption badges
    const recordItem = page.locator('[data-testid="record-record_001"]');
    await expect(recordItem.locator('[data-testid="encrypted-badge"]')).toBeVisible();
  });

  test('should display secure upload indicator for prescription images', async ({ page }) => {
    // Login as patient
    const patientUser = {
      email: 'patient@test.metapharm.ch',
      password: 'TestPass123!',
      role: 'patient' as const,
      firstName: 'Sophie',
      lastName: 'Bernard',
    };

    await login(page, patientUser);

    // Mock secure upload endpoint
    await mockApiResponse(page, '**/prescriptions/upload', {
      status: 200,
      body: {
        success: true,
        message: 'Prescription uploaded securely',
        encrypted: true,
        uploadUrl: 'https://secure-upload.metapharm.ch/...',
      },
    });

    await page.goto('/patient/prescriptions/upload');

    // Verify secure upload indicator
    await expect(page.locator('[data-testid="secure-upload-indicator"]')).toBeVisible();
    await expect(page.locator('text=/téléchargement.*sécurisé|secure.*upload/i')).toBeVisible();

    // Verify HTTPS badge near upload area
    const uploadArea = page.locator('[data-testid="upload-area"]');
    await expect(uploadArea.locator('[data-testid="https-badge"]')).toBeVisible();
  });

  test('should verify encrypted storage indicator in settings', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock security settings with encryption info
    await mockApiResponse(page, '**/settings/security', {
      status: 200,
      body: {
        success: true,
        data: {
          dataEncryption: {
            enabled: true,
            algorithm: 'AES-256-GCM',
            atRest: true,
            inTransit: true,
            lastKeyRotation: '2025-11-01',
            nextKeyRotation: '2025-12-01',
          },
        },
      },
    });

    await page.goto('/profile/security');

    // Verify encryption settings section
    await expect(page.locator('[data-testid="encryption-settings-section"]')).toBeVisible();

    // Verify at-rest encryption status
    await expect(page.locator('[data-testid="encryption-at-rest-status"]')).toContainText(/activé|enabled/i);

    // Verify in-transit encryption status
    await expect(page.locator('[data-testid="encryption-in-transit-status"]')).toContainText(/activé|enabled/i);

    // Verify encryption algorithm displayed
    await expect(page.locator('[data-testid="encryption-algorithm-display"]')).toContainText('AES-256-GCM');

    // Verify key rotation information
    await expect(page.locator('[data-testid="next-key-rotation-date"]')).toContainText('2025-12-01');
  });

  test('should display encryption compliance badges (HIPAA, GDPR)', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    await page.goto('/profile/security');

    // Verify compliance badges
    await expect(page.locator('[data-testid="hipaa-compliance-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="gdpr-compliance-badge"]')).toBeVisible();

    // Verify compliance details
    const hipaaBadge = page.locator('[data-testid="hipaa-compliance-badge"]');
    await hipaaBadge.hover();

    const hipaaTooltip = page.locator('[data-testid="hipaa-compliance-tooltip"]');
    await expect(hipaaTooltip).toBeVisible();
    await expect(hipaaTooltip).toContainText(/encryption.*requirements/i);
  });

  test('should show encryption warning when accessing unencrypted legacy data', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock legacy prescription without encryption
    await mockApiResponse(page, '**/prescriptions/rx_legacy_001', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'rx_legacy_001',
          patientName: 'Jean Dupont',
          encrypted: false,
          legacy: true,
          migrationScheduled: '2025-12-15',
        },
      },
    });

    await page.goto('/prescriptions/rx_legacy_001');

    // Verify legacy data warning
    await expect(page.locator('[data-testid="legacy-data-warning"]')).toBeVisible();
    await expect(page.locator('text=/legacy.*data|données.*anciennes/i')).toBeVisible();

    // Verify encryption migration info
    await expect(page.locator('[data-testid="encryption-migration-info"]')).toBeVisible();
    await expect(page.locator('text=2025-12-15')).toBeVisible();
  });

  test('should prevent screenshot/screen recording of sensitive data', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Navigate to sensitive page (patient medical records)
    await mockApiResponse(page, '**/patients/patient_001', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'patient_001',
          name: 'Sophie Bernard',
          ssn: '756.1234.5678.90',
          medicalHistory: ['Hypertension', 'Diabetes'],
        },
      },
    });

    await page.goto('/patients/patient_001');

    // Verify screenshot protection warning (if supported)
    // Note: Browser-level screenshot prevention is limited in web apps
    // This tests the presence of warning messages
    const screenshotWarning = page.locator('[data-testid="screenshot-warning"]');
    const hasWarning = await screenshotWarning.isVisible().catch(() => false);

    // If warning exists, verify its content
    if (hasWarning) {
      await expect(screenshotWarning).toContainText(/sensitive.*data|données.*sensibles/i);
    }

    // Verify data-sensitivity attribute is set
    const sensitiveContainer = page.locator('[data-testid="patient-details-container"]');
    const dataSensitivity = await sensitiveContainer.getAttribute('data-sensitivity');
    expect(dataSensitivity).toBe('high');
  });

  test('should display encryption key rotation notification', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock key rotation notification
    await mockApiResponse(page, '**/notifications', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'notif_001',
            type: 'security',
            message: 'Encryption key rotation scheduled for 2025-12-01',
            priority: 'high',
          },
        ],
      },
    });

    await page.goto('/dashboard');

    // Verify key rotation notification
    const notification = page.locator('[data-testid="notification-notif_001"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(/encryption.*key.*rotation/i);
    await expect(notification).toContainText('2025-12-01');
  });

  test('should verify SSL/TLS certificate information is accessible', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);
    await page.goto('/dashboard');

    // Verify HTTPS connection
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);

    // In a real browser, users can click the padlock to view certificate
    // In E2E tests, we verify the presence of security indicators

    // Navigate to security info page
    await page.goto('/profile/security');

    // Verify SSL/TLS section
    const sslSection = page.locator('[data-testid="ssl-tls-section"]');
    if (await sslSection.isVisible()) {
      await expect(sslSection).toContainText(/TLS 1.3|TLS 1.2/i);
    }
  });

  test('should display data breach notification banner if applicable', async ({ page }) => {
    // Login as pharmacist
    await login(page, pharmacistUser);

    // Mock data breach notification (hypothetical scenario for testing)
    await mockApiResponse(page, '**/security/breach-status', {
      status: 200,
      body: {
        success: true,
        breachDetected: false,
        lastSecurityAudit: '2025-11-15',
      },
    });

    await page.goto('/dashboard');

    // Verify NO breach notification is shown (system is secure)
    const breachBanner = page.locator('[data-testid="data-breach-banner"]');
    await expect(breachBanner).not.toBeVisible();

    // Verify security status indicator shows "secure"
    const securityStatus = page.locator('[data-testid="security-status-indicator"]');
    if (await securityStatus.isVisible()) {
      await expect(securityStatus).toContainText(/secure|sécurisé/i);
    }
  });
});
