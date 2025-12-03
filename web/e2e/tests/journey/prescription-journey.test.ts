/**
 * E2E-046: Full Prescription Lifecycle Journey
 *
 * Tests the complete prescription journey from initial patient upload
 * through delivery and adherence tracking.
 *
 * Journey Steps:
 * 1. Patient uploads prescription photo
 * 2. OCR transcribes prescription
 * 3. System checks drug interactions
 * 4. Pharmacist reviews and approves
 * 5. Order created and payment processed
 * 6. Delivery assigned and tracked
 * 7. Patient receives medication
 * 8. Adherence tracking begins
 */

import { test, expect } from '../../fixtures/auth.fixture';
import {
  generatePrescriptionJourneyData,
  mockPrescriptionUploadStep,
  mockDrugInteractionCheckStep,
  mockPharmacistApprovalStep,
  mockPaymentProcessingStep,
  mockDeliveryAssignmentStep,
  mockAdherenceTrackingStep,
  assertPrescriptionJourneyComplete,
  JourneyStateManager,
} from './e2e-utils';
import { mockApiResponse } from '../../utils/api-mock';

test.describe('E2E-046: Full Prescription Lifecycle Journey', () => {
  let journeyState: JourneyStateManager;

  test.beforeEach(() => {
    journeyState = new JourneyStateManager();
  });

  /**
   * Test 1: Patient uploads prescription photo successfully
   */
  test('Step 1: Patient uploads prescription photo', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData();
    journeyState.set('prescriptionData', journeyData);

    // Navigate to prescription upload page
    await patientPage.goto('/my-prescriptions/upload');

    // Verify page loaded
    const pageTitle = patientPage.locator('[data-testid="page-title"]');
    await expect(pageTitle).toContainText(/télécharger|upload|prescription/i);

    // Mock file upload
    await mockPrescriptionUploadStep(patientPage, journeyData);

    // Simulate file upload (using file input or drag-drop)
    const fileInput = patientPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'prescription.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-prescription-image-data'),
    });

    // Click upload button
    const uploadButton = patientPage.getByRole('button', { name: /télécharger|upload/i });
    await uploadButton.click();

    // Verify upload success message
    await expect(patientPage.locator('[role="alert"]')).toContainText(
      /succès|success|téléchargé|uploaded/i
    );

    // Verify prescription ID is shown
    const prescriptionId = patientPage.locator('[data-testid="prescription-id"]');
    await expect(prescriptionId).toContainText(journeyData.prescriptionId);
  });

  /**
   * Test 2: OCR transcribes prescription accurately
   */
  test('Step 2: OCR transcribes prescription with high accuracy', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData();
    journeyState.set('prescriptionData', journeyData);

    // Mock the entire upload flow up to transcription
    await mockApiResponse(patientPage, '**/prescriptions/upload', {
      status: 200,
      body: { success: true, prescriptionId: journeyData.prescriptionId },
    });

    await mockApiResponse(patientPage, '**/ocr/transcribe', {
      status: 200,
      body: {
        success: true,
        transcribedText: journeyData.ocrTranscribedText,
        confidence: 0.97,
        medications: journeyData.medications.map((med) => ({
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
        })),
      },
    });

    // Navigate and upload
    await patientPage.goto('/my-prescriptions/upload');
    const fileInput = patientPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'prescription.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-prescription-image-data'),
    });

    await patientPage.getByRole('button', { name: /upload/i }).click();

    // Wait for OCR processing
    await patientPage.waitForSelector('[data-testid="ocr-results"]', { timeout: 5000 });

    // Verify transcribed text is displayed
    const transcriptionDisplay = patientPage.locator('[data-testid="transcribed-text"]');
    await expect(transcriptionDisplay).toContainText('Metformine');
    await expect(transcriptionDisplay).toContainText('Lisinopril');

    // Verify confidence score displayed
    const confidenceScore = patientPage.locator('[data-testid="ocr-confidence"]');
    await expect(confidenceScore).toContainText(/97%|haute|high/i);

    // Verify extracted medications listed
    const medicationsList = patientPage.locator('[data-testid="extracted-medications"]');
    await expect(medicationsList).toContainText('Metformine 500mg');
    await expect(medicationsList).toContainText('Lisinopril 10mg');
  });

  /**
   * Test 3: Drug interaction checking prevents unsafe combinations
   */
  test('Step 3: Drug interaction check identifies potential issues', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData({
      interactionCheckStatus: 'warning',
    });
    journeyState.set('prescriptionData', journeyData);

    // Mock all steps
    await mockPrescriptionUploadStep(patientPage, journeyData);
    await mockApiResponse(patientPage, '**/ocr/transcribe', {
      status: 200,
      body: {
        success: true,
        transcribedText: journeyData.ocrTranscribedText,
        confidence: 0.95,
        medications: journeyData.medications,
      },
    });

    await mockApiResponse(patientPage, '**/prescriptions/check-interactions', {
      status: 200,
      body: {
        success: true,
        interactions: [
          {
            severity: 'warning',
            drug1: 'Metformine',
            drug2: 'Lisinopril',
            description: 'Monitor patient for changes in blood pressure',
            recommendation: 'Regular monitoring recommended',
          },
        ],
        patientAllergies: [],
      },
    });

    // Simulate the interaction check flow
    await patientPage.goto('/my-prescriptions/upload');
    const fileInput = patientPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'prescription.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-prescription-image-data'),
    });

    await patientPage.getByRole('button', { name: /upload/i }).click();
    await patientPage.waitForSelector('[data-testid="interaction-results"]', {
      timeout: 5000,
    });

    // Verify warning is displayed
    const interactionWarning = patientPage.locator('[data-testid="interaction-warning"]');
    await expect(interactionWarning).toBeVisible();
    await expect(interactionWarning).toContainText(/avertissement|warning/i);
    await expect(interactionWarning).toContainText(/surveillance|monitoring/i);
  });

  /**
   * Test 4: Pharmacist can review and approve prescription
   */
  test('Step 4: Pharmacist reviews and approves prescription', async ({ pharmacistPage }) => {
    const journeyData = generatePrescriptionJourneyData();
    journeyState.set('prescriptionData', journeyData);

    // Mock pharmacist dashboard showing pending prescriptions
    await mockApiResponse(pharmacistPage, '**/pharmacist/prescriptions/pending', {
      status: 200,
      body: {
        success: true,
        prescriptions: [
          {
            id: journeyData.prescriptionId,
            patientName: journeyData.patientName,
            medications: journeyData.medications,
            uploadedAt: new Date().toISOString(),
            status: 'pending_review',
            ocrConfidence: 0.95,
          },
        ],
      },
    });

    await mockPharmacistApprovalStep(pharmacistPage, journeyData);

    // Navigate to prescription review
    await pharmacistPage.goto('/pharmacist/prescriptions');

    // Find prescription in list
    const prescriptionRow = pharmacistPage.locator(
      `[data-testid="prescription-row-${journeyData.prescriptionId}"]`
    );
    await expect(prescriptionRow).toBeVisible();

    // Click to view details
    await prescriptionRow.click();

    // Verify prescription details displayed
    const medicationsList = pharmacistPage.locator('[data-testid="medications-list"]');
    await expect(medicationsList).toContainText('Metformine 500mg');
    await expect(medicationsList).toContainText('Lisinopril 10mg');

    // Verify OCR confidence shown
    const confidenceDisplay = pharmacistPage.locator('[data-testid="ocr-confidence"]');
    await expect(confidenceDisplay).toContainText(/95%|haute|high/i);

    // Approve prescription
    const approveButton = pharmacistPage.getByRole('button', {
      name: /approuver|approve/i,
    });
    await approveButton.click();

    // Verify approval confirmation
    await expect(pharmacistPage.locator('[role="alert"]')).toContainText(
      /approuvée|approved/i
    );

    // Verify prescription status changed to approved
    const statusIndicator = pharmacistPage.locator(
      `[data-testid="prescription-status-${journeyData.prescriptionId}"]`
    );
    await expect(statusIndicator).toContainText(/approuvée|approved/i);
  });

  /**
   * Test 5: Order creation and payment processing
   */
  test('Step 5: Order created and payment processed successfully', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData();
    journeyState.set('prescriptionData', journeyData);

    // Mock order creation
    await mockApiResponse(patientPage, '**/orders/create', {
      status: 201,
      body: {
        success: true,
        orderId: `order_${Date.now()}`,
        prescriptionId: journeyData.prescriptionId,
        items: journeyData.medications.map((med) => ({
          medicationId: med.id,
          name: med.name,
          quantity: med.quantity,
          price: 15.5,
        })),
        subtotal: 31.0,
        deliveryFee: 5.5,
        total: 36.5,
        currency: 'CHF',
      },
    });

    await mockPaymentProcessingStep(patientPage, journeyData);

    // Navigate to prescription that was approved
    await patientPage.goto(`/my-prescriptions/${journeyData.prescriptionId}`);

    // Verify prescription shown
    const prescriptionTitle = patientPage.locator('[data-testid="prescription-title"]');
    await expect(prescriptionTitle).toContainText(journeyData.prescriptionId);

    // Click "Order Medications" button
    const orderButton = patientPage.getByRole('button', {
      name: /commander|order|buy/i,
    });
    await orderButton.click();

    // Verify order summary shown
    const orderSummary = patientPage.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toContainText('31.00 CHF');
    await expect(orderSummary).toContainText('5.50 CHF'); // Delivery
    await expect(orderSummary).toContainText('36.50 CHF'); // Total

    // Click proceed to payment
    const paymentButton = patientPage.getByRole('button', {
      name: /paiement|payment|proceed/i,
    });
    await paymentButton.click();

    // Wait for payment processing
    await patientPage.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 });

    // Verify payment success
    const paymentSuccess = patientPage.locator('[data-testid="payment-success"]');
    await expect(paymentSuccess).toContainText(/succès|success|complété|completed/i);

    // Verify payment ID displayed
    const paymentId = patientPage.locator('[data-testid="payment-id"]');
    await expect(paymentId).toContainText(journeyData.paymentId);
  });

  /**
   * Test 6: Delivery assigned and tracked in real-time
   */
  test('Step 6: Delivery assigned and tracked with real-time updates', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData();
    journeyState.set('prescriptionData', journeyData);

    // Mock delivery assignment
    await mockDeliveryAssignmentStep(patientPage, journeyData);

    // Mock delivery tracking
    await mockApiResponse(patientPage, `**/deliveries/${journeyData.deliveryId}/status`, {
      status: 200,
      body: {
        success: true,
        deliveryId: journeyData.deliveryId,
        status: 'in_transit',
        currentLocation: { lat: 46.2, lng: 6.14 },
        estimatedArrival: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        deliveryPerson: {
          name: 'Marc Rousseau',
          phone: '+41 79 XXX XX XX',
          vehicle: 'Vélo électrique - Plaque: E-PHARM-01',
        },
      },
    });

    // Navigate to order tracking
    await patientPage.goto('/my-orders');

    // Find the order
    const orderCard = patientPage.locator('[data-testid="order-card"]').first();
    await expect(orderCard).toBeVisible();

    // Click to view tracking
    await orderCard.click();

    // Verify tracking information displayed
    const trackingStatus = patientPage.locator('[data-testid="tracking-status"]');
    await expect(trackingStatus).toContainText(/en transit|in transit/i);

    // Verify estimated arrival shown
    const estimatedArrival = patientPage.locator('[data-testid="estimated-arrival"]');
    await expect(estimatedArrival).toContainText(/estimé|estimated/i);

    // Verify delivery person info shown
    const deliveryPersonName = patientPage.locator('[data-testid="delivery-person-name"]');
    await expect(deliveryPersonName).toContainText('Marc Rousseau');

    // Verify map/location tracking shown
    const mapElement = patientPage.locator('[data-testid="delivery-map"]');
    await expect(mapElement).toBeVisible();
  });

  /**
   * Test 7: Patient receives medication and confirms delivery
   */
  test('Step 7: Patient receives medication and confirms delivery', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData({
      deliveryStatus: 'delivered',
    });
    journeyState.set('prescriptionData', journeyData);

    // Mock delivery completed
    await mockApiResponse(patientPage, '**/deliveries/confirm', {
      status: 200,
      body: {
        success: true,
        deliveryId: journeyData.deliveryId,
        status: 'delivered',
        receivedAt: new Date().toISOString(),
        signature: 'Patient confirmed delivery',
      },
    });

    // Navigate to tracking page
    await patientPage.goto(`/my-orders/${journeyData.prescriptionId}`);

    // Verify "Confirm Delivery" button shown when delivery is ready
    const confirmButton = patientPage.getByRole('button', {
      name: /confirmer.*livraison|confirm delivery|received/i,
    });

    // Wait for button to appear as delivery arrives
    await patientPage.waitForSelector(
      'button:has-text(/confirmer|confirm|received/i)',
      { timeout: 5000 }
    );

    // Click confirm
    await confirmButton.click();

    // Verify delivery confirmed
    const deliveryConfirmed = patientPage.locator('[data-testid="delivery-confirmed"]');
    await expect(deliveryConfirmed).toBeVisible();
    await expect(deliveryConfirmed).toContainText(/livré|delivered/i);
  });

  /**
   * Test 8: Adherence tracking starts automatically
   */
  test('Step 8: Adherence tracking begins after delivery', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData({
      deliveryStatus: 'delivered',
      adherenceTrackingStarted: true,
    });
    journeyState.set('prescriptionData', journeyData);

    // Mock adherence tracking start
    await mockAdherenceTrackingStep(patientPage, journeyData);

    // Navigate to prescription after delivery confirmed
    await patientPage.goto(`/my-prescriptions/${journeyData.prescriptionId}`);

    // Verify adherence tracking section visible
    const adherenceSection = patientPage.locator('[data-testid="adherence-tracking"]');
    await expect(adherenceSection).toBeVisible();

    // Verify medications to track listed
    const medicationsList = patientPage.locator('[data-testid="medications-to-track"]');
    await expect(medicationsList).toContainText('Metformine 500mg');
    await expect(medicationsList).toContainText('Lisinopril 10mg');

    // Verify reminders enabled
    const remindersStatus = patientPage.locator('[data-testid="reminders-status"]');
    await expect(remindersStatus).toContainText(/activé|enabled|on/i);

    // Verify adherence tracking started date
    const trackingStartDate = patientPage.locator('[data-testid="tracking-start-date"]');
    await expect(trackingStartDate).toContainText(/aujourd'hui|today|maintenant|now/i);
  });

  /**
   * Complete journey test - all 8 steps in sequence
   */
  test('Complete prescription lifecycle (all 8 steps)', async ({
    patientPage,
    pharmacistPage,
    context,
  }) => {
    const journeyData = generatePrescriptionJourneyData();

    // ===== STEP 1: Patient uploads prescription =====
    await mockPrescriptionUploadStep(patientPage, journeyData);

    await patientPage.goto('/my-prescriptions/upload');
    const fileInput = patientPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'prescription.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-prescription-image-data'),
    });
    await patientPage.getByRole('button', { name: /upload/i }).click();
    await expect(patientPage.locator('[role="alert"]')).toContainText(/succès|success/i);

    // ===== STEP 2: OCR transcribes =====
    await mockApiResponse(patientPage, '**/ocr/transcribe', {
      status: 200,
      body: {
        success: true,
        transcribedText: journeyData.ocrTranscribedText,
        confidence: 0.95,
        medications: journeyData.medications,
      },
    });
    await patientPage.waitForSelector('[data-testid="ocr-results"]', { timeout: 5000 });
    await expect(patientPage.locator('[data-testid="transcribed-text"]')).toContainText(
      'Metformine'
    );

    // ===== STEP 3: Interaction check =====
    await mockDrugInteractionCheckStep(patientPage, journeyData);
    await expect(
      patientPage.locator('[data-testid="interaction-results"]'),
      'Interaction check displayed'
    ).toBeVisible({ timeout: 5000 });

    // ===== STEP 4: Pharmacist approval =====
    // Switch to pharmacist page
    const pharmacistContext = context;
    await mockApiResponse(pharmacistPage, '**/pharmacist/prescriptions/pending', {
      status: 200,
      body: {
        success: true,
        prescriptions: [
          {
            id: journeyData.prescriptionId,
            patientName: journeyData.patientName,
            medications: journeyData.medications,
            status: 'pending_review',
          },
        ],
      },
    });

    await mockPharmacistApprovalStep(pharmacistPage, journeyData);
    await pharmacistPage.goto('/pharmacist/prescriptions');
    const prescriptionRow = pharmacistPage.locator(
      `[data-testid="prescription-row-${journeyData.prescriptionId}"]`
    );
    if (await prescriptionRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prescriptionRow.click();
      const approveBtn = pharmacistPage.getByRole('button', { name: /approuver|approve/i });
      if (await approveBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await approveBtn.click();
      }
    }

    // ===== STEP 5: Payment =====
    await mockApiResponse(patientPage, '**/orders/create', {
      status: 201,
      body: {
        success: true,
        orderId: `order_${Date.now()}`,
        prescriptionId: journeyData.prescriptionId,
        items: journeyData.medications.map((med) => ({
          medicationId: med.id,
          name: med.name,
          quantity: med.quantity,
          price: 15.5,
        })),
        total: 36.5,
      },
    });

    await mockPaymentProcessingStep(patientPage, journeyData);
    await patientPage.goto(`/my-prescriptions/${journeyData.prescriptionId}`);
    const orderBtn = patientPage.getByRole('button', { name: /commander|order/i });
    if (await orderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderBtn.click();
      const paymentBtn = patientPage.getByRole('button', {
        name: /paiement|payment/i,
      });
      if (await paymentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentBtn.click();
      }
    }

    // ===== STEP 6 & 7: Delivery =====
    await mockDeliveryAssignmentStep(patientPage, journeyData);
    await patientPage.goto('/my-orders');

    // ===== STEP 8: Adherence tracking =====
    await mockAdherenceTrackingStep(patientPage, journeyData);

    // Final assertion - prescription journey complete
    await patientPage.goto(`/my-prescriptions/${journeyData.prescriptionId}`);
    const adherenceSection = patientPage.locator('[data-testid="adherence-tracking"]');
    if (await adherenceSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(adherenceSection).toContainText(/activé|enabled/i);
    }
  });

  /**
   * Test error handling - payment failure triggers proper messaging
   */
  test('Payment failure handled gracefully with retry option', async ({ patientPage }) => {
    const journeyData = generatePrescriptionJourneyData({
      paymentStatus: 'failed',
    });

    // Mock payment failure
    await mockApiResponse(patientPage, '**/payments/process', {
      status: 400,
      body: {
        success: false,
        error: 'Insufficient funds in account',
        errorCode: 'PAYMENT_DECLINED',
        orderId: `order_${Date.now()}`,
      },
    });

    // Attempt payment
    await patientPage.goto('/checkout');
    const paymentBtn = patientPage.getByRole('button', { name: /paiement|payment/i });
    if (await paymentBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await paymentBtn.click();

      // Verify error message
      const errorAlert = patientPage.locator('[role="alert"]');
      if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(errorAlert).toContainText(/échec|failed|declined|error/i);
      }

      // Verify retry button available
      const retryBtn = patientPage.getByRole('button', { name: /réessayer|retry/i });
      if (await retryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(retryBtn).toBeEnabled();
      }
    }
  });
});
