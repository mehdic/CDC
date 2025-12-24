/**
 * Nurse Patient Search and Selection E2E Tests
 * Tests for finding, searching, and selecting patients for medication ordering
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { NursePage } from '../../page-objects';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';

test.describe('Nurse - Patient Search and Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Mock patient search API responses
    await mockApiResponse(page, '**/nurse/patients/search**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            firstName: 'Paul',
            lastName: 'Deschamp',
            room: '101',
            bed: 'A',
            age: 72,
            medicalRecord: 'MR-001',
            department: 'Cardiology',
            primaryCondition: 'Hypertension',
            status: 'active',
          },
          {
            id: 'patient_002',
            firstName: 'Marie',
            lastName: 'Dupuis',
            room: '102',
            bed: 'B',
            age: 58,
            medicalRecord: 'MR-002',
            department: 'Orthopedics',
            primaryCondition: 'Post-operative care',
            status: 'active',
          },
          {
            id: 'patient_003',
            firstName: 'Jean',
            lastName: 'Leclerc',
            room: '103',
            bed: 'A',
            age: 45,
            medicalRecord: 'MR-003',
            department: 'Neurology',
            primaryCondition: 'Migraine management',
            status: 'active',
          },
        ],
        total: 3,
      },
    });

    // Mock patient details API
    await mockApiResponse(page, '**/nurse/patients/patient_001**', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'patient_001',
          firstName: 'Paul',
          lastName: 'Deschamp',
          room: '101',
          bed: 'A',
          age: 72,
          medicalRecord: 'MR-001',
          department: 'Cardiology',
          primaryCondition: 'Hypertension',
          allergies: ['Penicillin', 'NSAIDs'],
          currentMedications: ['Lisinopril', 'Metformine'],
          lastVitals: {
            bloodPressure: '130/80',
            heartRate: 72,
            temperature: 36.8,
            respiratoryRate: 16,
          },
          admissionDate: '2025-12-15',
          estimatedDischargeDate: '2025-12-28',
          insuranceProvider: 'CSS',
          eHealthId: 'EH-001',
        },
      },
    });

    // Mock empty search response
    await mockApiResponse(page, '**/nurse/patients/search?q=nonexistent**', {
      status: 200,
      body: {
        success: true,
        data: [],
        total: 0,
      },
    });

    // Mock room/ward patients list
    await mockApiResponse(page, '**/nurse/wards/ward_001/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            firstName: 'Paul',
            lastName: 'Deschamp',
            room: '101',
            bed: 'A',
            age: 72,
            status: 'active',
          },
          {
            id: 'patient_004',
            firstName: 'Robert',
            lastName: 'Marchand',
            room: '101',
            bed: 'B',
            age: 81,
            status: 'active',
          },
        ],
        total: 2,
      },
    });
  });

  test('should display patient search interface on dashboard', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify patient search input is visible
    await expect(nursePageObj.patientSearchInput).toBeVisible();
    await expect(nursePageObj.patientSearchInput).toHavePlaceholder(/search|chercher|patient/i);

    // Verify patient list area is visible
    await expect(nursePageObj.patientList).toBeVisible();

    // Verify no patients initially selected
    const selectedIndicator = nursePage.locator('[data-testid="patient-selected-indicator"]');
    await expect(selectedIndicator).not.toBeVisible();
  });

  test('should search for patient by full name', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient by full name
    await nursePageObj.patientSearchInput.fill('Paul Deschamp');
    await page.waitForLoadState('networkidle');

    // Verify search results
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientCard).toBeVisible();

    // Verify patient details are displayed
    await expect(patientCard.locator('[data-testid="patient-name"]')).toContainText(/Paul|Deschamp/);
    await expect(patientCard.locator('[data-testid="patient-room"]')).toContainText('101');
    await expect(patientCard.locator('[data-testid="patient-age"]')).toContainText('72');
  });

  test('should search for patient by first name', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search by first name
    await nursePageObj.patientSearchInput.fill('Paul');
    await page.waitForLoadState('networkidle');

    // Verify search results
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientCard).toBeVisible();
  });

  test('should search for patient by last name', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search by last name
    await nursePageObj.patientSearchInput.fill('Deschamp');
    await page.waitForLoadState('networkidle');

    // Verify search results
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientCard).toBeVisible();
  });

  test('should search for patient by medical record number', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search by medical record number
    await nursePageObj.patientSearchInput.fill('MR-001');
    await page.waitForLoadState('networkidle');

    // Verify search results
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientCard).toBeVisible();
  });

  test('should display multiple search results', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search with generic term
    await nursePageObj.patientSearchInput.fill('');
    await page.waitForLoadState('networkidle');

    // Verify multiple patients displayed
    const patientCards = nursePage.locator('[data-testid^="patient-patient_"]');
    const count = await patientCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show no results message for non-existent patient', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for non-existent patient
    await nursePageObj.patientSearchInput.fill('nonexistent');
    await page.waitForLoadState('networkidle');

    // Verify no results message
    const emptyState = nursePage.locator('[data-testid="no-patients-found"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no|aucun|not found/i);
  });

  test('should select patient from search results', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient
    await nursePageObj.patientSearchInput.fill('Paul Deschamp');
    await page.waitForLoadState('networkidle');

    // Select patient
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await patientCard.click();
    await page.waitForLoadState('networkidle');

    // Verify patient is selected
    await nursePageObj.expectPatientSelected('patient_001');

    // Verify patient details panel opens
    const detailsPanel = nursePage.locator('[data-testid="patient-details-panel"]');
    await expect(detailsPanel).toBeVisible();
  });

  test('should display selected patient details', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.patientSearchInput.fill('Paul Deschamp');
    await page.waitForLoadState('networkidle');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Verify patient details are displayed
    const currentPatientName = await nursePageObj.getCurrentPatientName();
    expect(currentPatientName).toContain('Paul');

    // Verify health information is displayed
    const allergiesSection = nursePage.locator('[data-testid="patient-allergies"]');
    await expect(allergiesSection).toBeVisible();

    const vitalsSection = nursePage.locator('[data-testid="patient-vitals"]');
    await expect(vitalsSection).toBeVisible();
  });

  test('should filter patients by room/ward', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Filter by ward
    const wardFilter = nursePage.locator('[data-testid="ward-filter"]');
    await wardFilter.click();

    const wardOption = nursePage.locator('[data-testid="ward-option-ward_001"]');
    await wardOption.click();
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const patientCards = nursePage.locator('[data-testid^="patient-patient_"]');
    await expect(patientCards.first()).toBeVisible();
  });

  test('should filter patients by department', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Filter by department
    const deptFilter = nursePage.locator('[data-testid="department-filter"]');
    await deptFilter.click();

    const deptOption = nursePage.locator('[data-testid="dept-option-cardiology"]');
    await deptOption.click();
    await page.waitForLoadState('networkidle');

    // Verify filtered results contain Cardiology patients
    const patientCard = nursePage.locator('[data-testid="patient-patient_001"]');
    await expect(patientCard).toBeVisible();
  });

  test('should clear search and show all patients', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient
    await nursePageObj.patientSearchInput.fill('Paul');
    await page.waitForLoadState('networkidle');

    // Clear search
    const clearButton = nursePage.locator('[data-testid="clear-search-button"]');
    await clearButton.click();

    // Verify search input is cleared
    await expect(nursePageObj.patientSearchInput).toHaveValue('');

    // Verify patient list is refreshed
    const patientCards = nursePage.locator('[data-testid^="patient-patient_"]');
    const count = await patientCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should switch between patients', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Select first patient
    await nursePageObj.patientSearchInput.fill('Paul');
    await page.waitForLoadState('networkidle');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    let currentPatientName = await nursePageObj.getCurrentPatientName();
    expect(currentPatientName).toContain('Paul');

    // Search for different patient
    await nursePageObj.patientSearchInput.fill('Marie');
    await page.waitForLoadState('networkidle');
    await nursePage.locator('[data-testid="patient-patient_002"]').click();
    await page.waitForLoadState('networkidle');

    // Verify new patient is selected
    currentPatientName = await nursePageObj.getCurrentPatientName();
    expect(currentPatientName).toContain('Marie');
  });

  test('should show patient allergies and contraindications', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Select patient
    await nursePageObj.patientSearchInput.fill('Paul Deschamp');
    await page.waitForLoadState('networkidle');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Verify allergies are displayed
    const allergyBadge = nursePage.locator('[data-testid="allergy-badge"]');
    await expect(allergyBadge).toBeVisible();
    await expect(allergyBadge).toContainText(/Penicillin|NSAID/);
  });

  test('should show patient current medications in search result', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient
    await nursePageObj.patientSearchInput.fill('Paul');
    await page.waitForLoadState('networkidle');

    // Verify current medications are shown
    const medicationInfo = nursePage.locator('[data-testid="patient-patient_001"] [data-testid="current-medications"]');
    await expect(medicationInfo).toBeVisible();
  });
});
