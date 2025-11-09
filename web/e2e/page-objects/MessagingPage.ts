import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Messaging Page Object
 *
 * Encapsulates interactions with secure messaging features.
 */
export class MessagingPage extends BasePage {
  readonly pageTitle: Locator;
  readonly conversationList: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly attachButton: Locator;
  readonly searchInput: Locator;
  readonly newMessageButton: Locator;
  readonly messageThread: Locator;
  readonly encryptionIndicator: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /messages|messagerie/i });
    this.conversationList = page.locator('[data-testid="conversation-list"]');
    this.messageInput = page.locator('[data-testid="message-input"]');
    this.sendButton = page.getByRole('button', { name: /envoyer|send/i });
    this.attachButton = page.getByRole('button', { name: /joindre|attach/i });
    this.searchInput = page.getByPlaceholder(/rechercher|search/i);
    this.newMessageButton = page.getByRole('button', { name: /nouveau message|new message/i });
    this.messageThread = page.locator('[data-testid="message-thread"]');
    this.encryptionIndicator = page.locator('[data-testid="encryption-indicator"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/messages');
    await this.expectPageLoaded();
  }

  async sendMessage(recipientId: string, message: string): Promise<void> {
    await this.selectConversation(recipientId);
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await expect(this.page.locator(`[data-testid="message-sent"]`).last()).toBeVisible();
  }

  async sendNewMessage(recipientEmail: string, message: string): Promise<void> {
    await this.newMessageButton.click();
    await this.page.getByLabel(/destinataire|recipient/i).fill(recipientEmail);
    await this.page.getByLabel(/message/i).fill(message);
    await this.page.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async sendMessageToDoctor(doctorEmail: string, message: string): Promise<void> {
    await this.sendNewMessage(doctorEmail, message);
  }

  async sendMessageToPatient(patientEmail: string, message: string): Promise<void> {
    await this.sendNewMessage(patientEmail, message);
  }

  async attachPrescription(prescriptionId: string): Promise<void> {
    await this.attachButton.click();
    await this.page.getByRole('option', { name: /ordonnance|prescription/i }).click();
    await this.page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
    await this.page.getByRole('button', { name: /joindre|attach/i }).click();
    await expect(this.page.locator('[data-testid="attachment-added"]')).toBeVisible();
  }

  async selectConversation(conversationId: string): Promise<void> {
    await this.page.locator(`[data-testid="conversation-${conversationId}"]`).click();
    await expect(this.messageThread).toBeVisible();
  }

  async searchConversations(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForResponse(/messages/);
  }

  async readMessage(messageId: string): Promise<void> {
    await this.page.locator(`[data-testid="message-${messageId}"]`).click();
    await expect(this.page.locator(`[data-testid="message-${messageId}"]`).locator('[data-testid="read-indicator"]')).toBeVisible();
  }

  async verifyEncryption(): Promise<void> {
    await expect(this.encryptionIndicator).toBeVisible();
    await expect(this.encryptionIndicator).toContainText(/chiffré|encrypted/i);
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.conversationList).toBeVisible();
  }

  async expectConversationInList(conversationId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="conversation-${conversationId}"]`)).toBeVisible();
  }

  async expectMessageInThread(message: string): Promise<void> {
    await expect(this.messageThread.getByText(message)).toBeVisible();
  }
}
