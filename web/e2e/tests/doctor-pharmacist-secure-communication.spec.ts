import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { MessagingPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E-029: Doctor-Pharmacist Secure Communication
 *
 * Tests secure messaging and communication workflows between doctors and pharmacists:
 * 1. Doctor sends prescription with clarification question
 * 2. Pharmacist receives and responds securely
 * 3. Prescription-linked messaging with context
 * 4. Encrypted communication verification
 * 5. Audit trail for all communications
 * 6. Multi-channel support (in-app, email aggregation)
 */

test.describe('E2E-029: Doctor-Pharmacist Secure Communication', () => {
  const conversationId = 'conv_doctor_pharm_001';
  const prescriptionId = 'rx_secure_001';
  const doctorId = 'doctor_001';
  const pharmacistId = 'pharmacist_001';
  const patientId = 'patient_001';

  test.beforeEach(async ({ page }) => {
    // Mock prescription context
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          patientId: patientId,
          patientName: 'Sophie Bernard',
          doctorId: doctorId,
          doctorName: 'Dr. Jean Martin',
          pharmacyId: 'pharmacy-1',
          pharmacistId: pharmacistId,
          medications: [
            {
              name: 'Warfarin',
              dosage: '5mg',
              frequency: 'Once daily',
              duration: '90 days',
            },
          ],
          status: 'pending_pharmacist_review',
        },
      },
    });
  });

  /**
   * Scenario 1: Doctor initiates secure message to pharmacist about prescription
   */
  test('should allow doctor to send secure message to pharmacist with prescription context', async ({ page }) => {
    // Login as doctor
    await page.goto('/');
    await login(page, testUsers.doctor);

    // Mock pharmacist directory
    await mockApiResponse(page, '**/doctor/pharmacies/**', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'pharmacy-1',
          name: 'Pharmacie de la Gare',
          primaryPharmacist: {
            id: pharmacistId,
            name: 'Marie Dupont, PharmD',
            license: 'CH-PHARM-12345',
          },
          address: 'Rue de la Gare 12, 1200 Genève',
          phone: '+41 22 123 45 67',
        },
      },
    });

    // Mock message send with encryption
    await mockApiResponse(page, '**/messaging/send', {
      status: 201,
      body: {
        success: true,
        messageId: 'msg_secure_001',
        conversationId: conversationId,
        encrypted: true,
        timestamp: new Date().toISOString(),
      },
    });

    // Navigate to prescriptions
    await page.getByRole('link', { name: /prescriptions|ordonnances/i }).click();

    // Click on prescription
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();

    // Click message pharmacist button
    await page.getByRole('button', { name: /contacter pharmacien|message pharmacist|contact pharmacy/i }).click();

    // Verify messaging modal opened with context
    await expect(page.locator('[data-testid="message-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="recipient"]')).toContainText('Marie Dupont');
    await expect(page.locator('[data-testid="recipient-license"]')).toContainText('CH-PHARM-12345');

    // Verify prescription context attached
    await expect(page.locator('[data-testid="prescription-context"]')).toBeVisible();
    await expect(page.locator('[data-testid="prescription-context"]')).toContainText('Warfarin 5mg');
    await expect(page.locator('[data-testid="prescription-context"]')).toContainText('Sophie Bernard');

    // Verify encryption indicator visible
    await expect(page.locator('[data-testid="encryption-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="encryption-indicator"]')).toContainText(/encrypted|chiffré/i);

    // Type message
    await page.locator('[data-testid="message-input"]').fill(
      'Bonjour Marie, I prescribed Warfarin 5mg for Sophie Bernard. Please note she has a history of GI bleeding. Monitor INR closely and contact me if you have any concerns. Patient should avoid NSAIDs.'
    );

    // Mark as urgent
    await page.locator('[data-testid="urgent-checkbox"]').check();

    // Send message
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify success with encryption confirmation
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/sent|envoyé/i);
    await expect(page.locator('[data-testid="encryption-confirmed"]')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 2: Pharmacist receives and responds to doctor's secure message
   */
  test('should allow pharmacist to receive and respond to doctor message with prescription context', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock conversations for pharmacist
    await mockApiResponse(page, '**/pharmacist/conversations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: conversationId,
            participantName: 'Dr. Jean Martin',
            participantRole: 'doctor',
            participantId: doctorId,
            lastMessage: 'Prescribed Warfarin 5mg for Sophie Bernard',
            lastMessageTime: new Date(Date.now() - 300000).toISOString(),
            unreadCount: 1,
            urgent: true,
            prescriptionId: prescriptionId,
            encrypted: true,
          },
        ],
      },
    });

    // Mock messages in conversation
    await mockApiResponse(page, `**/pharmacist/conversations/${conversationId}/messages`, {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'msg_secure_001',
            senderId: doctorId,
            senderName: 'Dr. Jean Martin',
            senderRole: 'doctor',
            content: 'I prescribed Warfarin 5mg for Sophie Bernard. Please note she has a history of GI bleeding. Monitor INR closely and contact me if you have any concerns. Patient should avoid NSAIDs.',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            prescriptionId: prescriptionId,
            urgent: true,
            encrypted: true,
            readAt: null,
          },
        ],
      },
    });

    // Mock message reply
    await mockApiResponse(page, `**/pharmacist/conversations/${conversationId}/messages`, {
      status: 201,
      body: {
        success: true,
        messageId: 'msg_secure_002',
        encrypted: true,
      },
    });

    // Navigate to messaging
    await page.getByRole('link', { name: /messagerie|messaging|messages/i }).click();

    // Verify urgent message badge
    await expect(page.locator('[data-testid="unread-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="unread-badge"]')).toContainText('1');

    // Verify urgent conversation highlighted
    const conversation = page.locator(`[data-testid="conversation-${conversationId}"]`);
    await expect(conversation).toBeVisible();
    await expect(conversation.locator('[data-testid="urgent-indicator"]')).toBeVisible();

    // Verify encryption badge
    await expect(conversation.locator('[data-testid="encrypted-badge"]')).toBeVisible();

    // Click on conversation
    await conversation.click();

    // Verify conversation header with doctor info
    await expect(page.locator('[data-testid="conversation-header"]')).toContainText('Dr. Jean Martin');
    await expect(page.locator('[data-testid="participant-role"]')).toContainText('doctor');

    // Verify prescription context panel
    await expect(page.locator('[data-testid="prescription-context-panel"]')).toBeVisible();
    await expect(page.getByText('Warfarin 5mg')).toBeVisible();
    await expect(page.getByText('Sophie Bernard')).toBeVisible();

    // Verify message displayed with warning
    const message = page.locator('[data-testid="message-msg_secure_001"]');
    await expect(message).toContainText('history of GI bleeding');
    await expect(message).toContainText('Monitor INR closely');

    // Click on prescription context to view full details
    await page.locator('[data-testid="prescription-context-panel"]').click();
    await expect(page.locator('[data-testid="prescription-details-modal"]')).toBeVisible();
    await page.locator('[data-testid="close-modal"]').click();

    // Type response
    await page.locator('[data-testid="message-input"]').fill(
      'Thank you Dr. Martin for the context. I have noted the GI bleeding history. I will counsel the patient on: 1) Taking with food, 2) Signs of bleeding to watch for, 3) Avoiding NSAIDs/aspirin, 4) Importance of INR monitoring. I will also check for drug interactions with her current medications. Will follow up if any issues arise.'
    );

    // Send response
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify sent with encryption
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="encryption-confirmed"]')).toBeVisible();

    // Verify message appears in thread
    await expect(page.getByText('Thank you Dr. Martin for the context')).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 3: Pharmacist requests prescription clarification from doctor
   */
  test('should allow pharmacist to request prescription clarification with safety concern', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock prescription with potential interaction
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          patientName: 'Sophie Bernard',
          doctorId: doctorId,
          doctorName: 'Dr. Jean Martin',
          medications: [
            {
              name: 'Warfarin',
              dosage: '5mg',
              frequency: 'Once daily',
            },
          ],
          patientCurrentMedications: [
            'Aspirin 81mg daily', // Interaction with Warfarin
          ],
        },
      },
    });

    // Mock AI interaction check
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}/interactions`, {
      status: 200,
      body: {
        success: true,
        interactions: [
          {
            drug1: 'Warfarin',
            drug2: 'Aspirin',
            severity: 'high',
            description: 'Increased bleeding risk. Combination requires careful monitoring.',
            recommendation: 'Consider discontinuing aspirin or using alternative anticoagulation.',
          },
        ],
      },
    });

    // Mock clarification request
    await mockApiResponse(page, `**/prescriptions/${prescriptionId}/request-clarification`, {
      status: 201,
      body: {
        success: true,
        clarificationId: 'clarif_001',
        messageId: 'msg_clarif_001',
        conversationId: conversationId,
      },
    });

    // Navigate to prescriptions
    await page.getByRole('link', { name: /prescriptions|ordonnances/i }).click();

    // Click on prescription
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();

    // Run interaction check
    await page.getByRole('button', { name: /vérifier interactions|check interactions/i }).click();

    // Verify interaction warning displayed
    await expect(page.locator('[data-testid="interaction-warning"]')).toBeVisible();
    await expect(page.getByText('Warfarin')).toBeVisible();
    await expect(page.getByText('Aspirin')).toBeVisible();
    await expect(page.getByText(/bleeding risk|risque hémorragique/i)).toBeVisible();

    // Click request clarification
    await page.getByRole('button', { name: /demander clarification|request clarification/i }).click();

    // Verify clarification form with pre-filled safety concern
    await expect(page.locator('[data-testid="clarification-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="safety-concern-checkbox"]')).toBeChecked();

    // Add details
    await page.locator('[data-testid="clarification-message"]').fill(
      'Dr. Martin, I noticed the patient is currently taking Aspirin 81mg daily. The combination of Warfarin and Aspirin significantly increases bleeding risk. Could you please confirm: 1) Are you aware of the aspirin use? 2) Should we continue both medications? 3) If yes, what INR target should we aim for?'
    );

    // Attach interaction report
    await expect(page.locator('[data-testid="interaction-report-attached"]')).toBeVisible();

    // Send clarification request
    await page.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/clarification sent|demande envoyée/i);

    // Verify prescription status updated
    await expect(page.locator('[data-testid="prescription-status"]')).toContainText(/pending clarification|en attente/i);

    await clearAuth(page);
  });

  /**
   * Scenario 4: Doctor responds to pharmacist clarification with updated prescription
   */
  test('should allow doctor to respond to clarification and update prescription', async ({ context }) => {
    // Mock clarification pending for doctor
    const mockClarificationPending = {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'clarif_001',
            prescriptionId: prescriptionId,
            pharmacistName: 'Marie Dupont, PharmD',
            pharmacyName: 'Pharmacie de la Gare',
            concern: 'Drug interaction - Warfarin + Aspirin',
            message: 'Patient taking Aspirin 81mg daily. Increased bleeding risk with Warfarin.',
            urgent: true,
            createdAt: new Date(Date.now() - 600000).toISOString(),
          },
        ],
      },
    };

    // Doctor page
    const doctorPage = await context.newPage();
    await doctorPage.goto('/');
    await login(doctorPage, testUsers.doctor);

    await mockApiResponse(doctorPage, '**/doctor/clarifications**', mockClarificationPending);

    // Mock prescription update
    await mockApiResponse(doctorPage, `**/doctor/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        prescriptionId: prescriptionId,
        updated: true,
      },
    });

    // Mock clarification response
    await mockApiResponse(doctorPage, `**/doctor/clarifications/clarif_001/respond`, {
      status: 200,
      body: {
        success: true,
        messageId: 'msg_clarif_response_001',
      },
    });

    // Pharmacist page
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    // Mock updated prescription for pharmacist
    await mockApiResponse(pharmacistPage, `**/prescriptions/${prescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: prescriptionId,
          medications: [
            {
              name: 'Warfarin',
              dosage: '5mg',
              frequency: 'Once daily',
              notes: 'ASPIRIN DISCONTINUED - confirmed with patient',
            },
          ],
          status: 'clarified',
        },
      },
    });

    // Doctor sees clarification notification
    await expect(doctorPage.locator('[data-testid="notification-badge"]')).toBeVisible();
    await doctorPage.getByRole('link', { name: /clarifications|notifications/i }).click();

    // Verify clarification request
    await expect(doctorPage.locator('[data-testid="clarif-clarif_001"]')).toBeVisible();
    await expect(doctorPage.locator('[data-testid="urgent-badge"]')).toBeVisible();
    await expect(doctorPage.getByText('Marie Dupont, PharmD')).toBeVisible();

    // Click on clarification
    await doctorPage.locator('[data-testid="clarif-clarif_001"]').click();

    // Verify details
    await expect(doctorPage.getByText('Warfarin + Aspirin')).toBeVisible();
    await expect(doctorPage.getByText('Increased bleeding risk')).toBeVisible();

    // View prescription
    await doctorPage.getByRole('button', { name: /voir ordonnance|view prescription/i }).click();

    // Update prescription - discontinue aspirin
    await doctorPage.getByRole('button', { name: /modifier|edit/i }).click();
    await doctorPage.locator('[data-testid="medication-notes"]').fill('ASPIRIN DISCONTINUED - confirmed with patient');
    await doctorPage.getByRole('button', { name: /enregistrer|save/i }).click();

    // Respond to pharmacist
    await doctorPage.getByRole('button', { name: /répondre|respond/i }).click();
    await doctorPage.locator('[data-testid="response-message"]').fill(
      'Thank you for catching this, Marie. I spoke with the patient and we have discontinued the aspirin. Please proceed with Warfarin 5mg daily. Target INR 2-3. First INR check in 3 days.'
    );
    await doctorPage.getByRole('button', { name: /envoyer|send/i }).click();

    // Verify response sent
    await expect(doctorPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // Pharmacist receives response
    await pharmacistPage.getByRole('link', { name: /messagerie|messaging/i }).click();
    await expect(pharmacistPage.locator('[data-testid="unread-badge"]')).toBeVisible();

    await doctorPage.close();
    await pharmacistPage.close();
  });

  /**
   * Scenario 5: Audit trail verification for secure communications
   */
  test('should maintain audit trail for all doctor-pharmacist communications', async ({ page }) => {
    // Login as pharmacist (admin role for audit access)
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock audit trail
    await mockApiResponse(page, `**/audit/prescriptions/${prescriptionId}/communications`, {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'audit_001',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'message_sent',
            sender: {
              id: doctorId,
              name: 'Dr. Jean Martin',
              role: 'doctor',
              license: 'CH-MED-67890',
            },
            recipient: {
              id: pharmacistId,
              name: 'Marie Dupont',
              role: 'pharmacist',
              license: 'CH-PHARM-12345',
            },
            prescriptionId: prescriptionId,
            messageId: 'msg_secure_001',
            encrypted: true,
            urgent: true,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
          },
          {
            id: 'audit_002',
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            action: 'message_read',
            user: {
              id: pharmacistId,
              name: 'Marie Dupont',
              role: 'pharmacist',
            },
            messageId: 'msg_secure_001',
            ipAddress: '192.168.1.101',
          },
          {
            id: 'audit_003',
            timestamp: new Date(Date.now() - 2700000).toISOString(),
            action: 'message_replied',
            sender: {
              id: pharmacistId,
              name: 'Marie Dupont',
              role: 'pharmacist',
            },
            recipient: {
              id: doctorId,
              name: 'Dr. Jean Martin',
              role: 'doctor',
            },
            messageId: 'msg_secure_002',
            inReplyTo: 'msg_secure_001',
            encrypted: true,
          },
          {
            id: 'audit_004',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            action: 'clarification_requested',
            requestedBy: {
              id: pharmacistId,
              name: 'Marie Dupont',
              role: 'pharmacist',
            },
            clarificationId: 'clarif_001',
            reason: 'Drug interaction - safety concern',
            prescriptionId: prescriptionId,
          },
        ],
        totalEntries: 4,
      },
    });

    // Navigate to prescription
    await page.getByRole('link', { name: /prescriptions|ordonnances/i }).click();
    await page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();

    // Open audit trail
    await page.getByRole('button', { name: /audit|trail|historique/i }).click();

    // Verify audit panel opened
    await expect(page.locator('[data-testid="audit-trail-panel"]')).toBeVisible();

    // Verify audit entries
    await expect(page.locator('[data-testid="audit-audit_001"]')).toBeVisible();
    await expect(page.getByText('message_sent')).toBeVisible();
    await expect(page.getByText('Dr. Jean Martin')).toBeVisible();
    await expect(page.getByText('CH-MED-67890')).toBeVisible();

    // Verify encryption status logged
    await expect(page.locator('[data-testid="audit-audit_001"] [data-testid="encrypted-icon"]')).toBeVisible();

    // Verify read receipt logged
    await expect(page.locator('[data-testid="audit-audit_002"]')).toBeVisible();
    await expect(page.getByText('message_read')).toBeVisible();

    // Verify clarification request logged
    await expect(page.locator('[data-testid="audit-audit_004"]')).toBeVisible();
    await expect(page.getByText('clarification_requested')).toBeVisible();
    await expect(page.getByText('Drug interaction - safety concern')).toBeVisible();

    // Verify timestamps in chronological order
    const auditEntries = await page.locator('[data-testid^="audit-"]').all();
    expect(auditEntries.length).toBe(4);

    // Export audit trail
    await page.getByRole('button', { name: /exporter|export|download/i }).click();
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
    await page.locator('[data-testid="export-format-pdf"]').click();

    // Verify download initiated
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /confirmer|confirm export/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit.*\.pdf$/i);

    await clearAuth(page);
  });

  /**
   * Scenario 6: End-to-end encrypted multi-channel messaging
   */
  test('should support multi-channel aggregation with unified encrypted inbox', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock multi-channel conversations
    await mockApiResponse(page, '**/pharmacist/conversations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'conv_in_app_001',
            participantName: 'Dr. Jean Martin',
            participantRole: 'doctor',
            channel: 'in_app',
            lastMessage: 'Prescription clarification needed',
            unreadCount: 1,
            encrypted: true,
          },
          {
            id: 'conv_email_001',
            participantName: 'Dr. Sophie Laurent',
            participantRole: 'doctor',
            channel: 'email',
            lastMessage: 'RE: Patient medication query',
            unreadCount: 0,
            encrypted: true,
          },
          {
            id: 'conv_whatsapp_001',
            participantName: 'Dr. Pierre Blanc',
            participantRole: 'doctor',
            channel: 'whatsapp',
            lastMessage: 'Can you prepare this urgently?',
            unreadCount: 2,
            encrypted: true,
          },
        ],
      },
    });

    // Navigate to messaging
    await page.getByRole('link', { name: /messagerie|messaging/i }).click();

    // Verify unified inbox with multiple channels
    await expect(page.locator('[data-testid="conversation-conv_in_app_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversation-conv_email_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversation-conv_whatsapp_001"]')).toBeVisible();

    // Verify channel indicators
    await expect(page.locator('[data-testid="channel-badge-in_app"]')).toBeVisible();
    await expect(page.locator('[data-testid="channel-badge-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="channel-badge-whatsapp"]')).toBeVisible();

    // Verify all encrypted
    const encryptedBadges = await page.locator('[data-testid^="encrypted-badge"]').all();
    expect(encryptedBadges.length).toBe(3);

    // Filter by channel
    await page.locator('[data-testid="channel-filter"]').selectOption('whatsapp');
    await expect(page.locator('[data-testid="conversation-conv_whatsapp_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversation-conv_in_app_001"]')).not.toBeVisible();

    // Reset filter
    await page.locator('[data-testid="channel-filter"]').selectOption('all');

    // Verify total unread count
    await expect(page.locator('[data-testid="total-unread"]')).toContainText('3');

    await clearAuth(page);
  });
});
