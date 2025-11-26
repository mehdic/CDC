import { test, expect } from '../fixtures/auth.fixture';
import { DeliveryPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E Tests for Delivery Driver Workflows
 *
 * Covers:
 * - E2E-011: Delivery driver login
 * - E2E-012: Delivery request acceptance
 * - E2E-013: GPS tracking during delivery
 * - E2E-014: QR code scanning
 * - E2E-015: Delivery completion flow
 */

// Delivery driver test user
const deliveryDriver = {
  email: 'driver@test.metapharm.ch',
  password: 'TestPass123!',
  role: 'delivery_driver',
  firstName: 'Pierre',
  lastName: 'Leclerc',
  driverId: 'driver-001',
};

test.describe('Delivery Driver Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock delivery requests list
    await mockApiResponse(page, '**/delivery/requests**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'delivery_001',
            patientName: 'Sophie Bernard',
            address: 'Rue de la Gare 12, 1200 Genève',
            status: 'pending',
            prescriptionId: 'rx_001',
            specialHandling: false,
            estimatedDistance: 3.2,
            priority: 'normal',
          },
          {
            id: 'delivery_002',
            patientName: 'Marc Dubois',
            address: 'Avenue du Lac 45, 1204 Genève',
            status: 'accepted',
            prescriptionId: 'rx_controlled_001',
            specialHandling: true,
            handlingNotes: 'Controlled substance - signature required',
            estimatedDistance: 5.7,
            priority: 'high',
          },
          {
            id: 'delivery_003',
            patientName: 'Claire Martin',
            address: 'Chemin des Fleurs 8, 1205 Genève',
            status: 'pending',
            prescriptionId: 'rx_003',
            specialHandling: true,
            handlingNotes: 'Cold chain - keep below 8°C',
            estimatedDistance: 4.5,
            priority: 'urgent',
          },
        ],
        total: 3,
      },
    });
  });

  /**
   * E2E-011: Delivery driver login
   * Tests authentication flow for delivery personnel
   */
  test.describe('E2E-011: Delivery Driver Login', () => {
    test('should allow driver to log in with valid credentials', async ({ page, loginPage }) => {
      await loginPage.goto();

      // Login with delivery driver credentials
      await loginPage.login({
        email: deliveryDriver.email,
        password: deliveryDriver.password,
      });

      // Should redirect to delivery driver dashboard
      await expect(page).toHaveURL(/.*\/deliveries\/driver-dashboard/);
      await expect(page.getByText(/Bienvenue|Welcome/i)).toBeVisible();
      await expect(page.getByText(deliveryDriver.firstName)).toBeVisible();
    });

    test('should display driver-specific dashboard after login', async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login({
        email: deliveryDriver.email,
        password: deliveryDriver.password,
      });

      // Verify driver dashboard elements
      await expect(page.getByRole('heading', { name: /Mes Livraisons|My Deliveries/i })).toBeVisible();
      await expect(page.locator('[data-testid="pending-deliveries"]')).toBeVisible();
      await expect(page.locator('[data-testid="route-map"]')).toBeVisible();
    });

    test('should reject login with invalid driver credentials', async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login({
        email: 'invalid@driver.ch',
        password: 'WrongPass123!',
      });

      // Should show error message
      await expect(loginPage.errorAlert).toBeVisible();
      await expect(loginPage.errorAlert).toContainText(/identifiants invalides|invalid credentials/i);
    });

    test('should handle session management correctly', async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login({
        email: deliveryDriver.email,
        password: deliveryDriver.password,
      });

      // Verify session token stored
      const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(authToken).not.toBeNull();

      // Verify driver role stored
      const userRole = await page.evaluate(() => localStorage.getItem('user_role'));
      expect(userRole).toBe('delivery_driver');
    });
  });

  /**
   * E2E-012: Delivery request acceptance
   * Tests driver accepting and rejecting delivery requests
   */
  test.describe('E2E-012: Delivery Request Acceptance', () => {
    test('should display pending delivery requests', async ({ pharmacistPage }) => {
      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Verify pending requests visible
      await expect(pharmacistPage.locator('[data-testid="delivery-delivery_001"]')).toBeVisible();
      await expect(pharmacistPage.getByText('Sophie Bernard')).toBeVisible();
      await expect(pharmacistPage.getByText('Rue de la Gare 12')).toBeVisible();
    });

    test('should accept a delivery request', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/accept', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'accepted',
            assignedDriver: deliveryDriver.driverId,
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Accept delivery request
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /accepter|accept/i }).click();

      // Verify acceptance confirmation
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/acceptée|accepted/i);
    });

    test('should reject a delivery request with reason', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/reject', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'rejected',
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Reject delivery request
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /refuser|reject/i }).click();

      // Provide rejection reason
      await pharmacistPage.getByLabel(/raison|reason/i).fill('Vehicle maintenance - unavailable');
      await pharmacistPage.getByRole('button', { name: /confirmer|confirm/i }).click();

      // Verify rejection confirmation
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/refusée|rejected/i);
    });

    test('should display special handling requirements clearly', async ({ pharmacistPage }) => {
      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Click on controlled substance delivery
      await pharmacistPage.locator('[data-testid="delivery-delivery_002"]').click();

      // Verify special handling badge visible
      await expect(pharmacistPage.locator('[data-testid="special-handling-badge"]')).toBeVisible();
      await expect(pharmacistPage.getByText(/Controlled substance/i)).toBeVisible();
      await expect(pharmacistPage.getByText(/signature required/i)).toBeVisible();

      // Click on cold chain delivery
      await pharmacistPage.locator('[data-testid="delivery-delivery_003"]').click();

      // Verify cold chain requirements
      await expect(pharmacistPage.locator('[data-testid="special-handling-badge"]')).toBeVisible();
      await expect(pharmacistPage.getByText(/Cold chain/i)).toBeVisible();
      await expect(pharmacistPage.getByText(/keep below 8°C/i)).toBeVisible();
    });

    test('should filter delivery requests by priority', async ({ pharmacistPage }) => {
      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Filter by urgent priority
      await pharmacistPage.getByRole('button', { name: /filtrer|filter/i }).click();
      await pharmacistPage.getByLabel(/priorité|priority/i).selectOption('urgent');
      await pharmacistPage.getByRole('button', { name: /appliquer|apply/i }).click();

      // Verify only urgent deliveries shown
      await expect(pharmacistPage.locator('[data-testid="delivery-delivery_003"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="delivery-delivery_001"]')).not.toBeVisible();
    });
  });

  /**
   * E2E-013: GPS tracking during delivery
   * Tests real-time GPS tracking and route optimization
   */
  test.describe('E2E-013: GPS Tracking During Delivery', () => {
    test('should display GPS tracking map for active delivery', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/location', {
        status: 200,
        body: {
          success: true,
          location: {
            latitude: 46.2044,
            longitude: 6.1432,
            timestamp: new Date().toISOString(),
            accuracy: 10,
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Track accepted delivery
      await deliveryPage.trackDelivery('delivery_002');

      // Verify map visible with driver location
      await expect(pharmacistPage.locator('[data-testid="tracking-map"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="driver-marker"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="destination-marker"]')).toBeVisible();
    });

    test('should update driver location in real-time', async ({ pharmacistPage }) => {
      // Mock initial location
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/location', {
        status: 200,
        body: {
          success: true,
          location: {
            latitude: 46.2044,
            longitude: 6.1432,
            timestamp: new Date().toISOString(),
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();
      await deliveryPage.trackDelivery('delivery_002');

      // Wait for initial location
      await expect(pharmacistPage.locator('[data-testid="driver-marker"]')).toBeVisible();

      // Mock updated location (simulating movement)
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/location', {
        status: 200,
        body: {
          success: true,
          location: {
            latitude: 46.2050, // Slightly moved
            longitude: 6.1440,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Wait for location update (real app would have websocket updates)
      await pharmacistPage.waitForTimeout(2000);

      // Verify location updated on map
      await expect(pharmacistPage.locator('[data-testid="driver-marker"]')).toBeVisible();
    });

    test('should display optimized route with turn-by-turn directions', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/route', {
        status: 200,
        body: {
          success: true,
          route: {
            distance: 5.7,
            duration: 12,
            steps: [
              { instruction: 'Head north on Rue de la Gare', distance: 0.5 },
              { instruction: 'Turn right onto Avenue du Lac', distance: 2.3 },
              { instruction: 'Continue straight', distance: 1.9 },
              { instruction: 'Destination on the left', distance: 0.1 },
            ],
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();
      await deliveryPage.trackDelivery('delivery_002');

      // Verify route directions visible
      await expect(pharmacistPage.locator('[data-testid="route-directions"]')).toBeVisible();
      await expect(pharmacistPage.getByText('Head north on Rue de la Gare')).toBeVisible();
      await expect(pharmacistPage.getByText('5.7 km')).toBeVisible();
      await expect(pharmacistPage.getByText('12 min')).toBeVisible();
    });

    test('should display ETA and update dynamically', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/eta', {
        status: 200,
        body: {
          success: true,
          eta: new Date(Date.now() + 12 * 60 * 1000).toISOString(), // 12 minutes from now
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();
      await deliveryPage.trackDelivery('delivery_002');

      // Verify ETA displayed
      await expect(pharmacistPage.locator('[data-testid="delivery-eta"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="delivery-eta"]')).toContainText(/12 min/i);
    });

    test('should handle offline GPS gracefully', async ({ pharmacistPage }) => {
      // Mock location API failure
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_002/location', {
        status: 503,
        body: {
          success: false,
          error: 'GPS temporarily unavailable',
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();
      await deliveryPage.trackDelivery('delivery_002');

      // Verify error message shown
      await expect(pharmacistPage.locator('[data-testid="gps-error"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="gps-error"]')).toContainText(/GPS.*unavailable/i);
    });
  });

  /**
   * E2E-014: QR code scanning
   * Tests QR code scanning for delivery verification
   */
  test.describe('E2E-014: QR Code Scanning', () => {
    test('should display QR code for package verification', async ({ pharmacistPage }) => {
      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // View QR code for delivery
      await deliveryPage.verifyQRCode('delivery_001');

      // Verify QR code visible
      await expect(pharmacistPage.locator('[data-testid="qr-code"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="qr-code-id"]')).toContainText('delivery_001');
    });

    test('should scan QR code to verify package pickup', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/scan-pickup', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'picked_up',
            pickedUpAt: new Date().toISOString(),
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Open scanner for pickup
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /scanner.*pickup|scan pickup/i }).click();

      // Mock QR scan result
      await pharmacistPage.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent('qr-scanned', {
            detail: { code: 'delivery_001', type: 'pickup' },
          })
        );
      });

      // Verify pickup confirmed
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/picked up|récupéré/i);
    });

    test('should scan QR code to verify package delivery', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/scan-delivery', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_002',
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Open scanner for delivery
      await pharmacistPage.locator('[data-testid="delivery-delivery_002"]').click();
      await pharmacistPage.getByRole('button', { name: /scanner.*delivery|scan delivery/i }).click();

      // Mock QR scan result
      await pharmacistPage.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent('qr-scanned', {
            detail: { code: 'delivery_002', type: 'delivery' },
          })
        );
      });

      // Verify delivery confirmed
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/delivered|livré/i);
    });

    test('should reject invalid QR code', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/scan-pickup', {
        status: 400,
        body: {
          success: false,
          error: 'Invalid QR code',
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Open scanner
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /scanner.*pickup|scan pickup/i }).click();

      // Mock invalid QR scan
      await pharmacistPage.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent('qr-scanned', {
            detail: { code: 'invalid_code_123', type: 'pickup' },
          })
        );
      });

      // Verify error shown
      await expect(pharmacistPage.locator('[data-testid="error-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="error-toast"]')).toContainText(/invalid.*qr/i);
    });

    test('should display package contents after QR scan', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/delivery_001/contents', {
        status: 200,
        body: {
          success: true,
          contents: [
            { medication: 'Ibuprofen 400mg', quantity: 30, instruction: 'Take with food' },
            { medication: 'Vitamin D 1000 IU', quantity: 60, instruction: 'Once daily' },
          ],
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Verify QR code
      await deliveryPage.verifyQRCode('delivery_001');

      // Click to view contents
      await pharmacistPage.getByRole('button', { name: /voir contenu|view contents/i }).click();

      // Verify package contents displayed
      await expect(pharmacistPage.getByText('Ibuprofen 400mg')).toBeVisible();
      await expect(pharmacistPage.getByText('30')).toBeVisible();
      await expect(pharmacistPage.getByText('Vitamin D 1000 IU')).toBeVisible();
    });
  });

  /**
   * E2E-015: Delivery completion flow
   * Tests full delivery completion workflow including proof of delivery
   */
  test.describe('E2E-015: Delivery Completion Flow', () => {
    test('should complete delivery with signature capture', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/complete', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_002',
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Start completion flow
      await pharmacistPage.locator('[data-testid="delivery-delivery_002"]').click();
      await pharmacistPage.getByRole('button', { name: /terminer|complete/i }).click();

      // Capture signature (controlled substance)
      await expect(pharmacistPage.locator('[data-testid="signature-pad"]')).toBeVisible();

      // Mock signature capture
      await pharmacistPage.evaluate(() => {
        const canvas = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(150, 150);
            ctx.stroke();
          }
        }
      });

      await pharmacistPage.getByRole('button', { name: /confirmer signature|confirm signature/i }).click();

      // Complete delivery
      await pharmacistPage.getByRole('button', { name: /confirmer livraison|confirm delivery/i }).click();

      // Verify completion
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/completed|terminée/i);
    });

    test('should require photo proof for controlled substances', async ({ pharmacistPage }) => {
      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Start completion for controlled substance
      await pharmacistPage.locator('[data-testid="delivery-delivery_002"]').click();
      await pharmacistPage.getByRole('button', { name: /terminer|complete/i }).click();

      // Verify photo capture required
      await expect(pharmacistPage.locator('[data-testid="photo-capture-section"]')).toBeVisible();
      await expect(pharmacistPage.getByText(/photo.*required|photo.*requise/i)).toBeVisible();
    });

    test('should handle failed delivery with reason', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/fail', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'failed',
            failureReason: 'Patient not home',
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Mark as failed
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /échec|failed/i }).click();

      // Select failure reason
      await pharmacistPage.getByLabel(/raison|reason/i).selectOption('patient_not_home');
      await pharmacistPage.getByLabel(/notes/i).fill('Doorbell not working, tried calling - no answer');
      await pharmacistPage.getByRole('button', { name: /confirmer|confirm/i }).click();

      // Verify failure recorded
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toContainText(/recorded|enregistré/i);
    });

    test('should automatically notify pharmacy and patient on completion', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/complete', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'completed',
            notifications: {
              pharmacy: true,
              patient: true,
            },
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Complete delivery
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /terminer|complete/i }).click();

      // Mock signature
      await pharmacistPage.evaluate(() => {
        const canvas = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(150, 150);
            ctx.stroke();
          }
        }
      });

      await pharmacistPage.getByRole('button', { name: /confirmer signature|confirm signature/i }).click();
      await pharmacistPage.getByRole('button', { name: /confirmer livraison|confirm delivery/i }).click();

      // Verify notification confirmation
      await expect(pharmacistPage.locator('[data-testid="notification-sent"]')).toBeVisible();
    });

    test('should display delivery statistics after completion', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/statistics', {
        status: 200,
        body: {
          success: true,
          statistics: {
            totalDeliveries: 47,
            completedToday: 12,
            averageTime: 18,
            successRate: 96.5,
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // View statistics
      await pharmacistPage.getByRole('button', { name: /statistiques|statistics/i }).click();

      // Verify statistics displayed
      await expect(pharmacistPage.getByText('47')).toBeVisible(); // Total deliveries
      await expect(pharmacistPage.getByText('12')).toBeVisible(); // Completed today
      await expect(pharmacistPage.getByText('18 min')).toBeVisible(); // Average time
      await expect(pharmacistPage.getByText('96.5%')).toBeVisible(); // Success rate
    });

    test('should update delivery history after completion', async ({ pharmacistPage }) => {
      await mockApiResponse(pharmacistPage, '**/delivery/*/complete', {
        status: 200,
        body: {
          success: true,
          delivery: {
            id: 'delivery_001',
            status: 'completed',
          },
        },
      });

      const deliveryPage = new DeliveryPage(pharmacistPage);
      await deliveryPage.goto();

      // Complete delivery
      await pharmacistPage.locator('[data-testid="delivery-delivery_001"]').click();
      await pharmacistPage.getByRole('button', { name: /terminer|complete/i }).click();
      await pharmacistPage.getByRole('button', { name: /confirmer livraison|confirm delivery/i }).click();

      // View history
      await deliveryPage.viewDeliveryHistory();

      // Verify completed delivery in history
      await expect(pharmacistPage.locator('[data-testid="delivery-delivery_001"]')).toBeVisible();
      await expect(pharmacistPage.locator('[data-testid="delivery-delivery_001"] [data-testid="status"]')).toContainText(/completed|terminée/i);
    });
  });
});
