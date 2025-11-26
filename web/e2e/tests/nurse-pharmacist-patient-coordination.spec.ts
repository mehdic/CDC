import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { NursePage, MessagingPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E-028: Nurse-Pharmacist-Patient Coordination Workflow
 *
 * Tests the complete coordination workflow between nurses, pharmacists, and patients:
 * 1. Nurse places urgent medication order for patient
 * 2. Pharmacist receives and validates order
 * 3. Pharmacist communicates with nurse about order details
 * 4. Delivery is dispatched and tracked by nurse
 * 5. Patient receives medication and confirmation flows back
 */

test.describe('E2E-028: Nurse-Pharmacist-Patient Coordination', () => {
  const orderId = 'order_nurse_001';
  const patientId = 'patient_hospital_001';
  const nurseId = 'nurse_001';
  const pharmacistId = 'pharmacist_001';
  const deliveryId = 'delivery_nurse_001';

  test.beforeEach(async ({ page }) => {
    // Mock patient data
    await mockApiResponse(page, `**/patients/${patientId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: patientId,
          name: 'Paul Deschamp',
          dateOfBirth: '1950-03-12',
          room: 'Room 301',
          allergies: ['Aspirin'],
          chronicConditions: ['Heart failure', 'Diabetes'],
          currentMedications: ['Digoxin 0.25mg', 'Insulin Glargine'],
        },
      },
    });
  });

  /**
   * Scenario 1: Nurse places urgent medication order
   */
  test('should allow nurse to place urgent medication order for hospitalized patient', async ({ page }) => {
    // Login as nurse
    await page.goto('/');
    await login(page, testUsers.nurse);

    // Mock nurse's patient list
    await mockApiResponse(page, '**/nurse/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: patientId,
            name: 'Paul Deschamp',
            room: '301',
            ward: 'Cardiology',
            status: 'stable',
          },
        ],
      },
    });

    // Mock prescription validation
    await mockApiResponse(page, `**/nurse/patients/${patientId}/prescriptions`, {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'rx_001',
            medication: 'Furosemide',
            dosage: '40mg',
            valid: true,
            prescribedBy: 'Dr. Martin',
            expiryDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days
          },
        ],
      },
    });

    // Mock order creation
    await mockApiResponse(page, '**/nurse/orders', {
      status: 201,
      body: {
        success: true,
        orderId: orderId,
        status: 'pending_pharmacy',
        estimatedPreparationTime: 30,
      },
    });

    const nursePage = new NursePage(page);
    await nursePage.goto();

    // Search for patient
    await nursePage.searchPatient('Paul Deschamp');
    await nursePage.selectPatient(patientId);

    // Verify patient details displayed
    await expect(page.getByText('Paul Deschamp')).toBeVisible();
    await expect(page.getByText('Room 301')).toBeVisible();

    // View patient medications
    await page.getByRole('button', { name: /médicaments|medications/i }).click();

    // Click order new medication
    await page.getByRole('button', { name: /commander|order|new order/i }).click();

    // Select medication from prescriptions
    await page.locator('[data-testid="prescription-rx_001"]').click();

    // Mark as urgent
    await page.locator('[data-testid="urgent-checkbox"]').check();

    // Specify delivery time
    await page.locator('[data-testid="delivery-time-input"]').fill('14:00');

    // Add notes for pharmacist
    await page.locator('[data-testid="order-notes-input"]').fill('Patient showing fluid retention - needed urgently for afternoon dose');

    // Submit order
    await page.getByRole('button', { name: /confirmer|submit|place order/i }).click();

    // Verify order confirmation
    await expect(page.locator('[data-testid="order-success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-id"]')).toContainText(orderId);
    await expect(page.getByText(/30 minutes|30 min/i)).toBeVisible(); // Estimated preparation time

    await clearAuth(page);
  });

  /**
   * Scenario 2: Pharmacist receives and validates urgent order
   */
  test('should allow pharmacist to receive and validate urgent nurse order', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock pending orders with nurse order
    await mockApiResponse(page, '**/pharmacist/orders**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: orderId,
            patientName: 'Paul Deschamp',
            room: 'Room 301',
            requestedBy: 'Nurse Caroline Leclerc',
            nurseId: nurseId,
            urgent: true,
            requestedDeliveryTime: '14:00',
            medications: [
              {
                prescriptionId: 'rx_001',
                medication: 'Furosemide',
                dosage: '40mg',
                quantity: 30,
              },
            ],
            notes: 'Patient showing fluid retention - needed urgently for afternoon dose',
            createdAt: new Date().toISOString(),
            status: 'pending_pharmacy',
          },
        ],
      },
    });

    // Mock order details
    await mockApiResponse(page, `**/pharmacist/orders/${orderId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: orderId,
          patientId: patientId,
          patientName: 'Paul Deschamp',
          patientAllergies: ['Aspirin'],
          medications: [
            {
              prescriptionId: 'rx_001',
              medication: 'Furosemide',
              dosage: '40mg',
              quantity: 30,
              inStock: true,
              currentStock: 150,
            },
          ],
          insuranceCoverage: {
            covered: true,
            copay: 5.0,
          },
        },
      },
    });

    // Mock order acceptance
    await mockApiResponse(page, `**/pharmacist/orders/${orderId}/accept`, {
      status: 200,
      body: {
        success: true,
        orderId: orderId,
        status: 'preparing',
        estimatedCompletion: new Date(Date.now() + 1800000).toISOString(), // 30 min
      },
    });

    // Navigate to orders
    await page.getByRole('link', { name: /commandes|orders/i }).click();

    // Verify urgent order visible with badge
    await expect(page.locator(`[data-testid="order-${orderId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="order-${orderId}"] [data-testid="urgent-badge"]`)).toBeVisible();
    await expect(page.getByText('Nurse Caroline Leclerc')).toBeVisible();

    // Click on order to review
    await page.locator(`[data-testid="order-${orderId}"]`).click();

    // Verify order details
    await expect(page.getByText('Paul Deschamp')).toBeVisible();
    await expect(page.getByText('Room 301')).toBeVisible();
    await expect(page.getByText('Furosemide')).toBeVisible();
    await expect(page.getByText('40mg')).toBeVisible();

    // Verify nurse notes visible
    await expect(page.getByText('Patient showing fluid retention')).toBeVisible();

    // Check stock availability
    await expect(page.locator('[data-testid="stock-status"]')).toContainText(/in stock|en stock/i);
    await expect(page.getByText('150')).toBeVisible(); // Current stock

    // Verify insurance coverage
    await expect(page.locator('[data-testid="insurance-status"]')).toContainText(/covered|couvert/i);

    // Accept and start preparing order
    await page.getByRole('button', { name: /accepter|accept|start/i }).click();

    // Verify confirmation
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/preparing|préparation/i);

    await clearAuth(page);
  });

  /**
   * Scenario 3: Pharmacist messages nurse for order clarification
   */
  test('should allow pharmacist to message nurse for order clarification', async ({ context }) => {
    // Mock order with ambiguity
    const orderWithIssue = {
      id: orderId,
      patientName: 'Paul Deschamp',
      requestedBy: 'Nurse Caroline Leclerc',
      nurseId: nurseId,
      medications: [
        {
          medication: 'Furosemide',
          dosage: '40mg',
          quantity: 30,
          inStock: false, // Out of stock
        },
      ],
      status: 'pending_pharmacy',
    };

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/pharmacist/orders/${orderId}`, {
      status: 200,
      body: { success: true, data: orderWithIssue },
    });

    // Mock messaging
    await mockApiResponse(pharmacistPage, '**/messaging/send', {
      status: 201,
      body: {
        success: true,
        messageId: 'msg_nurse_clarif_001',
        conversationId: 'conv_nurse_pharm_001',
      },
    });

    // Nurse page
    const nursePage = await context.newPage();
    await nursePage.goto('/');
    await login(nursePage, testUsers.nurse);

    // Mock messages for nurse
    await mockApiResponse(nursePage, '**/nurse/conversations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'conv_nurse_pharm_001',
            participantName: 'Marie Dupont',
            participantRole: 'pharmacist',
            lastMessage: 'Furosemide 40mg out of stock',
            unreadCount: 1,
          },
        ],
      },
    });

    // Pharmacist views order and sees stock issue
    await pharmacistPage.getByRole('link', { name: /commandes|orders/i }).click();
    await pharmacistPage.locator(`[data-testid="order-${orderId}"]`).click();

    // See out of stock warning
    await expect(pharmacistPage.locator('[data-testid="stock-warning"]')).toBeVisible();
    await expect(pharmacistPage.getByText(/out of stock|rupture/i)).toBeVisible();

    // Click message nurse
    await pharmacistPage.getByRole('button', { name: /contacter infirmier|message nurse/i }).click();

    // Message modal opens with context
    await expect(pharmacistPage.locator('[data-testid="message-modal"]')).toBeVisible();
    await expect(pharmacistPage.locator('[data-testid="order-context"]')).toContainText(orderId);

    // Type message
    await pharmacistPage.locator('[data-testid="message-input"]').fill(
      'Bonjour, Furosemide 40mg is currently out of stock. I can offer: 1) Furosemide 20mg (take 2 tablets) or 2) Wait for restock (arrives tomorrow morning). Which would you prefer?'
    );

    // Send message
    await pharmacistPage.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // Nurse receives notification
    await expect(nursePage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await nursePage.getByRole('button', { name: /messagerie|messaging/i }).click();

    // Verify unread message
    await expect(nursePage.locator('[data-testid="conversation-conv_nurse_pharm_001"]')).toBeVisible();
    await expect(nursePage.locator('[data-testid="unread-badge"]')).toContainText('1');

    // Open conversation
    await nursePage.locator('[data-testid="conversation-conv_nurse_pharm_001"]').click();

    // Verify message with order context
    await expect(nursePage.getByText(/Furosemide 40mg is currently out of stock/i)).toBeVisible();
    await expect(nursePage.locator('[data-testid="order-link"]')).toContainText(orderId);

    await pharmacistPage.close();
    await nursePage.close();
  });

  /**
   * Scenario 4: Order prepared and delivery dispatched
   */
  test('should track order from preparation to delivery dispatch', async ({ page }) => {
    // Login as nurse
    await page.goto('/');
    await login(page, testUsers.nurse);

    // Mock order status updates
    await mockApiResponse(page, `**/nurse/orders/${orderId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: orderId,
          patientName: 'Paul Deschamp',
          room: '301',
          medications: ['Furosemide 40mg x30'],
          status: 'ready_for_delivery',
          preparedAt: new Date().toISOString(),
          preparedBy: 'Marie Dupont, PharmD',
          deliveryId: deliveryId,
          estimatedDelivery: new Date(Date.now() + 1800000).toISOString(), // 30 min
        },
      },
    });

    // Mock delivery tracking
    await mockApiResponse(page, `**/nurse/deliveries/${deliveryId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: deliveryId,
          orderId: orderId,
          status: 'in_transit',
          driverName: 'Pierre Leclerc',
          driverPhone: '+41 79 123 45 67',
          currentLocation: {
            latitude: 46.2044,
            longitude: 6.1432,
          },
          estimatedArrival: new Date(Date.now() + 900000).toISOString(), // 15 min
        },
      },
    });

    const nursePage = new NursePage(page);
    await nursePage.goto();

    // View active orders
    await nursePage.viewActiveOrders();

    // Verify order status updated
    await expect(page.locator(`[data-testid="order-${orderId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="order-${orderId}"] [data-testid="status"]`)).toContainText(/ready|prêt/i);

    // Click on order to see details
    await page.locator(`[data-testid="order-${orderId}"]`).click();

    // Verify prepared by pharmacist info
    await expect(page.getByText('Marie Dupont, PharmD')).toBeVisible();

    // Track delivery
    await page.getByRole('button', { name: /suivi|track delivery/i }).click();

    // Verify delivery tracking map
    await expect(page.locator('[data-testid="delivery-tracking-map"]')).toBeVisible();
    await expect(page.getByText('Pierre Leclerc')).toBeVisible();
    await expect(page.getByText(/15 min/i)).toBeVisible(); // ETA

    // Verify driver contact visible
    await expect(page.getByText('+41 79 123 45 67')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 5: Patient receives medication and nurse confirms
   */
  test('should allow nurse to confirm medication delivery and update patient record', async ({ page }) => {
    // Login as nurse
    await page.goto('/');
    await login(page, testUsers.nurse);

    // Mock delivered order
    await mockApiResponse(page, `**/nurse/orders/${orderId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: orderId,
          patientName: 'Paul Deschamp',
          room: '301',
          medications: [
            {
              name: 'Furosemide',
              dosage: '40mg',
              quantity: 30,
            },
          ],
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          deliveryConfirmation: {
            recipientName: 'Paul Deschamp',
            signatureUrl: 'https://example.com/signature.png',
          },
        },
      },
    });

    // Mock medication administration recording
    await mockApiResponse(page, `**/nurse/patients/${patientId}/medication-administration`, {
      status: 201,
      body: {
        success: true,
        administrationId: 'admin_001',
        recordedAt: new Date().toISOString(),
      },
    });

    const nursePage = new NursePage(page);
    await nursePage.goto();

    // View active orders
    await nursePage.viewActiveOrders();

    // Verify order delivered
    await expect(page.locator(`[data-testid="order-${orderId}"] [data-testid="status"]`)).toContainText(/delivered|livré/i);

    // Click on delivered order
    await page.locator(`[data-testid="order-${orderId}"]`).click();

    // Verify delivery confirmation details
    await expect(page.locator('[data-testid="delivery-confirmation"]')).toBeVisible();
    await expect(page.getByText('Paul Deschamp')).toBeVisible();
    await expect(page.locator('[data-testid="signature-image"]')).toBeVisible();

    // Record medication administration
    await page.getByRole('button', { name: /administrer|record administration/i }).click();

    // Fill administration details
    await page.locator('[data-testid="dose-given"]').fill('40mg');
    await page.locator('[data-testid="administration-time"]').fill(new Date().toISOString().slice(0, 16));
    await page.locator('[data-testid="administration-route"]').selectOption('oral');

    // Add notes
    await page.locator('[data-testid="administration-notes"]').fill('Medication given with water. Patient tolerated well. No immediate adverse reactions.');

    // Submit administration record
    await page.getByRole('button', { name: /confirmer|submit|record/i }).click();

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/recorded|enregistré/i);

    // Verify added to patient medication record
    await page.getByRole('button', { name: /voir dossier|view record/i }).click();
    await expect(page.locator('[data-testid="medication-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-admin_001"]')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Integration scenario: Complete nurse-pharmacist-patient workflow
   */
  test('should complete full coordination workflow from order to administration', async ({ context }) => {
    // Step 1: Nurse places order
    const nursePage1 = await context.newPage();
    await nursePage1.goto('/');
    await login(nursePage1, testUsers.nurse);

    await mockApiResponse(nursePage1, '**/nurse/orders', {
      status: 201,
      body: { success: true, orderId: orderId },
    });

    await nursePage1.getByRole('link', { name: /patients/i }).click();
    await nursePage1.locator(`[data-testid="patient-${patientId}"]`).click();
    await nursePage1.getByRole('button', { name: /commander|order/i }).click();
    await nursePage1.getByRole('button', { name: /confirmer|submit/i }).click();
    await expect(nursePage1.locator('[data-testid="order-success-toast"]')).toBeVisible();
    await nursePage1.close();

    // Step 2: Pharmacist receives and prepares
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/pharmacist/orders/${orderId}/accept`, {
      status: 200,
      body: { success: true },
    });

    await pharmacistPage.getByRole('link', { name: /commandes|orders/i }).click();
    await pharmacistPage.locator(`[data-testid="order-${orderId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /accepter|accept/i }).click();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await pharmacistPage.close();

    // Step 3: Nurse tracks delivery
    const nursePage2 = await context.newPage();
    await nursePage2.goto('/');
    await login(nursePage2, testUsers.nurse);

    await mockApiResponse(nursePage2, `**/nurse/orders/${orderId}`, {
      status: 200,
      body: {
        success: true,
        data: { id: orderId, status: 'in_transit' },
      },
    });

    await nursePage2.getByRole('link', { name: /commandes|orders/i }).click();
    await nursePage2.locator(`[data-testid="order-${orderId}"]`).click();
    await nursePage2.getByRole('button', { name: /suivi|track/i }).click();
    await expect(nursePage2.locator('[data-testid="delivery-tracking-map"]')).toBeVisible();
    await nursePage2.close();

    // Step 4: Nurse confirms delivery
    const nursePage3 = await context.newPage();
    await nursePage3.goto('/');
    await login(nursePage3, testUsers.nurse);

    await mockApiResponse(nursePage3, `**/nurse/patients/${patientId}/medication-administration`, {
      status: 201,
      body: { success: true },
    });

    await nursePage3.getByRole('link', { name: /commandes|orders/i }).click();
    await nursePage3.locator(`[data-testid="order-${orderId}"]`).click();
    await nursePage3.getByRole('button', { name: /administrer|record/i }).click();
    await nursePage3.getByRole('button', { name: /confirmer|submit/i }).click();
    await expect(nursePage3.locator('[data-testid="success-toast"]')).toBeVisible();
    await nursePage3.close();
  });
});
