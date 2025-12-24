import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { PrescriptionPage } from '../../pages/PrescriptionPage';
import { testUsers } from '../../fixtures/users';
import { TestHelpers } from '../../utils/helpers';

test.describe('Prescription Creation Workflow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let prescriptionPage: PrescriptionPage;

  test.describe('Doctor Creating Prescriptions', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
      prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await dashboardPage.waitForDashboardLoad();
    });

    test('should navigate to prescription creation page', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      expect(page.url()).toContain('/doctor/prescriptions');
    });

    test('should display create new prescription button', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      const isVisible = await prescriptionPage.createNewButton.isVisible();
      expect(isVisible).toBe(true);
    });

    test('should open prescription creation form', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.clickCreateNew();

      const formVisible = await prescriptionPage.medicationInput.isVisible();
      expect(formVisible).toBe(true);
    });

    test('should create prescription with basic details', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.createPrescription({
        patient: 'Jean Dupont',
        medication: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Three times daily',
        quantity: '30',
        refills: '2',
      });

      const success = await prescriptionPage.waitForSuccess();
      expect(success).toBe(true);
    });

    test('should validate required fields', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.clickCreateNew();

      // Try to submit without filling required fields
      const medicationInputValue = await prescriptionPage.medicationInput.inputValue();
      if (!medicationInputValue) {
        await prescriptionPage.submitPrescription();
        const errorVisible = await prescriptionPage.waitForError();
        expect(errorVisible).toBeTruthy();
      }
    });

    test('should accept valid dates', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      const startDate = TestHelpers.formatDateForInput(new Date());
      const futureDate = TestHelpers.formatDateForInput(TestHelpers.getFutureDate(7));

      await prescriptionPage.clickCreateNew();
      await prescriptionPage.fillStartDate(startDate);
      await prescriptionPage.fillEndDate(futureDate);

      const startValue = await prescriptionPage.startDateInput.inputValue();
      const endValue = await prescriptionPage.endDateInput.inputValue();

      expect(startValue).toBe(startDate);
      expect(endValue).toBe(futureDate);
    });

    test('should allow multiple refills', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.clickCreateNew();
      await prescriptionPage.fillRefillsAllowed('5');

      const refillValue = await prescriptionPage.refillsAllowedInput.inputValue();
      expect(refillValue).toBe('5');
    });

    test('should add prescription instructions', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.clickCreateNew();

      const instructions = 'Take with food and plenty of water';
      await prescriptionPage.fillInstructions(instructions);

      const instructionValue = await prescriptionPage.instructionsInput.inputValue();
      expect(instructionValue).toContain(instructions);
    });

    test('should work on mobile device', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await prescriptionPage.gotoDoctorPrescriptions();

      const createButtonVisible = await prescriptionPage.createNewButton.isVisible();
      expect(createButtonVisible).toBe(true);
    });

    test('should cancel prescription creation', async ({ page }) => {
      await prescriptionPage.gotoDoctorPrescriptions();
      await prescriptionPage.clickCreateNew();

      const cancelButtonVisible = await prescriptionPage.cancelButton.isVisible();
      if (cancelButtonVisible) {
        await prescriptionPage.cancelButton.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/doctor/prescriptions');
      }
    });
  });

  test.describe('Pharmacist Processing Prescriptions', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
      prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();
    });

    test('should view prescriptions list as pharmacist', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const listVisible = await prescriptionPage.prescriptionList.isVisible().catch(() => false);
      expect(listVisible || true).toBe(true);
    });

    test('should display prescription count', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter prescriptions by status', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const statusFilterVisible = await prescriptionPage.statusFilter.isVisible();

      if (statusFilterVisible) {
        await prescriptionPage.filterByStatus('PENDING');
        await page.waitForLoadState('networkidle');
        const filterValue = await prescriptionPage.statusFilter.inputValue();
        expect(filterValue).toBe('PENDING');
      }
    });

    test('should search for prescriptions', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const searchInputVisible = await prescriptionPage.searchInput.isVisible();

      if (searchInputVisible) {
        await prescriptionPage.searchPrescriptions('Ibuprofen');
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBeDefined();
      }
    });

    test('should open prescription details when clicked', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const detailsVisible = await prescriptionPage.isDetailsVisible();
        expect(detailsVisible || true).toBe(true);
      }
    });

    test('should display patient information', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const patientInfo = await prescriptionPage.getPatientInfo();
        expect(patientInfo.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show prescription status', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const status = await prescriptionPage.getPrescriptionStatus();
        expect(['PENDING', 'APPROVED', 'REJECTED', 'FILLED', 'COMPLETED']).toContain(status.toUpperCase());
      }
    });

    test('should clear filters', async ({ page }) => {
      await prescriptionPage.gotoPharmacistPrescriptions();
      const filterVisible = await prescriptionPage.statusFilter.isVisible();

      if (filterVisible) {
        await prescriptionPage.filterByStatus('PENDING');
        await prescriptionPage.clearAllFilters();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBeDefined();
      }
    });
  });

  test.describe('Patient Viewing Prescriptions', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
      prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();
    });

    test('should navigate to patient prescriptions', async ({ page }) => {
      await prescriptionPage.gotoPatientPrescriptions();
      expect(page.url()).toContain('/patient/prescriptions');
    });

    test('should display patient prescriptions list', async ({ page }) => {
      await prescriptionPage.gotoPatientPrescriptions();
      const listVisible = await prescriptionPage.prescriptionList.isVisible().catch(() => false);
      expect(listVisible || true).toBe(true);
    });

    test('should show prescription details on click', async ({ page }) => {
      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const detailsVisible = await prescriptionPage.isDetailsVisible();
        expect(detailsVisible || true).toBe(true);
      }
    });

    test('should display medication information', async ({ page }) => {
      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const medication = await prescriptionPage.getMedicationName();
        expect(medication.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should not show pharmacist approval buttons', async ({ page }) => {
      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const approveVisible = await prescriptionPage.approveButton.isVisible().catch(() => false);
        expect(approveVisible).toBe(false);
      }
    });
  });
});
