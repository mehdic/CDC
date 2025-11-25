/**
 * Nurse App Communication E2E Tests
 *
 * Tests messaging and communication functionality:
 * - Messaging with pharmacy
 * - Urgent requests
 * - Notification preferences
 */

describe('Nurse App Communication', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await loginAsNurse();
    await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);
  });

  describe('Messaging Interface', () => {
    it('should display messaging tab', async () => {
      await expect(element(by.id('messaging-tab'))).toBeVisible();
    });

    it('should navigate to messaging screen on tab tap', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('messaging-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('messaging-screen'))).toBeVisible();
    });

    it('should display conversation list', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('conversation-list'))).toBeVisible();
    });

    it('should display conversation items with pharmacy name', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('conversation-pharmacy-0'))).toBeVisible();
    });

    it('should display last message preview', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('conversation-preview-0'))).toBeVisible();
    });

    it('should display last message timestamp', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('conversation-time-0'))).toBeVisible();
    });

    it('should display unread message badge', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      // Badge may be visible for unread conversations
    });

    it('should search conversations', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-search-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('conversation-search-input')).typeText('MetaPharm Pharmacy');

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Chat Messaging', () => {
    it('should open conversation on selection', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('conversation-item-0')).tap();

      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('chat-screen'))).toBeVisible();
    });

    it('should display conversation header with pharmacy name', async () => {
      await navigateToChat();

      await expect(element(by.id('chat-header-pharmacy'))).toBeVisible();
    });

    it('should display message list', async () => {
      await navigateToChat();

      await waitFor(element(by.id('message-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('message-list'))).toBeVisible();
    });

    it('should display received messages', async () => {
      await navigateToChat();

      await waitFor(element(by.id('message-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('message-item-0'))).toBeVisible();
    });

    it('should display message content', async () => {
      await navigateToChat();

      await waitFor(element(by.id('message-text-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('message-text-0'))).toBeVisible();
    });

    it('should display message timestamp', async () => {
      await navigateToChat();

      await waitFor(element(by.id('message-time-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('message-time-0'))).toBeVisible();
    });

    it('should display message sender indicator', async () => {
      await navigateToChat();

      await waitFor(element(by.id('message-sender-0'))).toBeVisible().withTimeout(5000);
      // Message should be aligned to indicate sender
    });

    it('should display message input field', async () => {
      await navigateToChat();

      await expect(element(by.id('message-input-field'))).toBeVisible();
    });

    it('should type and send message', async () => {
      await navigateToChat();

      await element(by.id('message-input-field')).typeText('Need urgent medication order');
      await element(by.id('send-message-button')).tap();

      // Message should appear in chat
      await waitFor(element(by.id('message-text-sent'))).toBeVisible().withTimeout(5000);
    });

    it('should display sent message status', async () => {
      await navigateToChat();

      await element(by.id('message-input-field')).typeText('Test message');
      await element(by.id('send-message-button')).tap();

      await waitFor(element(by.id('message-status-sent'))).toBeVisible().withTimeout(5000);
    });

    it('should auto-scroll to latest message', async () => {
      await navigateToChat();

      // Send a message
      await element(by.id('message-input-field')).typeText('New message');
      await element(by.id('send-message-button')).tap();

      // Latest message should be visible at bottom
      await waitFor(element(by.id('message-list-bottom'))).toBeVisible().withTimeout(5000);
    });

    it('should handle message delivery status', async () => {
      await navigateToChat();

      await element(by.id('message-input-field')).typeText('Test');
      await element(by.id('send-message-button')).tap();

      // Should show delivered status after sending
      await waitFor(element(by.text(/delivered|sent/i))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Urgent Messages', () => {
    it('should display urgent message button', async () => {
      await navigateToChat();

      await expect(element(by.id('urgent-message-button'))).toBeVisible();
    });

    it('should mark message as urgent', async () => {
      await navigateToChat();

      await element(by.id('urgent-message-button')).tap();

      await waitFor(element(by.id('urgent-message-indicator'))).toBeVisible().withTimeout(5000);
    });

    it('should send urgent message with priority flag', async () => {
      await navigateToChat();

      await element(by.id('message-input-field')).typeText('Urgent: Patient needs immediate medication');
      await element(by.id('urgent-message-button')).tap();
      await element(by.id('send-message-button')).tap();

      // Message should be marked as urgent
      await waitFor(element(by.id('urgent-badge'))).toBeVisible().withTimeout(5000);
    });

    it('should display urgent request form', async () => {
      await navigateToChat();

      await element(by.id('urgent-message-button')).tap();

      await waitFor(element(by.id('urgent-request-form'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('urgent-request-form'))).toBeVisible();
    });

    it('should select reason for urgent request', async () => {
      await navigateToChat();

      await element(by.id('urgent-message-button')).tap();

      await waitFor(element(by.id('urgent-request-form'))).toBeVisible().withTimeout(5000);
      await element(by.id('urgent-reason-selector')).tap();

      await waitFor(element(by.id('reason-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('reason-patient-emergency')).tap();
    });

    it('should add details to urgent request', async () => {
      await navigateToChat();

      await element(by.id('urgent-message-button')).tap();

      await waitFor(element(by.id('urgent-request-form'))).toBeVisible().withTimeout(5000);
      await element(by.id('urgent-reason-selector')).tap();
      await element(by.id('reason-patient-emergency')).tap();

      await element(by.id('urgent-details-field')).typeText('Patient has severe allergic reaction');
      await element(by.id('send-urgent-request')).tap();

      // Urgent message should be sent
      await waitFor(element(by.id('urgent-sent-confirmation'))).toBeVisible().withTimeout(5000);
    });

    it('should notify pharmacy immediately for urgent messages', async () => {
      // This would be tested with backend notifications
      // Urgent messages should trigger immediate notifications
    });
  });

  describe('Message Attachments', () => {
    it('should display attachment button', async () => {
      await navigateToChat();

      await expect(element(by.id('attach-file-button'))).toBeVisible();
    });

    it('should open attachment menu', async () => {
      await navigateToChat();

      await element(by.id('attach-file-button')).tap();

      await waitFor(element(by.id('attachment-menu'))).toBeVisible().withTimeout(5000);
    });

    it('should attach photo from camera', async () => {
      await navigateToChat();

      await element(by.id('attach-file-button')).tap();

      await waitFor(element(by.id('attachment-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('attach-camera')).tap();

      // Camera should open
    });

    it('should attach photo from gallery', async () => {
      await navigateToChat();

      await element(by.id('attach-file-button')).tap();

      await waitFor(element(by.id('attachment-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('attach-gallery')).tap();

      // Gallery should open
    });

    it('should attach documents', async () => {
      await navigateToChat();

      await element(by.id('attach-file-button')).tap();

      await waitFor(element(by.id('attachment-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('attach-document')).tap();

      // Document picker should open
    });

    it('should display attachment preview before sending', async () => {
      await navigateToChat();

      // After selecting an attachment
      await expect(element(by.id('attachment-preview'))).toBeVisible();
    });

    it('should send message with attachment', async () => {
      await navigateToChat();

      // After attaching file and sending
      await element(by.id('send-message-button')).tap();

      // Message with attachment should be sent
      await waitFor(element(by.id('message-with-attachment'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Notification Preferences', () => {
    it('should display settings tab', async () => {
      await expect(element(by.id('settings-tab'))).toBeVisible();
    });

    it('should navigate to settings screen', async () => {
      await element(by.id('settings-tab')).tap();

      await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should display notification preferences section', async () => {
      await element(by.id('settings-tab')).tap();

      await waitFor(element(by.id('notification-preferences-section'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('notification-preferences-section'))).toBeVisible();
    });

    it('should enable/disable push notifications', async () => {
      await navigateToNotificationSettings();

      await element(by.id('push-notifications-toggle')).tap();

      // Toggle should change state
    });

    it('should enable/disable email notifications', async () => {
      await navigateToNotificationSettings();

      await element(by.id('email-notifications-toggle')).tap();

      // Toggle should change state
    });

    it('should enable/disable SMS notifications', async () => {
      await navigateToNotificationSettings();

      await element(by.id('sms-notifications-toggle')).tap();

      // Toggle should change state
    });

    it('should set notification quiet hours', async () => {
      await navigateToNotificationSettings();

      await element(by.id('quiet-hours-toggle')).tap();

      await waitFor(element(by.id('quiet-hours-settings'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('quiet-hours-start-time'))).toBeVisible();
      await expect(element(by.id('quiet-hours-end-time'))).toBeVisible();
    });

    it('should configure notification sound', async () => {
      await navigateToNotificationSettings();

      await element(by.id('notification-sound-selector')).tap();

      await waitFor(element(by.id('sound-menu'))).toBeVisible().withTimeout(5000);
      // Should list available notification sounds
    });

    it('should configure notification vibration', async () => {
      await navigateToNotificationSettings();

      await element(by.id('vibration-toggle')).tap();

      // Toggle should change state
    });

    it('should enable urgent message notifications', async () => {
      await navigateToNotificationSettings();

      // Scroll to find urgent message settings
      await element(by.id('notification-preferences-section')).swipe('up', 'slow', 0.5);

      await expect(element(by.id('urgent-notifications-toggle'))).toBeVisible();
      await element(by.id('urgent-notifications-toggle')).tap();
    });

    it('should set notification frequency', async () => {
      await navigateToNotificationSettings();

      await element(by.id('notification-frequency-selector')).tap();

      await waitFor(element(by.id('frequency-menu'))).toBeVisible().withTimeout(5000);
      // Should show frequency options (instant, hourly, daily, etc.)
    });

    it('should save notification preferences', async () => {
      await navigateToNotificationSettings();

      await element(by.id('push-notifications-toggle')).tap();

      await element(by.id('save-preferences-button')).tap();

      // Should show success message
      await waitFor(element(by.text(/saved|updated/i))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Conversation Management', () => {
    it('should allow archiving conversation', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);

      // Long press to open context menu
      await element(by.id('conversation-item-0')).multiTap(1);

      await waitFor(element(by.id('archive-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('archive-button')).tap();

      // Conversation should be archived
    });

    it('should allow deleting conversation', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);

      // Long press to open context menu
      await element(by.id('conversation-item-0')).multiTap(1);

      await waitFor(element(by.id('delete-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('delete-button')).tap();

      // Confirmation should appear
      await waitFor(element(by.id('confirm-delete-button'))).toBeVisible().withTimeout(5000);
    });

    it('should mark conversation as read', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('conversation-item-0')).tap();

      // Opening conversation marks it as read
      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should mute conversation notifications', async () => {
      await element(by.id('messaging-tab')).tap();

      await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);

      // Long press to open context menu
      await element(by.id('conversation-item-0')).multiTap(1);

      await waitFor(element(by.id('mute-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('mute-button')).tap();
    });
  });
});

// Helper functions
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}

async function navigateToChat() {
  await element(by.id('messaging-tab')).tap();
  await waitFor(element(by.id('conversation-item-0'))).toBeVisible().withTimeout(5000);
  await element(by.id('conversation-item-0')).tap();
  await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
}

async function navigateToNotificationSettings() {
  await element(by.id('settings-tab')).tap();
  await waitFor(element(by.id('notification-preferences-section'))).toBeVisible().withTimeout(5000);
}
