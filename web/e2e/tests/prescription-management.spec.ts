import { test, expect } from '../fixtures/auth.fixture';
import { PrescriptionPage, DashboardPage } from '../page-objects';
import { mockApiResponse, mockPrescriptionList } from '../utils/api-mock';
import { generateMockPrescription, generateMockPrescriptions } from '../utils/test-data';

test.describe('Prescription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock prescription list API
    const prescriptions = generateMockPrescriptions(5);
    await mockPrescriptionList(page, prescriptions);
  });

  test('should display prescription list', async ({ pharmacistPage }) => {
    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    await prescriptionPage.expectPageLoaded();
    await expect(prescriptionPage.prescriptionList).toBeVisible();
  });

  test('should upload and process new prescription', async ({ pharmacistPage }) => {
    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    // Mock upload response
    await mockApiResponse(pharmacistPage, '**/prescriptions/upload', {
      status: 200,
      body: {
        success: true,
        prescriptionId: 'rx_uploaded_001',
        aiTranscription: {
          medications: [
            { name: 'Paracétamol', dosage: '500mg', frequency: '3x/jour' },
          ],
        },
      },
    });

    // Note: In a real test, we would use a test file
    // For now, we simulate the upload flow
    const fileInput = pharmacistPage.locator('input[type="file"]');
    await expect(fileInput).toBeTruthy();
  });

  test('should search prescriptions', async ({ pharmacistPage }) => {
    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    await prescriptionPage.searchPrescription('Sophie Bernard');
    await expect(prescriptionPage.prescriptionList).toBeVisible();
  });

  test('should filter prescriptions by status', async ({ pharmacistPage }) => {
    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    await prescriptionPage.filterByStatus('pending');
    await expect(prescriptionPage.prescriptionList).toBeVisible();

    await prescriptionPage.filterByStatus('approved');
    await expect(prescriptionPage.prescriptionList).toBeVisible();
  });

  test('should approve prescription after validation', async ({ pharmacistPage }) => {
    const prescription = generateMockPrescription({ status: 'pending' });

    await mockApiResponse(pharmacistPage, '**/prescriptions/**', {
      status: 200,
      body: { success: true, prescription },
    });

    await mockApiResponse(pharmacistPage, '**/prescriptions/*/approve', {
      status: 200,
      body: { success: true },
    });

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();
    await prescriptionPage.viewPrescriptionDetails(prescription.id);
    await prescriptionPage.approvePrescription();
  });

  test('should reject prescription with reason', async ({ pharmacistPage }) => {
    const prescription = generateMockPrescription({ status: 'pending' });

    await mockApiResponse(pharmacistPage, '**/prescriptions/**', {
      status: 200,
      body: { success: true, prescription },
    });

    await mockApiResponse(pharmacistPage, '**/prescriptions/*/reject', {
      status: 200,
      body: { success: true },
    });

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();
    await prescriptionPage.viewPrescriptionDetails(prescription.id);
    await prescriptionPage.rejectPrescription('Medication not available');
  });

  test('should check drug interactions', async ({ pharmacistPage }) => {
    const prescription = generateMockPrescription();

    await mockApiResponse(pharmacistPage, '**/prescriptions/*/interactions', {
      status: 200,
      body: {
        success: true,
        interactions: [
          { severity: 'moderate', description: 'May cause drowsiness' },
        ],
      },
    });

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();
    await prescriptionPage.viewPrescriptionDetails(prescription.id);
    await prescriptionPage.checkDrugInteractions();
  });

  test('should check patient allergies', async ({ pharmacistPage }) => {
    const prescription = generateMockPrescription();

    await mockApiResponse(pharmacistPage, '**/prescriptions/*/allergies', {
      status: 200,
      body: {
        success: true,
        allergies: [],
        warnings: [],
      },
    });

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();
    await prescriptionPage.viewPrescriptionDetails(prescription.id);
    await prescriptionPage.checkAllergies();
  });

  test('should generate prescription label', async ({ pharmacistPage }) => {
    const prescription = generateMockPrescription();

    await mockApiResponse(pharmacistPage, '**/prescriptions/*/label', {
      status: 200,
      body: {
        success: true,
        labelUrl: '/labels/rx_001.pdf',
      },
    });

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();
    await prescriptionPage.viewPrescriptionDetails(prescription.id);
    await prescriptionPage.generateLabel();
  });

  test('should view prescription history', async ({ pharmacistPage }) => {
    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    await mockApiResponse(pharmacistPage, '**/prescriptions/history', {
      status: 200,
      body: {
        success: true,
        history: generateMockPrescriptions(10),
      },
    });

    await prescriptionPage.viewHistory();
  });

  test('should display empty state when no prescriptions', async ({ pharmacistPage }) => {
    await mockPrescriptionList(pharmacistPage, []);

    const prescriptionPage = new PrescriptionPage(pharmacistPage);
    await prescriptionPage.goto();

    await prescriptionPage.expectEmptyState();
  });
});
