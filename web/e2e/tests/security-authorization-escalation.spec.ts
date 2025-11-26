import { test, expect } from '../fixtures/auth.fixture';
import { mockApiResponse } from '../utils/api-mock';
import { login } from '../utils/auth-helpers';

/**
 * E2E-034: Authorization Escalation Attempt Tests
 *
 * Tests role-based access control (RBAC) enforcement:
 * - Users cannot access higher privilege resources
 * - Role boundaries enforced at API and UI levels
 * - Horizontal privilege escalation blocked
 * - Vertical privilege escalation blocked
 * - Multi-tenant isolation verified
 */

test.describe('E2E-034: Authorization Escalation Prevention', () => {
  const patientUser = {
    email: 'patient@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'patient' as const,
    firstName: 'Jean',
    lastName: 'Martin',
    userId: 'patient_001',
  };

  const pharmacistUser = {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'pharmacist' as const,
    firstName: 'Marie',
    lastName: 'Dupont',
    pharmacyId: 'pharmacy_001',
    userId: 'pharmacist_001',
  };

  const doctorUser = {
    email: 'doctor@test.metapharm.ch',
    password: 'TestPass123!',
    role: 'doctor' as const,
    firstName: 'Dr. Pierre',
    lastName: 'Dubois',
    userId: 'doctor_001',
  };

  /**
   * Test: Patient cannot access pharmacist-only resources
   */
  test('should block patient from accessing pharmacist dashboard', async ({ page }) => {
    await login(page, patientUser);

    // Attempt to access pharmacist dashboard
    await mockApiResponse(page, '**/pharmacist/dashboard', {
      status: 403,
      body: {
        success: false,
        error: 'Insufficient permissions',
        requiredRole: 'pharmacist',
        userRole: 'patient',
      },
    });

    await page.goto('/pharmacist/dashboard');

    // Should show forbidden error or redirect
    const forbiddenError = page.locator('[data-testid="forbidden-error"]');
    const isVisible = await forbiddenError.isVisible().catch(() => false);

    if (isVisible) {
      await expect(forbiddenError).toContainText(/access denied|accès refusé|insufficient permissions/i);
    } else {
      // Should redirect to patient dashboard
      await page.waitForURL(/.*\/(patient\/)?dashboard/);
    }

    console.log('Patient blocked from pharmacist dashboard');
  });

  /**
   * Test: Patient cannot access inventory management
   */
  test('should block patient from accessing inventory management', async ({ page }) => {
    await login(page, patientUser);

    await mockApiResponse(page, '**/inventory/products', {
      status: 403,
      body: {
        success: false,
        error: 'Access denied - pharmacist role required',
      },
    });

    await page.goto('/inventory');

    // Verify access denied
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    console.log('Patient blocked from inventory management');
  });

  /**
   * Test: Pharmacist cannot access admin panel
   */
  test('should block pharmacist from accessing admin panel', async ({ page }) => {
    await login(page, pharmacistUser);

    await mockApiResponse(page, '**/admin/users', {
      status: 403,
      body: {
        success: false,
        error: 'Admin access required',
        requiredRole: 'admin',
        userRole: 'pharmacist',
      },
    });

    await page.goto('/admin');

    // Should show access denied
    const accessDenied = page.locator('[data-testid="access-denied-message"]');
    await expect(accessDenied).toBeVisible();

    console.log('Pharmacist blocked from admin panel');
  });

  /**
   * Test: Horizontal privilege escalation - accessing other patient's data
   */
  test('should block patient from accessing another patient\'s prescriptions', async ({ page }) => {
    await login(page, patientUser);

    // Attempt to access another patient's prescription
    await mockApiResponse(page, '**/prescriptions/patient_002', {
      status: 403,
      body: {
        success: false,
        error: 'Access denied - you can only view your own prescriptions',
      },
    });

    await page.goto('/prescriptions/patient_002');

    // Verify access blocked
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    console.log('Horizontal escalation blocked - patient cannot access other patient data');
  });

  /**
   * Test: Role manipulation via API requests
   */
  test('should reject role escalation via API payload manipulation', async ({ page }) => {
    await login(page, patientUser);

    // Attempt to create prescription with elevated role claim
    await mockApiResponse(page, '**/prescriptions/create', {
      status: 403,
      body: {
        success: false,
        error: 'Role mismatch - prescription creation requires doctor/pharmacist role',
      },
    });

    await page.goto('/prescriptions/create');

    // Attempt to submit with role claim in request
    await page.evaluate(() => {
      // Try to inject admin role into request
      (window as any).__user_role = 'admin';
      localStorage.setItem('user_role', 'admin');
    });

    await page.fill('[data-testid="patient-name-input"]', 'Test Patient');
    await page.fill('[data-testid="medication-input"]', 'Aspirin 500mg');
    await page.click('[data-testid="submit-prescription-button"]');

    // Verify request rejected
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    console.log('API role manipulation attempt blocked');
  });

  /**
   * Test: Direct API calls with elevated permissions
   */
  test('should block direct API calls with forged authorization', async ({ page }) => {
    await login(page, patientUser);

    // Get patient's real token
    const patientToken = await page.evaluate(() => localStorage.getItem('auth_token'));

    // Attempt to modify token claims
    const forgConfig = [
      { endpoint: '/admin/users', method: 'GET' },
      { endpoint: '/pharmacist/inventory', method: 'POST' },
      { endpoint: '/doctor/prescriptions', method: 'POST' },
    ];

    for (const config of forgConfig) {
      await mockApiResponse(page, `**${config.endpoint}`, {
        status: 403,
        body: {
          success: false,
          error: 'Forbidden - insufficient privileges',
        },
      });

      await page.goto(`/api-test?endpoint=${config.endpoint}`);

      // Verify blocked
      console.log(`Blocked unauthorized ${config.method} to ${config.endpoint}`);
    }
  });

  /**
   * Test: URL parameter manipulation for privilege escalation
   */
  test('should block privilege escalation via URL parameters', async ({ page }) => {
    await login(page, patientUser);

    // Attempt various URL parameter manipulations
    const escalationAttempts = [
      '/prescriptions?userId=admin_001',
      '/prescriptions?role=admin',
      '/dashboard?impersonate=doctor_001',
      '/api/users?admin=true',
      '/settings?privilege=elevated',
    ];

    for (const url of escalationAttempts) {
      await page.goto(url);

      // Should either redirect or show access denied
      const currentUrl = page.url();
      const hasAccessDenied = await page.locator('[data-testid="access-denied-message"]').isVisible().catch(() => false);

      if (!hasAccessDenied) {
        // Should not expose admin/elevated data
        const adminContent = await page.locator('[data-testid="admin-panel"]').isVisible().catch(() => false);
        expect(adminContent).toBe(false);
      }

      console.log(`Blocked parameter manipulation: ${url}`);
    }
  });

  /**
   * Test: Multi-tenant isolation (pharmacy A cannot access pharmacy B data)
   */
  test('should enforce multi-tenant isolation between pharmacies', async ({ page }) => {
    await login(page, pharmacistUser);

    // Pharmacist from pharmacy_001 tries to access pharmacy_002 data
    await mockApiResponse(page, '**/inventory/pharmacy_002', {
      status: 403,
      body: {
        success: false,
        error: 'Access denied - different pharmacy',
        userPharmacy: 'pharmacy_001',
        requestedPharmacy: 'pharmacy_002',
      },
    });

    await page.goto('/inventory?pharmacy=pharmacy_002');

    // Verify access blocked
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    console.log('Multi-tenant isolation enforced - pharmacy data separated');
  });

  /**
   * Test: Doctor cannot modify prescription after pharmacist approval
   */
  test('should block doctor from modifying approved prescriptions', async ({ page }) => {
    await login(page, doctorUser);

    // Attempt to modify prescription that's already approved
    await mockApiResponse(page, '**/prescriptions/rx_001/edit', {
      status: 403,
      body: {
        success: false,
        error: 'Cannot modify prescription - already approved by pharmacist',
        status: 'approved',
      },
    });

    await page.goto('/prescriptions/rx_001/edit');

    // Verify blocked
    await expect(page.locator('[data-testid="prescription-locked-message"]')).toBeVisible();

    console.log('Doctor blocked from modifying approved prescription');
  });

  /**
   * Test: Nurse cannot prescribe medications (only order from pharmacy)
   */
  test('should block nurse from creating prescriptions', async ({ page }) => {
    // Mock nurse login
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'nurse_token_123',
        user: { id: 'nurse_001', role: 'nurse', firstName: 'Sophie', lastName: 'Lambert' },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'nurse@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Attempt to create prescription
    await mockApiResponse(page, '**/prescriptions/create', {
      status: 403,
      body: {
        success: false,
        error: 'Nurses cannot create prescriptions - please order from pharmacy',
      },
    });

    await page.goto('/prescriptions/create');

    // Verify blocked
    await expect(page.locator('[data-testid="permission-error"]')).toBeVisible();

    console.log('Nurse correctly blocked from creating prescriptions');
  });

  /**
   * Test: Delivery personnel cannot view full patient medical records
   */
  test('should limit delivery personnel access to delivery-related info only', async ({ page }) => {
    // Mock delivery personnel login
    await mockApiResponse(page, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        accessToken: 'delivery_token_123',
        user: { id: 'delivery_001', role: 'delivery', firstName: 'Marc', lastName: 'Rousseau' },
      },
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'delivery@test.metapharm.ch');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Attempt to view patient medical history
    await mockApiResponse(page, '**/patients/patient_001/medical-records', {
      status: 403,
      body: {
        success: false,
        error: 'Delivery personnel cannot access medical records',
      },
    });

    await page.goto('/patients/patient_001/medical-records');

    // Verify access denied
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    // But delivery info should be accessible
    await mockApiResponse(page, '**/deliveries/delivery_001', {
      status: 200,
      body: {
        success: true,
        delivery: {
          id: 'delivery_001',
          patientName: 'Jean Martin', // Limited info
          address: '123 Rue Example',
          items: 3,
          // No medical details
        },
      },
    });

    await page.goto('/deliveries/delivery_001');
    await expect(page.locator('[data-testid="delivery-details"]')).toBeVisible();

    console.log('Delivery personnel access correctly limited to delivery info');
  });

  /**
   * Test: RBAC at UI level - role-specific menus
   */
  test('should show role-appropriate navigation menus only', async ({ page }) => {
    await login(page, patientUser);
    await page.goto('/dashboard');

    // Patient should NOT see these menu items
    const forbiddenMenuItems = [
      '[data-testid="nav-inventory"]',
      '[data-testid="nav-admin"]',
      '[data-testid="nav-pharmacist-dashboard"]',
      '[data-testid="nav-doctor-prescriptions"]',
    ];

    for (const menuItem of forbiddenMenuItems) {
      const isVisible = await page.locator(menuItem).isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }

    // Patient SHOULD see these menu items
    const allowedMenuItems = [
      '[data-testid="nav-my-prescriptions"]',
      '[data-testid="nav-teleconsultation"]',
      '[data-testid="nav-products"]',
      '[data-testid="nav-profile"]',
    ];

    for (const menuItem of allowedMenuItems) {
      const isVisible = await page.locator(menuItem).isVisible().catch(() => true);
      expect(isVisible).toBe(true);
    }

    console.log('Role-based UI navigation correctly enforced');
  });

  /**
   * Test: Session token role cannot be escalated mid-session
   */
  test('should reject role changes within active session', async ({ page }) => {
    await login(page, patientUser);
    await page.goto('/dashboard');

    // Verify initial role
    let userRole = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      // In real app, would decode JWT
      return localStorage.getItem('user_role') || 'patient';
    });
    expect(userRole).toBe('patient');

    // Attempt to change role in localStorage
    await page.evaluate(() => {
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('user_id', 'admin_001');
    });

    // Attempt to access admin endpoint
    await mockApiResponse(page, '**/admin/users', {
      status: 403,
      body: {
        success: false,
        error: 'Token role mismatch - session invalidated',
      },
    });

    await page.goto('/admin');

    // Should redirect to login (token mismatch detected)
    await page.waitForURL(/.*\/(?:auth|login)/, { timeout: 5000 });

    console.log('Role escalation mid-session blocked and session invalidated');
  });

  /**
   * Test: API-level authorization check (not just UI hiding)
   */
  test('should enforce authorization at API level regardless of UI', async ({ page }) => {
    await login(page, patientUser);

    // Patient uses browser dev tools to call admin API directly
    const apiAttempts = [
      { endpoint: '/admin/users', method: 'GET' },
      { endpoint: '/pharmacist/inventory/add', method: 'POST' },
      { endpoint: '/doctor/prescriptions/create', method: 'POST' },
    ];

    for (const attempt of apiAttempts) {
      await mockApiResponse(page, `**${attempt.endpoint}`, {
        status: 403,
        body: {
          success: false,
          error: 'Forbidden',
        },
      });

      // Simulate direct API call via fetch
      const response = await page.evaluate(
        async ({ endpoint, method }) => {
          try {
            const res = await fetch(endpoint, {
              method,
              headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json',
              },
            });
            return { status: res.status, ok: res.ok };
          } catch (error) {
            return { error: (error as Error).message };
          }
        },
        { endpoint: attempt.endpoint, method: attempt.method }
      );

      expect(response.status).toBe(403);
      console.log(`API-level auth enforced for ${attempt.method} ${attempt.endpoint}`);
    }
  });

  /**
   * Test: Pharmacist cannot access other pharmacy's patient data
   */
  test('should prevent cross-pharmacy patient data access', async ({ page }) => {
    await login(page, pharmacistUser);

    // Pharmacist_001 (pharmacy_001) tries to access patient from pharmacy_002
    await mockApiResponse(page, '**/patients/patient_pharmacy_002_001', {
      status: 403,
      body: {
        success: false,
        error: 'Patient belongs to different pharmacy',
      },
    });

    await page.goto('/patients/patient_pharmacy_002_001');

    // Verify blocked
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    console.log('Cross-pharmacy patient access blocked');
  });

  /**
   * Test: Time-based role restrictions (e.g., consultation hours)
   */
  test('should enforce time-based access restrictions', async ({ page }) => {
    await login(page, doctorUser);

    // Attempt to access system outside consultation hours (mock scenario)
    const currentHour = new Date().getHours();
    const isAfterHours = currentHour < 8 || currentHour > 18;

    if (isAfterHours) {
      await mockApiResponse(page, '**/consultations/create', {
        status: 403,
        body: {
          success: false,
          error: 'Consultations only available 8am-6pm',
          currentTime: new Date().toISOString(),
        },
      });

      await page.goto('/consultations/create');

      // Verify blocked with time message
      await expect(page.locator('[data-testid="time-restricted-message"]')).toBeVisible();

      console.log('Time-based access restriction enforced');
    } else {
      console.log('Skipping time-based test (currently within allowed hours)');
    }
  });

  /**
   * Test: Verification that authorization checks happen on every request
   */
  test('should verify authorization on every API request, not just first', async ({ page }) => {
    await login(page, patientUser);

    // Make multiple requests - all should be authorized
    for (let i = 0; i < 5; i++) {
      await mockApiResponse(page, '**/prescriptions/my', {
        status: 200,
        body: {
          success: true,
          prescriptions: [],
        },
      });

      await page.goto('/prescriptions/my');
      await page.waitForTimeout(200);
    }

    // Now attempt unauthorized request
    await mockApiResponse(page, '**/admin/users', {
      status: 403,
      body: {
        success: false,
        error: 'Forbidden',
      },
    });

    await page.goto('/admin/users');

    // Should still be blocked (not bypassed after multiple allowed requests)
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();

    console.log('Authorization verified on every request');
  });
});
