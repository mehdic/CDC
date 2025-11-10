/**
 * Doctor Messaging E2E Tests
 *
 * Tests secure messaging functionality for doctors:
 * - Send secure message to pharmacist
 * - Receive messages
 * - Attach prescription to message
 * - Message encryption verification
 * - Message history
 */

describe('Doctor Secure Messaging', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await completeLogin();
  });

  beforeEach(async () => {
    // Navigate to messaging tab
    await element(by.id('messaging-tab')).tap();
    await expect(element(by.id('messaging-screen'))).toBeVisible();
  });

  describe('Send Secure Message to Pharmacist', () => {
    it('should display messaging interface', async () => {
      await expect(element(by.id('conversations-list'))).toBeVisible();
      await expect(element(by.id('new-message-button'))).toBeVisible();
    });

    it('should create new conversation with pharmacist', async () => {
      await element(by.id('new-message-button')).tap();
      await expect(element(by.id('new-conversation-screen'))).toBeVisible();

      // Search for pharmacist
      await element(by.id('recipient-search-input')).typeText('Central Pharmacy');
      await element(by.id('recipient-search-button')).tap();

      await waitFor(element(by.id('recipient-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('recipient-result-0')).tap();

      await expect(element(by.id('conversation-screen'))).toBeVisible();
      await expect(element(by.id('conversation-header-name'))).toHaveText('Central Pharmacy');
    });

    it('should send text message to pharmacist', async () => {
      await startConversation('Central Pharmacy');

      const messageText = 'Please confirm patient John Smith prescription availability';
      await element(by.id('message-input')).typeText(messageText);
      await element(by.id('send-message-button')).tap();

      // Message should appear in conversation
      await expect(element(by.id('message-0'))).toBeVisible();
      await expect(element(by.id('message-0-text'))).toHaveText(messageText);
      await expect(element(by.id('message-0-status'))).toHaveText('Sent');
    });

    it('should show message encryption indicator', async () => {
      await startConversation('Central Pharmacy');

      await element(by.id('message-input')).typeText('Test encrypted message');
      await element(by.id('send-message-button')).tap();

      // Check encryption badge
      await expect(element(by.id('encryption-indicator'))).toBeVisible();
      await element(by.id('encryption-indicator')).tap();

      await expect(element(by.id('encryption-info-modal'))).toBeVisible();
      await expect(element(by.id('encryption-status'))).toHaveText('End-to-end encrypted');
    });

    it('should send message with high priority flag', async () => {
      await startConversation('Central Pharmacy');

      await element(by.id('message-options-button')).tap();
      await element(by.id('priority-high-option')).tap();

      await element(by.id('message-input')).typeText('Urgent: Patient needs immediate medication');
      await element(by.id('send-message-button')).tap();

      await expect(element(by.id('message-0-priority-badge'))).toBeVisible();
      await expect(element(by.id('message-0-priority-badge'))).toHaveText('High Priority');
    });
  });

  describe('Attach Prescription to Message', () => {
    it('should open prescription attachment picker', async () => {
      await startConversation('Central Pharmacy');

      await element(by.id('attachment-button')).tap();
      await expect(element(by.id('attachment-menu'))).toBeVisible();
      await expect(element(by.id('attach-prescription-option'))).toBeVisible();
    });

    it('should attach existing prescription to message', async () => {
      await startConversation('Central Pharmacy');

      await element(by.id('attachment-button')).tap();
      await element(by.id('attach-prescription-option')).tap();

      // Show prescription picker
      await expect(element(by.id('prescription-picker-modal'))).toBeVisible();
      await element(by.id('prescription-picker-search')).typeText('John Smith');
      await element(by.id('prescription-picker-search-button')).tap();

      await waitFor(element(by.id('prescription-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('prescription-item-0')).tap();
      await element(by.id('prescription-picker-confirm')).tap();

      // Prescription should be attached
      await expect(element(by.id('message-attachment-preview'))).toBeVisible();
      await expect(element(by.id('attachment-type'))).toHaveText('Prescription');

      // Send message with attachment
      await element(by.id('message-input')).typeText('Please process this prescription');
      await element(by.id('send-message-button')).tap();

      await expect(element(by.id('message-0-attachment'))).toBeVisible();
    });

    it('should attach newly created prescription', async () => {
      await startConversation('Central Pharmacy');

      await element(by.id('attachment-button')).tap();
      await element(by.id('attach-prescription-option')).tap();
      await element(by.id('create-new-prescription-button')).tap();

      // Create prescription flow
      await expect(element(by.id('prescription-form-screen'))).toBeVisible();
      // Complete prescription creation...
      await createSimplePrescription('Jane Doe', 'Ibuprofen');

      // Should return to conversation with prescription attached
      await expect(element(by.id('conversation-screen'))).toBeVisible();
      await expect(element(by.id('message-attachment-preview'))).toBeVisible();
    });
  });

  describe('Receive Messages', () => {
    it('should display incoming messages in conversation', async () => {
      await openConversation('Central Pharmacy');

      // Simulate incoming message (in real test, would be from backend)
      await simulateIncomingMessage('Central Pharmacy', 'Prescription is ready for pickup');

      await waitFor(element(by.id('message-new-0'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('message-new-0-text'))).toHaveText('Prescription is ready for pickup');
      await expect(element(by.id('message-new-0-sender'))).toHaveText('Central Pharmacy');
    });

    it('should show unread message badge', async () => {
      await element(by.id('back-button')).tap(); // Return to conversations list

      // Simulate new message
      await simulateIncomingMessage('City Pharmacy', 'Your patient inquiry response');

      await waitFor(element(by.id('conversation-city-pharmacy-badge'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('conversation-city-pharmacy-badge'))).toHaveText('1');
    });

    it('should mark messages as read when opening conversation', async () => {
      // Ensure there's an unread message
      await simulateIncomingMessage('Central Pharmacy', 'Test unread message');
      await waitFor(element(by.id('conversation-central-pharmacy-badge'))).toBeVisible().withTimeout(10000);

      // Open conversation
      await element(by.id('conversation-central-pharmacy')).tap();
      await expect(element(by.id('conversation-screen'))).toBeVisible();

      // Go back and check badge is gone
      await element(by.id('back-button')).tap();
      await expect(element(by.id('conversation-central-pharmacy-badge'))).not.toBeVisible();
    });

    it('should display message delivery status', async () => {
      await openConversation('Central Pharmacy');

      await element(by.id('message-input')).typeText('Status test message');
      await element(by.id('send-message-button')).tap();

      // Check status progression: Sending -> Sent -> Delivered -> Read
      await expect(element(by.id('message-0-status'))).toHaveText('Sent');

      // Wait for delivery confirmation
      await waitFor(element(by.id('message-0-status')))
        .toHaveText('Delivered')
        .withTimeout(10000);
    });
  });

  describe('Message History', () => {
    it('should load previous messages when scrolling up', async () => {
      await openConversation('Central Pharmacy');

      // Scroll to top to load older messages
      await element(by.id('conversation-messages-list')).scrollTo('top');

      await waitFor(element(by.id('loading-older-messages'))).toBeVisible().withTimeout(5000);
      await waitFor(element(by.id('loading-older-messages'))).not.toBeVisible().withTimeout(10000);

      // Older messages should be loaded
      await expect(element(by.id('message-old-5'))).toBeVisible();
    });

    it('should search message history', async () => {
      await openConversation('Central Pharmacy');

      await element(by.id('conversation-menu-button')).tap();
      await element(by.id('search-conversation-option')).tap();

      await expect(element(by.id('message-search-input'))).toBeVisible();
      await element(by.id('message-search-input')).typeText('prescription');
      await element(by.id('message-search-button')).tap();

      await expect(element(by.id('search-results-list'))).toBeVisible();
      await expect(element(by.id('search-result-0'))).toBeVisible();
    });

    it('should view conversation info and history', async () => {
      await openConversation('Central Pharmacy');

      await element(by.id('conversation-header')).tap();
      await expect(element(by.id('conversation-info-screen'))).toBeVisible();

      await expect(element(by.id('conversation-created-date'))).toBeVisible();
      await expect(element(by.id('conversation-message-count'))).toBeVisible();
      await expect(element(by.id('encryption-status'))).toHaveText('Encrypted');
    });
  });

  describe('Message Notifications', () => {
    it('should receive push notification for new message', async () => {
      await device.sendToHome();

      // Simulate incoming message while app is in background
      await simulateIncomingMessage('Central Pharmacy', 'Background message test');

      // Check notification appears (platform-specific)
      // On iOS: notification banner, on Android: status bar notification
      await new Promise(resolve => setTimeout(resolve, 2000));

      await device.launchApp({ newInstance: false });
      await element(by.id('messaging-tab')).tap();

      // Message should be visible
      await expect(element(by.id('conversation-central-pharmacy-badge'))).toBeVisible();
    });

    it('should mute conversation notifications', async () => {
      await openConversation('Central Pharmacy');

      await element(by.id('conversation-menu-button')).tap();
      await element(by.id('mute-conversation-option')).tap();

      await expect(element(by.id('mute-confirmation'))).toBeVisible();
      await element(by.id('mute-24h-option')).tap();

      await expect(element(by.id('conversation-muted-indicator'))).toBeVisible();
    });
  });

  describe('Multi-Channel Integration', () => {
    it('should show WhatsApp integration option', async () => {
      await openConversation('Central Pharmacy');

      await element(by.id('conversation-menu-button')).tap();
      await expect(element(by.id('whatsapp-sync-option'))).toBeVisible();
    });

    it('should display email thread integration', async () => {
      await openConversation('Central Pharmacy');

      // If pharmacy has email conversations, show integration
      await element(by.id('conversation-menu-button')).tap();
      await element(by.id('view-email-thread-option')).tap();

      await expect(element(by.id('email-thread-modal'))).toBeVisible();
      await expect(element(by.id('email-message-0'))).toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function completeLogin() {
  await element(by.id('eid-login-button')).tap();
  await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);
  await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
  await element(by.id('eid-password-input')).typeText('ValidPassword123!');
  await element(by.id('eid-submit-button')).tap();
  await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
  await element(by.id('mfa-code-input')).typeText('123456');
  await element(by.id('mfa-submit-button')).tap();
  await waitFor(element(by.id('doctor-dashboard'))).toBeVisible().withTimeout(10000);
}

async function startConversation(recipientName: string) {
  await element(by.id('new-message-button')).tap();
  await element(by.id('recipient-search-input')).typeText(recipientName);
  await element(by.id('recipient-search-button')).tap();
  await waitFor(element(by.id('recipient-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('recipient-result-0')).tap();
}

async function openConversation(recipientName: string) {
  const conversationId = recipientName.toLowerCase().replace(/\s+/g, '-');
  await element(by.id(`conversation-${conversationId}`)).tap();
  await expect(element(by.id('conversation-screen'))).toBeVisible();
}

async function simulateIncomingMessage(senderName: string, messageText: string) {
  // In a real test, this would trigger a backend event or use a mock
  // For now, this is a placeholder for the test structure
  // Implementation would depend on the testing setup
}

async function createSimplePrescription(patientName: string, medicationName: string) {
  await element(by.id('patient-search-input')).typeText(patientName);
  await element(by.id('patient-search-button')).tap();
  await waitFor(element(by.id('patient-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('patient-result-0')).tap();

  await element(by.id('medication-search-button')).tap();
  await element(by.id('medication-search-input')).typeText(medicationName);
  await element(by.id('medication-search-submit')).tap();
  await waitFor(element(by.id('medication-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('medication-result-0')).tap();

  await element(by.id('prescription-submit-button')).tap();
  await element(by.id('use-preferred-pharmacy-button')).tap();
  await element(by.id('pharmacy-confirm-button')).tap();
}
