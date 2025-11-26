import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-005: Prescription Creation During Teleconsultation
 *
 * End-to-end test for creating and sending prescriptions during
 * a live teleconsultation, including:
 * - Drug search and selection
 * - Dosage and instructions
 * - Drug interaction checking (FDB integration)
 * - Patient allergy verification
 * - Digital signature
 * - E-prescription transmission
 * - Audit trail logging (HIPAA compliance)
 */
test.describe('Prescription Creation During Teleconsultation (E2E-005)', () => {
  test.beforeEach(async ({ pharmacistPage }) => {
    // Mock active teleconsultation
    await mockApiResponse(pharmacistPage, '**/consultations/consult_001/join', {
      status: 200,
      body: {
        success: true,
        twilioToken: 'mock_token',
        roomName: 'room_001',
        patient: {
          id: 'patient_001',
          firstName: 'Sophie',
          lastName: 'Bernard',
          age: 35,
          allergies: ['Pénicilline', 'Latex'],
          chronicConditions: ['Diabète type 2'],
        },
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');
  });

  test('creates prescription during active video call', async ({ pharmacistPage }) => {
    // Open prescription creation panel
    await pharmacistPage
      .getByRole('button', { name: /créer.*ordonnance|create prescription/i })
      .click();

    // Verify patient info pre-filled
    await expect(pharmacistPage.locator('[data-testid="patient-name"]')).toContainText(
      'Sophie Bernard'
    );
    await expect(pharmacistPage.locator('[data-testid="patient-age"]')).toContainText('35');

    // Verify allergy warnings visible
    await expect(pharmacistPage.locator('[data-testid="patient-allergies"]')).toContainText(
      'Pénicilline'
    );
    await expect(pharmacistPage.locator('[data-testid="patient-allergies"]')).toContainText(
      'Latex'
    );

    // Mock drug search
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [
          {
            id: 'drug_001',
            name: 'Metformine 500mg',
            form: 'comprimé',
            strength: '500mg',
            manufacturer: 'Novartis',
            requiresPrescription: true,
          },
          {
            id: 'drug_002',
            name: 'Metformine 850mg',
            form: 'comprimé',
            strength: '850mg',
            manufacturer: 'Novartis',
            requiresPrescription: true,
          },
        ],
      },
    });

    // Search for medication
    await pharmacistPage.getByLabel(/rechercher.*médicament|search drug/i).fill('Metformine');
    await pharmacistPage.waitForTimeout(500); // Debounce

    // Select medication from results
    await pharmacistPage.locator('[data-testid="drug-result-drug_001"]').click();

    // Fill dosage instructions
    await pharmacistPage.getByLabel(/posologie|dosage/i).fill('1 comprimé 2 fois par jour');
    await pharmacistPage.getByLabel(/durée.*traitement|treatment duration/i).fill('30 jours');
    await pharmacistPage
      .getByLabel(/instructions|special instructions/i)
      .fill('Prendre pendant les repas');

    // Set quantity
    await pharmacistPage.getByLabel(/quantité|quantity/i).fill('60');

    // Verify prescription preview
    await expect(pharmacistPage.locator('[data-testid="prescription-preview"]')).toContainText(
      'Metformine 500mg'
    );
    await expect(pharmacistPage.locator('[data-testid="prescription-preview"]')).toContainText(
      '1 comprimé 2 fois par jour'
    );
    await expect(pharmacistPage.locator('[data-testid="prescription-preview"]')).toContainText(
      '60 comprimés'
    );
  });

  test('checks drug interactions before prescribing', async ({ pharmacistPage }) => {
    // Mock patient's current medications
    await mockApiResponse(pharmacistPage, '**/patients/patient_001/medications', {
      status: 200,
      body: {
        success: true,
        currentMedications: [
          {
            id: 'med_001',
            drugName: 'Warfarine 5mg',
            dosage: '1 comprimé par jour',
            startDate: '2024-01-15',
          },
        ],
      },
    });

    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Search for drug with known interaction
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [
          {
            id: 'drug_aspirin',
            name: 'Aspirine 100mg',
            form: 'comprimé',
          },
        ],
      },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Aspirine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_aspirin"]').click();

    // Mock FDB drug interaction check
    await mockApiResponse(pharmacistPage, '**/prescriptions/check-interactions', {
      status: 200,
      body: {
        success: true,
        interactions: [
          {
            severity: 'high',
            drug1: 'Warfarine',
            drug2: 'Aspirine',
            description: 'Risque accru de saignement',
            recommendation: 'Surveillance INR recommandée',
            source: 'FDB MedKnowledge',
          },
        ],
      },
    });

    // Fill dosage (triggers interaction check)
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé par jour');
    await pharmacistPage.waitForTimeout(1000);

    // Verify interaction warning displayed
    const interactionAlert = pharmacistPage.locator('[data-testid="drug-interaction-warning"]');
    await expect(interactionAlert).toBeVisible();
    await expect(interactionAlert).toContainText(/warfarine.*aspirine/i);
    await expect(interactionAlert).toContainText(/risque.*saignement/i);

    // Verify severity indicator
    await expect(interactionAlert).toHaveAttribute('data-severity', 'high');

    // Pharmacist can proceed with acknowledgment
    await pharmacistPage
      .getByLabel(/j'ai pris connaissance.*interactions|i acknowledge.*interactions/i)
      .check();
    await pharmacistPage
      .getByLabel(/justification clinique|clinical justification/i)
      .fill('Patient sous surveillance INR hebdomadaire');
  });

  test('prevents prescribing drugs patient is allergic to', async ({ pharmacistPage }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Mock drug search for Amoxicillin (penicillin-based)
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [
          {
            id: 'drug_amoxicillin',
            name: 'Amoxicilline 500mg',
            form: 'gélule',
            allergyGroups: ['Pénicilline'], // Patient is allergic to this
          },
        ],
      },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Amoxicilline');
    await pharmacistPage.locator('[data-testid="drug-result-drug_amoxicillin"]').click();

    // Verify allergy alert displayed (CRITICAL - blocks prescription)
    const allergyAlert = pharmacistPage.locator('[data-testid="allergy-alert"]');
    await expect(allergyAlert).toBeVisible();
    await expect(allergyAlert).toContainText(/allergie.*pénicilline/i);
    await expect(allergyAlert).toHaveAttribute('data-severity', 'critical');

    // Verify "Add to prescription" button is disabled
    const addButton = pharmacistPage.getByRole('button', {
      name: /ajouter.*ordonnance|add to prescription/i,
    });
    await expect(addButton).toBeDisabled();

    // Can only proceed with override confirmation (requires justification)
    const overrideCheckbox = pharmacistPage.getByLabel(
      /forcer.*prescription.*risques|override.*at your own risk/i
    );
    await expect(overrideCheckbox).toBeVisible();
  });

  test('adds multiple medications to prescription', async ({ pharmacistPage }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Add first medication
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [{ id: 'drug_001', name: 'Metformine 500mg' }],
      },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Metformine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_001"]').click();
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé 2x/jour');
    await pharmacistPage.getByRole('button', { name: /ajouter|add/i }).click();

    // Verify first medication added to list
    await expect(pharmacistPage.locator('[data-testid="prescription-medications"]')).toContainText(
      'Metformine 500mg'
    );

    // Add second medication
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [{ id: 'drug_002', name: 'Atorvastatine 20mg' }],
      },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Atorvastatine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_002"]').click();
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé le soir');
    await pharmacistPage.getByRole('button', { name: /ajouter|add/i }).click();

    // Verify both medications in prescription
    const medicationList = pharmacistPage.locator('[data-testid="prescription-medications"]');
    await expect(medicationList).toContainText('Metformine 500mg');
    await expect(medicationList).toContainText('Atorvastatine 20mg');

    // Verify medication count
    await expect(pharmacistPage.locator('[data-testid="medication-count"]')).toContainText('2');
  });

  test('applies digital signature to prescription', async ({ pharmacistPage }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Add medication (simplified)
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: { success: true, drugs: [{ id: 'drug_001', name: 'Metformine 500mg' }] },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Metformine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_001"]').click();
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé 2x/jour');
    await pharmacistPage.getByLabel(/quantité/i).fill('60');
    await pharmacistPage.getByRole('button', { name: /ajouter|add/i }).click();

    // Proceed to signature
    await pharmacistPage.getByRole('button', { name: /signer.*envoyer|sign and send/i }).click();

    // Verify digital signature panel
    await expect(pharmacistPage.locator('[data-testid="signature-panel"]')).toBeVisible();

    // Mock HIN e-ID signature (Swiss healthcare standard)
    await mockApiResponse(pharmacistPage, '**/prescriptions/sign', {
      status: 200,
      body: {
        success: true,
        signatureMethod: 'HIN_eID',
        signatureTimestamp: new Date().toISOString(),
        signatureHash: 'sha256:abcdef123456...',
        prescriptionId: 'rx_new_001',
      },
    });

    // Sign with HIN e-ID
    await pharmacistPage.getByRole('button', { name: /signer avec hin|sign with hin/i }).click();

    // Verify signature confirmation
    await expect(pharmacistPage.locator('[role="alert"]')).toContainText(
      /signature appliquée|signature applied/i
    );
    await expect(pharmacistPage.locator('[data-testid="signature-status"]')).toContainText(
      /signée|signed/i
    );
  });

  test('sends e-prescription directly to patient app', async ({ pharmacistPage, context }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Add medication and sign (abbreviated)
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: { success: true, drugs: [{ id: 'drug_001', name: 'Metformine 500mg' }] },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Metformine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_001"]').click();
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé 2x/jour');
    await pharmacistPage.getByLabel(/quantité/i).fill('60');
    await pharmacistPage.getByRole('button', { name: /ajouter/i }).click();

    // Mock prescription creation and transmission
    await mockApiResponse(pharmacistPage, '**/prescriptions/create-and-send', {
      status: 201,
      body: {
        success: true,
        prescriptionId: 'rx_new_001',
        sentToPatient: true,
        sentAt: new Date().toISOString(),
        deliveryMethod: 'in_app_notification',
        backupEmail: true,
      },
    });

    // Send prescription
    await pharmacistPage.getByRole('button', { name: /signer.*envoyer|sign and send/i }).click();
    await pharmacistPage.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify success notification
    await expect(pharmacistPage.locator('[role="alert"]')).toContainText(
      /ordonnance envoyée|prescription sent/i
    );

    // Verify prescription appears in consultation notes
    await expect(
      pharmacistPage.locator('[data-testid="consultation-prescriptions"]')
    ).toContainText('rx_new_001');

    // Open second tab to verify patient received prescription
    const patientPage = await context.newPage();
    await mockApiResponse(patientPage, '**/auth/login', {
      status: 200,
      body: {
        success: true,
        token: 'mock_patient_token',
        user: { id: 'patient_001', role: 'patient' },
      },
    });

    await patientPage.goto('/login');
    await patientPage.getByLabel(/email/i).fill('patient@example.ch');
    await patientPage.getByLabel(/mot de passe/i).fill('PatientPass123!');
    await patientPage.getByRole('button', { name: /connexion/i }).click();

    // Mock patient's prescriptions
    await mockApiResponse(patientPage, '**/prescriptions/my-prescriptions', {
      status: 200,
      body: {
        success: true,
        prescriptions: [
          {
            id: 'rx_new_001',
            pharmacistName: 'Dr. Marie Dubois',
            createdAt: new Date().toISOString(),
            status: 'active',
            medications: [{ drugName: 'Metformine 500mg', quantity: 60 }],
          },
        ],
      },
    });

    await patientPage.goto('/prescriptions');

    // Verify prescription visible in patient app
    await expect(patientPage.locator('[data-testid="prescription-rx_new_001"]')).toBeVisible();

    await patientPage.close();
  });

  test('logs prescription creation in audit trail (HIPAA compliance)', async ({
    pharmacistPage,
  }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Add and send prescription (abbreviated)
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: { success: true, drugs: [{ id: 'drug_001', name: 'Metformine 500mg' }] },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Metformine');
    await pharmacistPage.locator('[data-testid="drug-result-drug_001"]').click();
    await pharmacistPage.getByLabel(/posologie/i).fill('1 comprimé 2x/jour');
    await pharmacistPage.getByRole('button', { name: /ajouter/i }).click();

    // Mock audit logging
    let auditLogCalled = false;
    await pharmacistPage.route('**/audit/log', (route) => {
      auditLogCalled = true;
      const postData = route.request().postDataJSON();

      // Verify audit log contains required fields
      expect(postData.action).toBe('PRESCRIPTION_CREATED');
      expect(postData.userId).toBe('pharmacist_001');
      expect(postData.patientId).toBe('patient_001');
      expect(postData.resourceType).toBe('prescription');
      expect(postData.timestamp).toBeTruthy();
      expect(postData.ipAddress).toBeTruthy();

      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Send prescription (triggers audit log)
    await mockApiResponse(pharmacistPage, '**/prescriptions/create-and-send', {
      status: 201,
      body: { success: true, prescriptionId: 'rx_new_001' },
    });

    await pharmacistPage.getByRole('button', { name: /signer.*envoyer/i }).click();
    await pharmacistPage.getByRole('button', { name: /envoyer/i }).click();

    // Wait for audit log call
    await pharmacistPage.waitForTimeout(1000);

    // Verify audit log was called
    expect(auditLogCalled).toBeTruthy();
  });

  test('handles controlled substance prescription with additional verification', async ({
    pharmacistPage,
  }) => {
    await pharmacistPage.getByRole('button', { name: /créer.*ordonnance/i }).click();

    // Search for controlled substance (Schedule II)
    await mockApiResponse(pharmacistPage, '**/drugs/search**', {
      status: 200,
      body: {
        success: true,
        drugs: [
          {
            id: 'drug_oxycodone',
            name: 'Oxycodone 10mg',
            form: 'comprimé',
            controlledSubstance: true,
            scheduleClass: 'II',
            requiresJustification: true,
          },
        ],
      },
    });

    await pharmacistPage.getByLabel(/rechercher.*médicament/i).fill('Oxycodone');
    await pharmacistPage.locator('[data-testid="drug-result-drug_oxycodone"]').click();

    // Verify controlled substance warning
    const controlledWarning = pharmacistPage.locator(
      '[data-testid="controlled-substance-warning"]'
    );
    await expect(controlledWarning).toBeVisible();
    await expect(controlledWarning).toContainText(/substance contrôlée|controlled substance/i);
    await expect(controlledWarning).toContainText(/Schedule II/i);

    // Additional fields required for controlled substances
    await expect(
      pharmacistPage.getByLabel(/indication médicale|medical indication/i)
    ).toBeVisible();
    await expect(pharmacistPage.getByLabel(/justification|justification/i)).toBeVisible();

    await pharmacistPage.getByLabel(/indication médicale/i).fill('Douleur post-opératoire');
    await pharmacistPage
      .getByLabel(/justification/i)
      .fill('Suite opération chirurgicale du 15/11/2024');
    await pharmacistPage
      .getByLabel(/posologie/i)
      .fill('1 comprimé toutes les 6 heures si nécessaire');
    await pharmacistPage.getByLabel(/quantité/i).fill('20'); // Limited quantity for controlled substances

    // Verify maximum quantity warning
    await expect(pharmacistPage.locator('[data-testid="max-quantity-info"]')).toContainText(
      /maximum 30 comprimés|maximum 30 tablets/i
    );
  });
});
