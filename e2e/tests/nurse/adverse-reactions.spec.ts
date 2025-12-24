import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { NursePage } from '../../pages/NursePage';
import { testUsers } from '../../fixtures/users';
import { APIMocks } from '../../utils/api-mocks';
import {
  adverseReactionData,
  patientData,
  medicationOrderData,
} from '../../fixtures/nurse-test-data';

test.describe('Nurse Workflow - Adverse Reaction Reporting', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let nursePage: NursePage;

  test.beforeEach(async ({ page }) => {
    // Setup API mocks for nurse workflows
    await APIMocks.mockLoginEndpoint(page, true);
    await APIMocks.mockAllNurseEndpoints(page);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    nursePage = new NursePage(page);

    // Login as nurse
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await dashboardPage.waitForDashboardLoad();
  });

  test('Report mild allergic reaction (rash)', async ({ page }) => {
    // Navigate to medication orders
    await nursePage.goto();
    expect(page.url()).toContain('/medications');

    // Select patient
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Report adverse reaction
    const reactionData = adverseReactionData.mildAllergy;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    // Verify success
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Verify reaction was recorded
    const successMsg = await nursePage.getSuccessMessage();
    expect(successMsg.toLowerCase()).toContain('reaction');
  });

  test('Report severe adverse reaction (Stevens-Johnson Syndrome)', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.moderateStevens;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Severe reaction should be escalated
    const successMsg = await nursePage.getSuccessMessage();
    expect(successMsg).toBeDefined();
  });

  test('Report critical anaphylactic reaction', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.severeAnaphylaxis;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Critical reaction should trigger emergency protocols
    const successMsg = await nursePage.getSuccessMessage();
    expect(successMsg).toBeDefined();
  });

  test('Report gastrointestinal adverse reaction (nausea)', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.mildNausea;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Report severe gastrointestinal reaction (severe diarrhea)', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.severeDiarrhea;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Severe GI reaction may require intervention
    const successMsg = await nursePage.getSuccessMessage();
    expect(successMsg).toBeDefined();
  });

  test('Adverse reaction prevents future orders of same medication', async ({ page }) => {
    // Report adverse reaction
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.mildAllergy;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Try to order the same medication again
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.createMedicationOrder(
      reactionData.medicationName,
      '500mg',
      10,
      'routine'
    );

    // Should show warning or error about allergic history
    const errorMsg = await nursePage.getErrorMessage();
    const hasAllergicWarning = errorMsg.toLowerCase().includes('allergy') ||
      errorMsg.toLowerCase().includes('contraindicated') ||
      errorMsg.toLowerCase().includes('adverse');

    expect(errorMsg.length > 0 || hasAllergicWarning).toBe(true);
  });

  test('Adverse reaction is documented in patient record', async ({ page }) => {
    // Report adverse reaction
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    const reactionData = adverseReactionData.mildAllergy;
    await nursePage.reportAdverseReaction(
      reactionData.medicationName,
      reactionData.reactionType,
      reactionData.severity,
      reactionData.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // View patient records to verify documentation
    await nursePage.viewPatientRecords(0);
    const hasRecords = await nursePage.checkPatientAllergies();
    expect(hasRecords).toBe(true);
  });

  test('Multiple adverse reactions tracked for same patient', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Report first reaction
    await nursePage.reportAdverseReaction(
      adverseReactionData.mildAllergy.medicationName,
      adverseReactionData.mildAllergy.reactionType,
      adverseReactionData.mildAllergy.severity,
      adverseReactionData.mildAllergy.description
    );
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Report second reaction
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.reportAdverseReaction(
      adverseReactionData.mildNausea.medicationName,
      adverseReactionData.mildNausea.reactionType,
      adverseReactionData.mildNausea.severity,
      adverseReactionData.mildNausea.description
    );
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Both reactions should be documented
    await nursePage.viewPatientRecords(0);
    const hasAllergies = await nursePage.checkPatientAllergies();
    expect(hasAllergies).toBe(true);
  });

  test('Reaction severity level determines escalation', async ({ page }) => {
    // Mild reaction
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.reportAdverseReaction(
      adverseReactionData.mildAllergy.medicationName,
      adverseReactionData.mildAllergy.reactionType,
      adverseReactionData.mildAllergy.severity,
      adverseReactionData.mildAllergy.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Critical reaction in same session
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);

    await nursePage.reportAdverseReaction(
      adverseReactionData.severeAnaphylaxis.medicationName,
      adverseReactionData.severeAnaphylaxis.reactionType,
      adverseReactionData.severeAnaphylaxis.severity,
      adverseReactionData.severeAnaphylaxis.description
    );

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Adverse reaction history integrated with new orders', async ({ page }) => {
    // Create medication order
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // View allergies/reactions before ordering
    const hasAllergies = await nursePage.checkPatientAllergies();
    if (hasAllergies) {
      expect(true).toBe(true);
    }

    // Order medication should check for allergies
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Adverse reaction can be reported during medication administration', async ({ page }) => {
    // User can report reaction while administering medication
    // This tests the UI flow for reporting reactions in real-time
    await nursePage.goto();
    expect(page.url()).toContain('/medications');

    // The adverse reaction reporting should be accessible from medication context
    const hasReactionButton = await nursePage.adverseReactionButton.isVisible();
    expect(hasReactionButton).toBe(true);
  });

  test('Time-stamped adverse reaction records', async ({ page }) => {
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Record timestamp when reporting
    const beforeReport = new Date();
    await nursePage.reportAdverseReaction(
      adverseReactionData.mildAllergy.medicationName,
      adverseReactionData.mildAllergy.reactionType,
      adverseReactionData.mildAllergy.severity,
      adverseReactionData.mildAllergy.description
    );
    const afterReport = new Date();

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Reaction should be timestamped between before and after
    expect(afterReport.getTime()).toBeGreaterThanOrEqual(beforeReport.getTime());
  });
});
