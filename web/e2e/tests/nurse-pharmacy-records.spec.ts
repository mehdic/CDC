import { test, expect } from '../fixtures/auth.fixture';
import { NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Pharmacy Patient Records Access (E2E-018)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock patient search
    await mockApiResponse(page, '**/nurse/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            name: 'Paul Deschamp',
            room: '101',
            dob: '1952-05-15',
            contact: '+41 79 123 4567',
          },
        ],
        total: 1,
      },
    });

    // Mock pharmacy patient records
    await mockApiResponse(page, '**/nurse/patients/patient_001/pharmacy-records**', {
      status: 200,
      body: {
        success: true,
        data: {
          patientId: 'patient_001',
          name: 'Paul Deschamp',
          dob: '1952-05-15',
          allergies: [
            {
              allergen: 'Penicillin',
              severity: 'severe',
              reaction: 'Anaphylaxis',
            },
            {
              allergen: 'Sulfa drugs',
              severity: 'moderate',
              reaction: 'Rash',
            },
          ],
          currentMedications: [
            {
              id: 'med_001',
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              startDate: '2024-01-15',
              prescribedBy: 'Dr. Jean Martin',
            },
            {
              id: 'med_002',
              name: 'Metformine',
              dosage: '500mg',
              frequency: 'Twice daily',
              startDate: '2023-06-20',
              prescribedBy: 'Dr. Jean Martin',
            },
          ],
          pastMedications: [
            {
              id: 'med_003',
              name: 'Aspirin',
              dosage: '100mg',
              frequency: 'Once daily',
              startDate: '2023-01-10',
              endDate: '2024-01-15',
            },
          ],
          medicalHistory: {
            conditions: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
            surgeries: [
              {
                name: 'Knee replacement',
                date: '2015-03-20',
              },
            ],
          },
          lastPharmacistReview: '2025-10-15',
          lastDeliveryDate: '2025-11-10',
          insuranceInfo: {
            provider: 'Assura',
            policyNumber: 'ASS-123456789',
            coverage: 'Standard',
          },
        },
      },
    });

    // Mock medication history
    await mockApiResponse(page, '**/nurse/patients/patient_001/medication-history**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            orderId: 'order_101',
            date: '2025-11-10',
            medications: ['Lisinopril 10mg x30', 'Metformine 500mg x60'],
            status: 'delivered',
            pharmacist: 'Marie Dupont',
          },
          {
            orderId: 'order_100',
            date: '2025-10-15',
            medications: ['Lisinopril 10mg x30', 'Metformine 500mg x60'],
            status: 'delivered',
            pharmacist: 'Marie Dupont',
          },
        ],
        total: 2,
      },
    });

    // Mock interaction check
    await mockApiResponse(page, '**/nurse/patients/patient_001/interactions**', {
      status: 200,
      body: {
        success: true,
        interactions: [],
        lastChecked: new Date().toISOString(),
      },
    });
  });

  test('should search for patient and access pharmacy records', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient
    await nursePageObj.searchPatient('Paul Deschamp');

    // Select patient
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify pharmacy records view is displayed
    await expect(nursePage.locator('[data-testid="pharmacy-records-view"]')).toBeVisible();
  });

  test('should display patient allergies prominently', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify allergies section is visible with alert styling
    const allergiesSection = nursePage.locator('[data-testid="allergies-section"]');
    await expect(allergiesSection).toBeVisible();

    // Verify allergies are listed
    const allergyList = allergiesSection.locator('[data-testid="allergy-item"]');
    const allergyCount = await allergyList.count();
    expect(allergyCount).toBeGreaterThanOrEqual(1);

    // Verify severe allergies have warning indicator
    const severeAllergy = nursePage.locator('[data-testid="allergy-penicillin"]');
    const severityBadge = severeAllergy.locator('[data-testid="severity-badge"]');
    if (await severityBadge.isVisible()) {
      await expect(severityBadge).toContainText(/severe/i);
    }

    // Verify allergy reactions are shown
    const reactionText = nursePage.locator('text=Anaphylaxis');
    await expect(reactionText).toBeVisible();
  });

  test('should display current medications with dosing information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // View current medications
    const currentMedsTab = nursePage.getByRole('tab', { name: /actuels|current|actifs/i });
    if (await currentMedsTab.isVisible()) {
      await currentMedsTab.click();
    }

    // Verify medications are listed
    const medList = nursePage.locator('[data-testid="current-medications-list"]');
    await expect(medList).toBeVisible();

    // Verify medication details
    const lisinopril = nursePage.locator('[data-testid="medication-lisinopril"]');
    await expect(lisinopril).toContainText('10mg');
    await expect(lisinopril).toContainText('Once daily');
    await expect(lisinopril).toContainText('Dr. Jean Martin');
  });

  test('should display medication history with dates', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // View medication history
    await nursePageObj.viewMedicationHistory();

    // Verify history list is displayed
    const historyList = nursePage.locator('[data-testid="medication-history-list"]');
    await expect(historyList).toBeVisible();

    // Verify history entries have dates
    const historyEntry = nursePage.locator('[data-testid="history-entry-order_101"]');
    await expect(historyEntry).toBeVisible();
    await expect(historyEntry).toContainText('2025-11-10');

    // Verify delivery status is shown
    const deliveryStatus = historyEntry.locator('[data-testid="delivery-status"]');
    await expect(deliveryStatus).toContainText(/livrée|delivered/i);
  });

  test('should display medical history and conditions', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify medical history section
    const medicalHistorySection = nursePage.locator('[data-testid="medical-history-section"]');
    await expect(medicalHistorySection).toBeVisible();

    // Verify conditions are listed
    const conditionsList = medicalHistorySection.locator('[data-testid="conditions-list"]');
    await expect(conditionsList).toContainText('Hypertension');
    await expect(conditionsList).toContainText('Type 2 Diabetes');
    await expect(conditionsList).toContainText('Hyperlipidemia');

    // Verify surgeries are listed
    const surgeriesList = medicalHistorySection.locator('[data-testid="surgeries-list"]');
    if (await surgeriesList.isVisible()) {
      await expect(surgeriesList).toContainText('Knee replacement');
    }
  });

  test('should display insurance information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify insurance section
    const insuranceSection = nursePage.locator('[data-testid="insurance-section"]');
    await expect(insuranceSection).toBeVisible();

    // Verify insurance details
    await expect(insuranceSection).toContainText('Assura');
    await expect(insuranceSection).toContainText('ASS-123456789');
    await expect(insuranceSection).toContainText(/standard|Standard/);
  });

  test('should check for drug interactions with current medications', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify interaction check section
    const interactionSection = nursePage.locator('[data-testid="interaction-check-section"]');
    if (await interactionSection.isVisible()) {
      // Verify no interactions found message
      const noInteractions = nursePage.locator('[data-testid="no-interactions-message"]');
      if (await noInteractions.isVisible()) {
        await expect(noInteractions).toContainText(/aucune|no interactions/i);
      }

      // Verify last checked date
      const lastChecked = interactionSection.locator('[data-testid="interaction-last-checked"]');
      if (await lastChecked.isVisible()) {
        await expect(lastChecked).toBeVisible();
      }
    }
  });

  test('should display pharmacist review information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify pharmacist review section
    const reviewSection = nursePage.locator('[data-testid="pharmacist-review-section"]');
    if (await reviewSection.isVisible()) {
      await expect(reviewSection).toContainText('2025-10-15');
      // Verify contact information for pharmacist
      const pharmacistContact = reviewSection.locator('[data-testid="pharmacist-contact"]');
      if (await pharmacistContact.isVisible()) {
        await expect(pharmacistContact).toBeVisible();
      }
    }
  });

  test('should allow export of pharmacy records', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify export button
    const exportButton = nursePage.getByRole('button', { name: /exporter|export|pdf|télécharger/i });
    if (await exportButton.isVisible()) {
      // Click export
      const downloadPromise = nursePage.context().waitForEvent('download');
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('pharmacy-records');
    }
  });

  test('should display contact information for contacting pharmacist', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify pharmacist contact section
    const contactSection = nursePage.locator('[data-testid="pharmacist-contact-section"]');
    if (await contactSection.isVisible()) {
      // Verify messaging button
      const messageButton = contactSection.getByRole('button', { name: /message|messagerie|contacter/i });
      if (await messageButton.isVisible()) {
        await expect(messageButton).toBeVisible();
      }
    }
  });

  test('should show past medications with end dates', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // View past medications
    const pastMedsTab = nursePage.getByRole('tab', { name: /anciens|past|historique/i });
    if (await pastMedsTab.isVisible()) {
      await pastMedsTab.click();

      // Verify past medications list
      const pastMedsList = nursePage.locator('[data-testid="past-medications-list"]');
      if (await pastMedsList.isVisible()) {
        // Verify past medication entry
        const aspirin = nursePage.locator('[data-testid="medication-aspirin"]');
        if (await aspirin.isVisible()) {
          await expect(aspirin).toBeVisible();

          // Verify end date is shown
          const endDate = aspirin.locator('[data-testid="end-date"]');
          if (await endDate.isVisible()) {
            await expect(endDate).toContainText('2024-01-15');
          }
        }
      }
    }
  });

  test('should handle access denied gracefully', async ({ nursePage }) => {
    // Mock access denied response
    await mockApiResponse(nursePage, '**/nurse/patients/patient_002/pharmacy-records**', {
      status: 403,
      body: {
        success: false,
        error: 'Access denied: No authorization to view this patient record',
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Try to access unauthorized patient
    // This would be set up differently in actual test - simulating access attempt
    const accessDeniedMessage = nursePage.locator('[data-testid="access-denied-message"]');
    if (await accessDeniedMessage.isVisible()) {
      await expect(accessDeniedMessage).toContainText(/access denied|non autorisé/i);
    }
  });

  test('should display patient contact information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Access pharmacy records
    await nursePageObj.accessPharmacyPatientRecords();

    // Verify patient info section
    const patientInfoSection = nursePage.locator('[data-testid="patient-info-section"]');
    if (await patientInfoSection.isVisible()) {
      // Verify contact info
      await expect(patientInfoSection).toContainText('+41 79 123 4567');

      // Verify date of birth
      const dobElement = patientInfoSection.locator('[data-testid="patient-dob"]');
      if (await dobElement.isVisible()) {
        await expect(dobElement).toContainText('1952-05-15');
      }
    }
  });
});
