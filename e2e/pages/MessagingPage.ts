import { Page, Locator } from '@playwright/test';

/**
 * Messaging Page Object
 * Handles secure messaging between healthcare professionals and patients
 */

export class MessagingPage {
  readonly page: Page;
  readonly newMessageButton: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;
  readonly messageItem: Locator;
  readonly searchBox: Locator;
  readonly conversationList: Locator;
  readonly conversationItem: Locator;
  readonly recipientInput: Locator;
  readonly subjectInput: Locator;
  readonly attachButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newMessageButton = page.locator('button:has-text("New Message"), button:has-text("Send Message")');
    this.messageInput = page.locator('textarea[placeholder*="message"], textarea[name*="content"]');
    this.sendButton = page.locator('button:has-text("Send")');
    this.messageList = page.locator('[data-testid="messages-list"], .messages-container');
    this.messageItem = page.locator('[data-testid="message-item"], .message');
    this.searchBox = page.locator('input[placeholder*="Search"], [data-testid="search-messages"]');
    this.conversationList = page.locator('[data-testid="conversations-list"], .conversations');
    this.conversationItem = page.locator('[data-testid="conversation-item"], .conversation');
    this.recipientInput = page.locator('input[placeholder*="recipient"], select[name*="recipient"]');
    this.subjectInput = page.locator('input[placeholder*="subject"], input[name*="subject"]');
    this.attachButton = page.locator('button[aria-label*="attach"], [data-testid="attach-file"]');
    this.successMessage = page.locator('[data-testid="success-message"], .alert-success');
    this.errorMessage = page.locator('[data-testid="error-message"], .alert-danger');
  }

  /**
   * Navigate to messaging page
   */
  async goto() {
    await this.page.goto('/messages');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click new message button
   */
  async clickNewMessage() {
    await this.newMessageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill message form
   */
  async fillMessageForm(data: {
    recipient?: string;
    subject?: string;
    content: string;
  }) {
    if (data.recipient && (await this.recipientInput.isVisible())) {
      await this.recipientInput.fill(data.recipient);
    }

    if (data.subject && (await this.subjectInput.isVisible())) {
      await this.subjectInput.fill(data.subject);
    }

    await this.messageInput.fill(data.content);
  }

  /**
   * Send message
   */
  async sendMessage(data: {
    recipient?: string;
    subject?: string;
    content: string;
  }) {
    await this.clickNewMessage();
    await this.fillMessageForm(data);
    await this.sendButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if message sent successfully
   */
  async isMessageSentSuccessfully(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if messages exist
   */
  async hasMessages(): Promise<boolean> {
    const count = await this.messageItem.count();
    return count > 0;
  }

  /**
   * Get message count
   */
  async getMessageCount(): Promise<number> {
    return await this.messageItem.count();
  }

  /**
   * Search messages
   */
  async searchMessages(query: string) {
    await this.searchBox.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open conversation by index
   */
  async openConversationByIndex(index: number) {
    await this.conversationItem.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get conversation count
   */
  async getConversationCount(): Promise<number> {
    return await this.conversationItem.count();
  }

  /**
   * Reply to message
   */
  async replyToMessage(content: string) {
    await this.messageInput.fill(content);
    await this.sendButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
