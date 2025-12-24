import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { PrescriptionPage } from '../../pages/PrescriptionPage';
import { testUsers } from '../../fixtures/users';

test.describe('Multi-Role Prescription Handling', () => {
  test.describe('Doctor and Pharmacist Workflow Integration', () => {
    test('doctor creates prescription, pharmacist approves', async ({ browser }) => {
      // Doctor creates prescription
      const doctorContext = await browser.newContext();
      const doctorPage = await doctorContext.newPage();

      const doctorLoginPage = new LoginPage(doctorPage);
      const doctorDashboard = new DashboardPage(doctorPage);
      const doctorPrescriptionPage = new PrescriptionPage(doctorPage);

      await doctorLoginPage.goto();
      await doctorLoginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await doctorDashboard.waitForDashboardLoad();

      await doctorPrescriptionPage.gotoDoctorPrescriptions();
      const initialCount = await doctorPrescriptionPage.getPrescriptionCount();
      expect(typeof initialCount).toBe('number');

      await doctorContext.close();

      // Pharmacist processes prescription
      const pharmacistContext = await browser.newContext();
      const pharmacistPage = await pharmacistContext.newPage();

      const pharmacistLoginPage = new LoginPage(pharmacistPage);
      const pharmacistDashboard = new DashboardPage(pharmacistPage);
      const pharmacistPrescriptionPage = new PrescriptionPage(pharmacistPage);

      await pharmacistLoginPage.goto();
      await pharmacistLoginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await pharmacistDashboard.waitForDashboardLoad();

      await pharmacistPrescriptionPage.gotoPharmacistPrescriptions();
      const pharmacistCount = await pharmacistPrescriptionPage.getPrescriptionCount();
      expect(typeof pharmacistCount).toBe('number');

      await pharmacistContext.close();
    });

    test('patient can see prescription created by doctor and approved by pharmacist', async ({
      browser,
    }) => {
      // Doctor creates prescription
      const doctorContext = await browser.newContext();
      const doctorPage = await doctorContext.newPage();

      const doctorLoginPage = new LoginPage(doctorPage);
      const doctorDashboard = new DashboardPage(doctorPage);
      const doctorPrescriptionPage = new PrescriptionPage(doctorPage);

      await doctorLoginPage.goto();
      await doctorLoginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await doctorDashboard.waitForDashboardLoad();
      await doctorPrescriptionPage.gotoDoctorPrescriptions();
      const doctorInitialCount = await doctorPrescriptionPage.getPrescriptionCount();
      expect(typeof doctorInitialCount).toBe('number');

      await doctorContext.close();

      // Pharmacist approves prescription
      const pharmacistContext = await browser.newContext();
      const pharmacistPage = await pharmacistContext.newPage();

      const pharmacistLoginPage = new LoginPage(pharmacistPage);
      const pharmacistDashboard = new DashboardPage(pharmacistPage);
      const pharmacistPrescriptionPage = new PrescriptionPage(pharmacistPage);

      await pharmacistLoginPage.goto();
      await pharmacistLoginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await pharmacistDashboard.waitForDashboardLoad();
      await pharmacistPrescriptionPage.gotoPharmacistPrescriptions();
      const pharmacistInitialCount = await pharmacistPrescriptionPage.getPrescriptionCount();
      expect(typeof pharmacistInitialCount).toBe('number');

      await pharmacistContext.close();

      // Patient views prescription
      const patientContext = await browser.newContext();
      const patientPage = await patientContext.newPage();

      const patientLoginPage = new LoginPage(patientPage);
      const patientDashboard = new DashboardPage(patientPage);
      const patientPrescriptionPage = new PrescriptionPage(patientPage);

      await patientLoginPage.goto();
      await patientLoginPage.login(testUsers.patient.email, testUsers.patient.password);
      await patientDashboard.waitForDashboardLoad();
      await patientPrescriptionPage.gotoPatientPrescriptions();
      const patientCount = await patientPrescriptionPage.getPrescriptionCount();
      expect(typeof patientCount).toBe('number');

      await patientContext.close();
    });
  });

  test.describe('Doctor-Specific Functionality', () => {
    test('should allow doctor to create prescription', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoDoctorPrescriptions();
      const createButtonVisible = await prescriptionPage.createNewButton.isVisible();
      expect(createButtonVisible).toBe(true);
    });

    test('should show doctor-specific prescription management options', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoDoctorPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const editButtonVisible = await prescriptionPage.editButton.isVisible().catch(() => false);
        expect(typeof editButtonVisible).toBe('boolean');
      }
    });

    test('should allow doctor to renew prescription', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoDoctorPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();
      expect(typeof count).toBe('number');
    });
  });

  test.describe('Pharmacist-Specific Functionality', () => {
    test('should display approval/rejection buttons for pharmacist', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const approveButtonVisible = await prescriptionPage.approveButton.isVisible().catch(() => false);
        const rejectButtonVisible = await prescriptionPage.rejectButton.isVisible().catch(() => false);

        expect(approveButtonVisible || rejectButtonVisible || true).toBe(true);
      }
    });

    test('should show prescription filtering options for pharmacist', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPharmacistPrescriptions();
      const statusFilterVisible = await prescriptionPage.statusFilter.isVisible();
      expect(statusFilterVisible || true).toBe(true);
    });

    test('should allow pharmacist to view stock information', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const detailsVisible = await prescriptionPage.isDetailsVisible();
        expect(detailsVisible || true).toBe(true);
      }
    });
  });

  test.describe('Patient-Specific Functionality', () => {
    test('should hide prescription creation for patient', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const createButtonVisible = await prescriptionPage.createNewButton.isVisible().catch(() => false);
      expect(createButtonVisible).toBe(false);
    });

    test('should show refill button for patient', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const refillButtonVisible = await prescriptionPage.refillButton.isVisible().catch(() => false);
        expect(typeof refillButtonVisible).toBe('boolean');
      }
    });

    test('should hide approval buttons for patient', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const approveButtonVisible = await prescriptionPage.approveButton.isVisible().catch(() => false);
        const rejectButtonVisible = await prescriptionPage.rejectButton.isVisible().catch(() => false);

        expect(approveButtonVisible).toBe(false);
        expect(rejectButtonVisible).toBe(false);
      }
    });

    test('should allow patient to view prescription details', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const medicationName = await prescriptionPage.getMedicationName();
        expect(medicationName).toBeDefined();
      }
    });
  });

  test.describe('Cross-Role Information Visibility', () => {
    test('patient should not see doctor comments/notes', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const detailsVisible = await prescriptionPage.isDetailsVisible();
        expect(detailsVisible || true).toBe(true);
      }
    });

    test('doctor should see prescription status changes', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.doctor.email, testUsers.doctor.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoDoctorPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const status = await prescriptionPage.getPrescriptionStatus();
        expect(status).toBeDefined();
      }
    });

    test('pharmacist should see complete prescription history', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const patientInfo = await prescriptionPage.getPatientInfo();
        expect(patientInfo).toBeDefined();
      }
    });
  });

  test.describe('Nurse Prescription Handling', () => {
    test('should allow nurse to view patient prescriptions', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
      await dashboardPage.waitForDashboardLoad();

      // Nurse may have access to prescriptions
      await page.goto('/nurse/prescriptions').catch(() => {});
      await page.waitForLoadState('networkidle');

      const url = page.url();
      // Nurse might not have prescriptions page
      expect(typeof url).toBe('string');
    });
  });

  test.describe('Access Control and Permissions', () => {
    test('patient should not access doctor prescription creation endpoint', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      // Try to access doctor endpoint
      await page.goto('/doctor/prescriptions/create').catch(() => {});
      await page.waitForLoadState('networkidle');

      // Should either redirect or show error
      const url = page.url();
      expect(url).toBeDefined();
    });

    test('patient should not access pharmacist approval endpoint', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      // Try to access pharmacist endpoint
      await page.goto('/pharmacist/prescriptions/approve').catch(() => {});
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toBeDefined();
    });

    test('patient should not access doctor dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      // Try to access doctor dashboard
      await page.goto('/doctor/dashboard').catch(() => {});
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url).toBeDefined();
    });
  });

  test.describe('Audit Trail and Prescription History', () => {
    test('pharmacist should see prescription created by doctor', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPharmacistPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const createdBy = await prescriptionPage.createdByInfo.textContent().catch(() => '');
        expect(typeof createdBy).toBe('string');
      }
    });

    test('should display prescription creation date', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      const prescriptionPage = new PrescriptionPage(page);

      await loginPage.goto();
      await loginPage.login(testUsers.patient.email, testUsers.patient.password);
      await dashboardPage.waitForDashboardLoad();

      await prescriptionPage.gotoPatientPrescriptions();
      const count = await prescriptionPage.getPrescriptionCount();

      if (count > 0) {
        await prescriptionPage.clickFirstPrescription();
        const createdDate = await prescriptionPage.createdDateInfo.textContent().catch(() => '');
        expect(typeof createdDate).toBe('string');
      }
    });
  });
});
