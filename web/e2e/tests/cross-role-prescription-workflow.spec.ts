import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { PrescriptionPage, MessagingPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E-026: Cross-Role Prescription Workflow
 *
 * Tests the complete prescription workflow across three roles:
 * Doctor → Pharmacist → Patient
 *
 * Scenarios:
 * 1. Doctor creates and sends prescription to pharmacy
 * 2. Pharmacist receives, reviews, and validates prescription
 * 3. Pharmacist messages doctor for clarification if needed
 * 4. Patient receives notification and views prescription
 * 5. Patient adds prescription to cart and places order
 */

test.describe('E2E-026: Cross-Role Prescription Workflow', () => {
  const prescriptionId = 'rx_cross_role_001';
  const patientId = 'patient_001';

  test.beforeEach(async ({ page }) => {
    // Mock prescription data used across roles
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          patientId: patientId,
          patientName: 'Sophie Bernard',
          doctorId: 'doctor_001',
          doctorName: 'Dr. Jean Martin',
          pharmacyId: 'pharmacy-1',
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              duration: '30 days',
              quantity: 30,
            },
            {
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily with meals',
              duration: '30 days',
              quantity: 60,
            },
          ],
          status: 'pending_pharmacist_review',
          createdAt: new Date().toISOString(),
          diagnosis: 'Hypertension and Type 2 Diabetes management',
          notes: 'Patient recently diagnosed, monitor blood pressure and glucose levels',
        },
      },
    });
  });

  /**
   * Scenario 1: Doctor creates and sends prescription
   */
  test('should allow doctor to create prescription and send to pharmacy', async ({ page }) => {
    // Mock doctor authentication
    await page.goto('/');
    await login(page, testUsers.doctor);
    await page.waitForURL(/.*\/doctor\/dashboard/);

    // Mock patient list for doctor
    await mockApiResponse(page, '**/doctor/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: patientId,
            name: 'Sophie Bernard',
            dateOfBirth: '1985-06-15',
            allergies: ['Penicillin'],
            chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
          },
        ],
      },
    });

    // Mock AI drug suggestions
    await mockApiResponse(page, '**/doctor/ai/drug-suggestions', {
      status: 200,
      body: {
        success: true,
        suggestions: [
          {
            medication: 'Lisinopril',
            dosage: '10mg',
            rationale: 'First-line ACE inhibitor for hypertension',
          },
          {
            medication: 'Metformin',
            dosage: '500mg',
            rationale: 'First-line treatment for Type 2 Diabetes',
          },
        ],
      },
    });

    // Mock prescription creation
    await mockApiResponse(page, '**/doctor/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: prescriptionId,
        message: 'Prescription sent to pharmacy',
      },
    });

    // Navigate to patient list
    await page.getByRole('link', { name: /patients/i }).click();

    // Select patient
    await page.locator(`[data-testid="patient-${patientId}"]`).click();

    // Click create prescription
    await page.getByRole('button', { name: /nouvelle ordonnance|new prescription|créer/i }).click();

    // Enter diagnosis
    await page.locator('[data-testid="diagnosis-input"]').fill('Hypertension and Type 2 Diabetes management');

    // AI suggests medications - select them
    await page.getByRole('button', { name: /suggestions ia|ai suggestions/i }).click();
    await page.locator('[data-testid="suggestion-Lisinopril"]').click();
    await page.locator('[data-testid="suggestion-Metformin"]').click();

    // Add notes
    await page.locator('[data-testid="prescription-notes"]').fill('Patient recently diagnosed, monitor blood pressure and glucose levels');

    // Select pharmacy
    await page.locator('[data-testid="pharmacy-selector"]').selectOption('pharmacy-1');

    // Submit prescription
    await page.getByRole('button', { name: /envoyer|send|submit/i }).click();

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/sent|envoyée/i);

    await clearAuth(page);
  });

  /**
   * Scenario 2: Pharmacist receives and reviews prescription
   */
  test('should allow pharmacist to receive and validate prescription from doctor', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);
    await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

    // Mock prescription list
    await mockApiResponse(page, '**/prescriptions**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: prescriptionId,
            patientName: 'Sophie Bernard',
            doctorName: 'Dr. Jean Martin',
            status: 'pending_pharmacist_review',
            createdAt: new Date().toISOString(),
            medicationCount: 2,
            urgent: false,
          },
        ],
        total: 1,
      },
    });

    // Mock AI drug interaction check
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}/interactions`, {
      status: 200,
      body: {
        success: true,
        interactions: [],
        warnings: [],
        severity: 'none',
      },
    });

    // Mock prescription approval
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}/approve`, {
      status: 200,
      body: {
        success: true,
        prescription: {
          id: prescriptionId,
          status: 'approved',
          approvedBy: 'pharmacist_001',
          approvedAt: new Date().toISOString(),
        },
      },
    });

    const prescriptionPage = new PrescriptionPage(page);
    await prescriptionPage.goto();

    // Verify prescription appears in queue
    await expect(page.locator(`[data-testid="prescription-${prescriptionId}"]`)).toBeVisible();
    await expect(page.getByText('Sophie Bernard')).toBeVisible();
    await expect(page.getByText('Dr. Jean Martin')).toBeVisible();

    // Click on prescription to review
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();

    // Verify prescription details displayed
    await expect(page.getByText('Lisinopril')).toBeVisible();
    await expect(page.getByText('10mg')).toBeVisible();
    await expect(page.getByText('Metformin')).toBeVisible();
    await expect(page.getByText('500mg')).toBeVisible();

    // Run AI safety checks
    await page.getByRole('button', { name: /vérifier interactions|check interactions/i }).click();
    await expect(page.locator('[data-testid="interaction-check-complete"]')).toBeVisible();
    await expect(page.getByText(/no interactions|aucune interaction/i)).toBeVisible();

    // Approve prescription
    await page.getByRole('button', { name: /approuver|approve/i }).click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/approved|approuvée/i);

    await clearAuth(page);
  });

  /**
   * Scenario 3: Pharmacist messages doctor for clarification
   */
  test('should allow pharmacist to message doctor for prescription clarification', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);
    await page.waitForURL(/.*\/(?:dashboard|prescriptions)/);

    // Mock prescription with potential issue
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          patientName: 'Sophie Bernard',
          doctorId: 'doctor_001',
          doctorName: 'Dr. Jean Martin',
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
            },
          ],
          status: 'pending_pharmacist_review',
          patientAllergies: ['Penicillin', 'ACE inhibitors'], // Potential issue
        },
      },
    });

    // Mock AI interaction check with warning
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}/interactions`, {
      status: 200,
      body: {
        success: true,
        interactions: [],
        warnings: [
          {
            type: 'allergy',
            severity: 'high',
            message: 'Patient has documented ACE inhibitor allergy. Lisinopril is contraindicated.',
          },
        ],
        severity: 'high',
      },
    });

    // Mock messaging endpoint
    await mockApiResponse(page, '**/messaging/send', {
      status: 201,
      body: {
        success: true,
        messageId: 'msg_clarification_001',
      },
    });

    const prescriptionPage = new PrescriptionPage(page);
    await prescriptionPage.goto();

    // Open prescription
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();

    // Run safety check - discovers allergy conflict
    await page.getByRole('button', { name: /vérifier interactions|check interactions/i }).click();
    await expect(page.locator('[data-testid="allergy-warning"]')).toBeVisible();
    await expect(page.getByText(/ACE inhibitor allergy/i)).toBeVisible();

    // Click to message doctor
    await page.getByRole('button', { name: /contacter médecin|contact doctor|message/i }).click();

    // Verify messaging interface opened with context
    await expect(page.locator('[data-testid="message-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipient"]')).toContainText('Dr. Jean Martin');
    await expect(page.locator('[data-testid="prescription-context"]')).toContainText(prescriptionId);

    // Type clarification message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill(
      'Bonjour Dr. Martin, I noticed the patient has a documented ACE inhibitor allergy but Lisinopril was prescribed. Could you please confirm this is correct or suggest an alternative?'
    );

    // Attach prescription reference
    await expect(page.locator('[data-testid="attached-prescription"]')).toBeVisible();

    // Send message
    await page.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/sent|envoyé/i);

    await clearAuth(page);
  });

  /**
   * Scenario 4: Patient receives notification and views prescription
   */
  test('should notify patient when prescription is approved and allow viewing', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);
    await page.waitForURL(/.*\/patient\/dashboard/);

    // Mock notifications
    await mockApiResponse(page, '**/patient/notifications', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'notif_001',
            type: 'prescription_approved',
            title: 'Prescription Ready',
            message: 'Your prescription from Dr. Jean Martin has been approved by the pharmacist',
            prescriptionId: prescriptionId,
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
      },
    });

    // Mock approved prescription for patient view
    await mockApiResponse(page, `**/patient/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          doctorName: 'Dr. Jean Martin',
          pharmacyName: 'Pharmacie de la Gare',
          status: 'approved',
          approvedAt: new Date().toISOString(),
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              quantity: 30,
              price: 25.5,
            },
            {
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily with meals',
              quantity: 60,
              price: 18.0,
            },
          ],
          totalPrice: 43.5,
          insuranceCovered: true,
        },
      },
    });

    // Verify notification badge visible
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-badge"]')).toContainText('1');

    // Click notifications
    await page.locator('[data-testid="notifications-button"]').click();

    // Verify prescription notification
    const notification = page.locator('[data-testid="notif-notif_001"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Prescription Ready');
    await expect(notification).toContainText('Dr. Jean Martin');

    // Click notification to view prescription
    await notification.click();

    // Verify redirected to prescription view
    await page.waitForURL(new RegExp(`.*/${prescriptionId}`));

    // Verify prescription details
    await expect(page.getByText('Dr. Jean Martin')).toBeVisible();
    await expect(page.getByText('Pharmacie de la Gare')).toBeVisible();
    await expect(page.getByText('Lisinopril')).toBeVisible();
    await expect(page.getByText('Metformin')).toBeVisible();
    await expect(page.getByText('43.5')).toBeVisible(); // Total price

    await clearAuth(page);
  });

  /**
   * Scenario 5: Patient adds prescription to cart and places order
   */
  test('should allow patient to add approved prescription to cart and order', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);
    await page.waitForURL(/.*\/patient\/dashboard/);

    // Mock prescription list
    await mockApiResponse(page, '**/patient/prescriptions**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: prescriptionId,
            doctorName: 'Dr. Jean Martin',
            status: 'approved',
            medicationCount: 2,
            totalPrice: 43.5,
          },
        ],
      },
    });

    // Mock add to cart
    await mockApiResponse(page, '**/patient/cart/add', {
      status: 200,
      body: {
        success: true,
        cartId: 'cart_001',
        itemsCount: 2,
      },
    });

    // Mock checkout
    await mockApiResponse(page, '**/patient/orders', {
      status: 201,
      body: {
        success: true,
        orderId: 'order_001',
        status: 'confirmed',
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Navigate to prescriptions
    await page.getByRole('link', { name: /ordonnances|prescriptions/i }).click();

    // Verify approved prescription visible
    await expect(page.locator(`[data-testid="prescription-${prescriptionId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="prescription-${prescriptionId}"] [data-testid="status"]`)).toContainText(/approved|approuvée/i);

    // Add to cart
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
    await page.getByRole('button', { name: /ajouter au panier|add to cart/i }).click();

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/added|ajouté/i);

    // Verify cart badge updated
    await expect(page.locator('[data-testid="cart-badge"]')).toContainText('2');

    // Go to cart
    await page.locator('[data-testid="cart-button"]').click();

    // Verify cart items
    await expect(page.getByText('Lisinopril')).toBeVisible();
    await expect(page.getByText('Metformin')).toBeVisible();
    await expect(page.getByText('43.5')).toBeVisible();

    // Proceed to checkout
    await page.getByRole('button', { name: /commander|checkout|place order/i }).click();

    // Select delivery option
    await page.locator('[data-testid="delivery-option-standard"]').click();

    // Confirm order
    await page.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-id"]')).toContainText('order_001');

    await clearAuth(page);
  });

  /**
   * Integration scenario: Complete end-to-end workflow
   */
  test('should complete full workflow: doctor creates → pharmacist approves → patient orders', async ({ context }) => {
    // This test uses multiple browser contexts to simulate different users

    // Step 1: Doctor creates prescription
    const doctorPage = await context.newPage();
    await doctorPage.goto('/');
    await login(doctorPage, testUsers.doctor);

    await mockApiResponse(doctorPage, '**/doctor/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: prescriptionId,
      },
    });

    await doctorPage.getByRole('link', { name: /patients/i }).click();
    await doctorPage.getByRole('button', { name: /nouvelle ordonnance|new prescription/i }).click();
    await doctorPage.locator('[data-testid="diagnosis-input"]').fill('Hypertension management');
    await doctorPage.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(doctorPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await doctorPage.close();

    // Step 2: Pharmacist approves prescription
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/prescriptions/${prescriptionId}/approve`, {
      status: 200,
      body: { success: true },
    });

    await pharmacistPage.getByRole('link', { name: /ordonnances|prescriptions/i }).click();
    await pharmacistPage.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
    await pharmacistPage.getByRole('button', { name: /approuver|approve/i }).click();
    await expect(pharmacistPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await pharmacistPage.close();

    // Step 3: Patient receives and orders
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await mockApiResponse(patientPage, '**/patient/cart/add', {
      status: 200,
      body: { success: true },
    });

    // Patient should see notification
    await expect(patientPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await patientPage.getByRole('link', { name: /ordonnances|prescriptions/i }).click();
    await patientPage.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
    await patientPage.getByRole('button', { name: /ajouter au panier|add to cart/i }).click();
    await expect(patientPage.locator('[data-testid="success-toast"]')).toBeVisible();
    await patientPage.close();
  });
});
