import { test, expect } from '../fixtures/auth.fixture';
import { MessagingPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Secure Messaging', () => {
  test.beforeEach(async ({ page }) => {
    // Mock conversations list
    await mockApiResponse(page, '**/messages/conversations', {
      status: 200,
      body: {
        success: true,
        conversations: [
          {
            id: 'conv_001',
            participantName: 'Dr. Jean Martin',
            participantRole: 'doctor',
            lastMessage: 'Patient Sophie needs prescription renewal',
            unreadCount: 2,
            encrypted: true,
          },
          {
            id: 'conv_002',
            participantName: 'Sophie Bernard',
            participantRole: 'patient',
            lastMessage: 'Thank you for your help',
            unreadCount: 0,
            encrypted: true,
          },
        ],
      },
    });
  });

  test('should display conversation list', async ({ pharmacistPage }) => {
    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.expectPageLoaded();
    await expect(messagingPage.conversationList).toBeVisible();
  });

  test('should send message to doctor', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/send', {
      status: 200,
      body: { success: true, messageId: 'msg_001' },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.sendMessageToDoctor(
      'doctor@test.metapharm.ch',
      'Regarding patient Sophie Bernard - prescription clarification needed'
    );
  });

  test('should send message to patient', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/send', {
      status: 200,
      body: { success: true, messageId: 'msg_002' },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.sendMessageToPatient(
      'patient@test.metapharm.ch',
      'Your prescription is ready for pickup'
    );
  });

  test('should read and respond to messages', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/conv_001', {
      status: 200,
      body: {
        success: true,
        messages: [
          {
            id: 'msg_001',
            sender: 'Dr. Jean Martin',
            content: 'Patient Sophie needs prescription renewal',
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
      },
    });

    await mockApiResponse(pharmacistPage, '**/messages/send', {
      status: 200,
      body: { success: true, messageId: 'msg_response' },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.selectConversation('conv_001');
    await messagingPage.sendMessage('conv_001', 'I will process the renewal today');
  });

  test('should attach prescription to message', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/conv_001', {
      status: 200,
      body: { success: true, messages: [] },
    });

    await mockApiResponse(pharmacistPage, '**/messages/attach', {
      status: 200,
      body: { success: true },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.selectConversation('conv_001');
    await messagingPage.attachPrescription('rx_001');
  });

  test('should search conversations', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/search**', {
      status: 200,
      body: {
        success: true,
        conversations: [
          {
            id: 'conv_001',
            participantName: 'Dr. Jean Martin',
            participantRole: 'doctor',
          },
        ],
      },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.searchConversations('Jean Martin');
  });

  test('should verify end-to-end encryption', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/conv_001', {
      status: 200,
      body: { success: true, messages: [], encrypted: true },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.selectConversation('conv_001');
    await messagingPage.verifyEncryption();
  });

  test('should handle WhatsApp-style interface interactions', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/conv_002', {
      status: 200,
      body: {
        success: true,
        messages: [
          {
            id: 'msg_003',
            sender: 'Pharmacist',
            content: 'Your prescription is ready',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ],
      },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.selectConversation('conv_002');
    await messagingPage.expectMessageInThread('Your prescription is ready');
  });

  test('should display unread message count', async ({ pharmacistPage }) => {
    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.expectConversationInList('conv_001');
    const unreadBadge = pharmacistPage.locator('[data-testid="conversation-conv_001"]').locator('[data-testid="unread-badge"]');
    await expect(unreadBadge).toContainText('2');
  });

  test('should create new message thread', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/send', {
      status: 200,
      body: { success: true, conversationId: 'conv_new_001' },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.sendNewMessage(
      'newpatient@test.metapharm.ch',
      'Welcome to MetaPharm Connect!'
    );
  });

  test('should mark messages as read', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/messages/msg_001/read', {
      status: 200,
      body: { success: true },
    });

    await mockApiResponse(pharmacistPage, '**/messages/conv_001', {
      status: 200,
      body: {
        success: true,
        messages: [
          {
            id: 'msg_001',
            sender: 'Dr. Jean Martin',
            content: 'Test message',
            read: false,
          },
        ],
      },
    });

    const messagingPage = new MessagingPage(pharmacistPage);
    await messagingPage.goto();

    await messagingPage.selectConversation('conv_001');
    await messagingPage.readMessage('msg_001');
  });
});
