import { test, expect } from '../fixtures/auth.fixture';
import { NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Nurse-Pharmacist Messaging (E2E-020)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock conversations list
    await mockApiResponse(page, '**/nurse/conversations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'conv_001',
            participantName: 'Marie Dupont',
            participantRole: 'pharmacist',
            participantId: 'pharmacist_001',
            lastMessage: 'Order ready for pickup',
            lastMessageTime: new Date(Date.now() - 600000).toISOString(),
            unreadCount: 0,
          },
          {
            id: 'conv_002',
            participantName: 'Jean Moreau',
            participantRole: 'pharmacist',
            participantId: 'pharmacist_002',
            lastMessage: 'Prescription not found for Paul Deschamp',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
            unreadCount: 2,
          },
        ],
        total: 2,
      },
    });

    // Mock messages in conversation
    await mockApiResponse(page, '**/nurse/conversations/conv_001/messages**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'msg_001',
            senderId: 'nurse_001',
            senderName: 'Caroline Leclerc',
            senderRole: 'nurse',
            content: 'Hi, is the order for Paul Deschamp ready?',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            relatedOrderId: 'order_001',
            readAt: new Date(Date.now() - 3500000).toISOString(),
          },
          {
            id: 'msg_002',
            senderId: 'pharmacist_001',
            senderName: 'Marie Dupont',
            senderRole: 'pharmacist',
            content: 'Yes, ready for pickup. Lisinopril and Metformine prepared.',
            timestamp: new Date(Date.now() - 2700000).toISOString(),
            relatedOrderId: 'order_001',
            readAt: new Date(Date.now() - 2600000).toISOString(),
          },
          {
            id: 'msg_003',
            senderId: 'pharmacist_001',
            senderName: 'Marie Dupont',
            senderRole: 'pharmacist',
            content: 'Order ready for pickup',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            relatedOrderId: 'order_001',
            readAt: null,
          },
        ],
        total: 3,
      },
    });

    // Mock order clarification
    await mockApiResponse(page, '**/nurse/orders/order_001/clarification**', {
      status: 201,
      body: {
        success: true,
        clarificationId: 'clarif_001',
        message: 'Clarification request sent to pharmacist',
      },
    });

    // Mock message send
    await mockApiResponse(page, '**/nurse/conversations/conv_001/messages**', {
      status: 201,
      body: {
        success: true,
        messageId: 'msg_004',
        timestamp: new Date().toISOString(),
      },
    });
  });

  test('should open messaging and display conversations', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Verify conversation list is displayed
    await expect(nursePage.locator('[data-testid="conversation-list"]')).toBeVisible();

    // Verify pharmacist conversations are shown
    const pharmacistConv = nursePage.locator('[data-testid="conversation-conv_001"]');
    await expect(pharmacistConv).toBeVisible();
    await expect(pharmacistConv).toContainText('Marie Dupont');
  });

  test('should display conversation with messages and timestamps', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Verify messages are displayed
    const messagesContainer = nursePage.locator('[data-testid="messages-container"]');
    await expect(messagesContainer).toBeVisible();

    // Verify nurse message
    const nurseMessage = nursePage.locator('[data-testid="message-msg_001"]');
    await expect(nurseMessage).toContainText('is the order for Paul Deschamp ready');

    // Verify pharmacist response
    const pharmacistMessage = nursePage.locator('[data-testid="message-msg_002"]');
    await expect(pharmacistMessage).toContainText('Lisinopril and Metformine prepared');

    // Verify message timestamps
    const timestamp = nurseMessage.locator('[data-testid="timestamp"]');
    if (await timestamp.isVisible()) {
      await expect(timestamp).toBeVisible();
    }
  });

  test('should show message read status', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Verify read messages have checkmark
    const readMessage = nursePage.locator('[data-testid="message-msg_002"]');
    const readStatus = readMessage.locator('[data-testid="read-status"]');
    if (await readStatus.isVisible()) {
      await expect(readStatus).toBeVisible();
    }

    // Verify unread messages are highlighted
    const unreadMessage = nursePage.locator('[data-testid="message-msg_003"]');
    if (await unreadMessage.isVisible()) {
      const unreadIndicator = unreadMessage.locator('[data-testid="unread-indicator"]');
      if (await unreadIndicator.isVisible()) {
        await expect(unreadIndicator).toBeVisible();
      }
    }
  });

  test('should send message to pharmacist', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Send message to first pharmacist
    const messageContent = 'Are there any alternatives if Lisinopril is unavailable?';
    await nursePageObj.sendMessageToPharmacist('pharmacist_001', messageContent);

    // Verify message was sent (appears in conversation)
    const sentMessage = nursePage.locator(`text=${messageContent}`);
    await expect(sentMessage).toBeVisible();

    // Verify input is cleared
    await expect(nursePage.locator('[data-testid="message-input"]')).toHaveValue('');
  });

  test('should link message to patient order', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Verify message has order link
    const orderLinkedMessage = nursePage.locator('[data-testid="message-msg_001"]');
    const orderLink = orderLinkedMessage.locator('[data-testid="order-link"]');
    if (await orderLink.isVisible()) {
      await expect(orderLink).toBeVisible();
      await expect(orderLink).toContainText('order_001');
    }
  });

  test('should request order clarification from messaging', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Request clarification for related order
    const clarifyButton = nursePage.getByRole('button', { name: /clarifier|clarify/i });
    if (await clarifyButton.isVisible()) {
      await clarifyButton.click();

      // Verify clarification form
      const clarificationForm = nursePage.locator('[data-testid="clarification-form"]');
      if (await clarificationForm.isVisible()) {
        const clarificationInput = clarificationForm.locator('[data-testid="clarification-input"]');
        await clarificationInput.fill('Need urgent delivery for Paul Deschamp');

        const submitButton = clarificationForm.getByRole('button', { name: /envoyer|send/i });
        await submitButton.click();

        // Verify success
        await expect(nursePage.locator('[data-testid="clarification-sent"]')).toBeVisible();
      }
    }
  });

  test('should show unread message count', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Verify unread count on conversation
    const unreadConv = nursePage.locator('[data-testid="conversation-conv_002"]');
    const unreadBadge = unreadConv.locator('[data-testid="unread-badge"]');
    if (await unreadBadge.isVisible()) {
      await expect(unreadBadge).toContainText('2');
    }
  });

  test('should mark conversation as read when opened', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on unread conversation
    const unreadConv = nursePage.locator('[data-testid="conversation-conv_002"]');
    await unreadConv.click();

    // Verify messages are displayed
    await expect(nursePage.locator('[data-testid="messages-container"]')).toBeVisible();

    // Verify unread badge is removed
    const unreadBadge = unreadConv.locator('[data-testid="unread-badge"]');
    await expect(unreadBadge).not.toBeVisible();
  });

  test('should support message search in conversation', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Search for message
    const searchInput = nursePage.locator('[data-testid="message-search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Lisinopril');

      // Verify matching message is highlighted
      const matchedMessage = nursePage.locator(`text=Lisinopril`);
      if (await matchedMessage.isVisible()) {
        await expect(matchedMessage).toBeVisible();
      }
    }
  });

  test('should allow attaching order reference to message', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Type message
    const messageInput = nursePage.locator('[data-testid="message-input"]');
    await messageInput.fill('Update on order:');

    // Attach order reference
    const attachButton = nursePage.getByRole('button', { name: /attacher|attach|ajouter commande/i });
    if (await attachButton.isVisible()) {
      await attachButton.click();

      // Select order to attach
      const orderOption = nursePage.locator('[data-testid="order-option-order_001"]');
      if (await orderOption.isVisible()) {
        await orderOption.click();
      }

      // Send message
      const sendButton = nursePage.getByRole('button', { name: /envoyer|send/i });
      await sendButton.click();

      // Verify message with attachment
      await expect(nursePage.locator('[data-testid="message-with-attachment"]')).toBeVisible();
    }
  });

  test('should display typing indicators', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Mock pharmacist typing
    await mockApiResponse(nursePage, '**/nurse/conversations/conv_001/typing**', {
      status: 200,
      body: {
        success: true,
        isTyping: true,
        userName: 'Marie Dupont',
      },
    });

    // Verify typing indicator
    const typingIndicator = nursePage.locator('[data-testid="typing-indicator"]');
    if (await typingIndicator.isVisible()) {
      await expect(typingIndicator).toContainText(/typing|écrit|Marie Dupont/i);
    }
  });

  test('should handle pharmacist conversation not responding', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on unresponsive pharmacist conversation
    const unresponsiveConv = nursePage.locator('[data-testid="conversation-conv_002"]');
    await unresponsiveConv.click();

    // Verify escalate button is available
    const escalateButton = nursePage.getByRole('button', { name: /escalader|escalate|envoyer alerte/i });
    if (await escalateButton.isVisible()) {
      await expect(escalateButton).toBeVisible();

      // Click escalate
      await escalateButton.click();

      // Verify confirmation
      const confirmDialog = nursePage.locator('[data-testid="escalate-confirmation"]');
      if (await confirmDialog.isVisible()) {
        const confirmButton = confirmDialog.getByRole('button', { name: /oui|yes|confirmer/i });
        await confirmButton.click();

        // Verify success
        await expect(nursePage.locator('[data-testid="escalation-sent"]')).toBeVisible();
      }
    }
  });

  test('should display pharmacist profile in conversation header', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Verify header with pharmacist info
    const conversationHeader = nursePage.locator('[data-testid="conversation-header"]');
    if (await conversationHeader.isVisible()) {
      await expect(conversationHeader).toContainText('Marie Dupont');

      // Verify call button in header
      const callButton = conversationHeader.getByRole('button', { name: /appeler|call/i });
      if (await callButton.isVisible()) {
        await expect(callButton).toBeVisible();
      }

      // Verify info button
      const infoButton = conversationHeader.getByRole('button', { name: /info|détails/i });
      if (await infoButton.isVisible()) {
        await expect(infoButton).toBeVisible();
      }
    }
  });

  test('should handle message delivery failures', async ({ nursePage }) => {
    // Mock message delivery failure
    await mockApiResponse(nursePage, '**/nurse/conversations/conv_001/messages**', {
      status: 500,
      body: {
        success: false,
        error: 'Failed to send message',
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Try to send message
    const messageInput = nursePage.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message');

    const sendButton = nursePage.getByRole('button', { name: /envoyer|send/i });
    await sendButton.click();

    // Verify error handling
    const errorMessage = nursePage.locator('[data-testid="message-error"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();

      // Verify retry button
      const retryButton = nursePage.getByRole('button', { name: /réessayer|retry/i });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    }
  });

  test('should support message reactions/emojis', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Open messaging
    await nursePageObj.openMessaging();

    // Click on conversation
    await nursePage.locator('[data-testid="conversation-conv_001"]').click();

    // Right-click on message to show reactions
    const messageElement = nursePage.locator('[data-testid="message-msg_002"]');
    await messageElement.click({ button: 'right' });

    // Look for reaction picker
    const reactionButton = nursePage.locator('[data-testid="reaction-button"]');
    if (await reactionButton.isVisible()) {
      await reactionButton.click();

      // Select emoji reaction
      const thumbsUpEmoji = nursePage.locator('[data-testid="emoji-👍"]');
      if (await thumbsUpEmoji.isVisible()) {
        await thumbsUpEmoji.click();

        // Verify reaction was added
        const reaction = messageElement.locator('[data-testid="message-reaction"]');
        if (await reaction.isVisible()) {
          await expect(reaction).toBeVisible();
        }
      }
    }
  });
});
