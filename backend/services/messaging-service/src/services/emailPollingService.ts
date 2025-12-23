/**
 * Email Polling Service
 * IMAP polling for email aggregation from multiple accounts
 * Integrates incoming emails into the unified messaging system
 */

import { Repository } from 'typeorm';
import { Message, MessageChannel, MessageStatus, MessageDirection } from '../models/Message';
import { Conversation, ConversationType } from '../models/Conversation';

export interface ImapAccount {
  accountId: string;
  email: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  pollingIntervalMs: number;
  enabled: boolean;
}

export interface EmailPollingConfig {
  enabled: boolean;
  accounts: ImapAccount[];
  checkIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Represents an email that will be imported as a message
 */
interface ImportedEmail {
  uid: number;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
    data: Buffer;
  }[];
}

export class EmailPollingService {
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastPolledUids: Map<string, number> = new Map();
  private isInitialized: boolean = false;

  constructor(
    private config: EmailPollingConfig,
    private messageRepository: Repository<Message>,
    private conversationRepository: Repository<Conversation>
  ) {}

  /**
   * Initialize email polling
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Start polling for each enabled account
    for (const account of this.config.accounts) {
      if (account.enabled) {
        this.startPollingAccount(account);
      }
    }

    console.log('✓ Email polling service initialized');
  }

  /**
   * Start polling for a specific account
   */
  private startPollingAccount(account: ImapAccount): void {
    console.log(`Starting email polling for ${account.email}`);

    // Initial poll immediately
    this.pollAccount(account).catch((error) => {
      console.error(`Error polling ${account.email}:`, error);
    });

    // Set up recurring polling
    const timer = setInterval(() => {
      this.pollAccount(account).catch((error) => {
        console.error(`Error polling ${account.email}:`, error);
      });
    }, account.pollingIntervalMs);

    this.pollingTimers.set(account.accountId, timer);
  }

  /**
   * Poll a specific email account
   */
  private async pollAccount(account: ImapAccount): Promise<void> {
    try {
      // In a real implementation, this would use node-imap or similar
      // For now, this is a placeholder that shows the structure

      const emails = await this.fetchEmailsFromImap(account);

      for (const email of emails) {
        await this.importEmail(account, email);
      }
    } catch (error) {
      console.error(`Failed to poll ${account.email}:`, error);
    }
  }

  /**
   * Fetch emails from IMAP server (placeholder - would use real IMAP library)
   */
  private async fetchEmailsFromImap(account: ImapAccount): Promise<ImportedEmail[]> {
    // This is a placeholder implementation
    // In production, use 'imap' or 'node-imap' package
    // Example:
    /*
    const imap = new Imap({
      user: account.username,
      password: account.password,
      host: account.host,
      port: account.port,
      tls: account.secure,
      tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err);

        const lastUid = this.lastPolledUids.get(account.accountId) || 0;
        const searchCriteria = [`UID ${lastUid + 1}:*`];

        imap.search(searchCriteria, (err, results) => {
          if (err || !results.length) {
            imap.end();
            return resolve([]);
          }

          // Fetch and parse emails...
        });
      });
    });
    */

    return [];
  }

  /**
   * Import an email as a message in the unified inbox
   */
  private async importEmail(account: ImapAccount, email: ImportedEmail): Promise<void> {
    try {
      // Parse email addresses to extract user IDs
      // In a real system, these would need to be mapped to actual user IDs
      const senderId = this.extractUserIdFromEmail(email.from, account);
      const recipientId = this.extractUserIdFromEmail(email.to, account);

      if (!senderId || !recipientId) {
        console.warn('Could not extract user IDs from email:', {
          from: email.from,
          to: email.to,
        });
        return;
      }

      // Find or create conversation
      let conversation = await this.findOrCreateConversation(
        senderId,
        recipientId,
        email
      );

      // Create message
      const message = this.messageRepository.create({
        conversationId: conversation.id,
        senderId,
        senderRole: 'system', // Email is from external source
        recipientId,
        recipientRole: 'patient', // Adjust based on your roles
        channel: MessageChannel.EMAIL,
        direction: MessageDirection.INBOUND,
        content: email.text || email.html || '',
        status: MessageStatus.DELIVERED,
        metadata: {
          externalId: email.messageId,
          subject: email.subject,
          inReplyTo: email.inReplyTo,
          references: email.references,
          originalFrom: email.from,
          originalTo: email.to,
        },
      });

      // Add attachments if present
      if (email.attachments && email.attachments.length > 0) {
        message.attachments = email.attachments.map((att) => ({
          id: `${email.messageId}-${att.filename}`,
          type: att.mimeType.split('/')[0], // image, document, etc.
          url: `data:${att.mimeType};base64,${att.data.toString('base64')}`,
          filename: att.filename,
          size: att.size,
          mimeType: att.mimeType,
        }));
      }

      // Save message
      await this.messageRepository.save(message);

      // Update conversation
      conversation.updateLastMessage(message.id);
      conversation.incrementUnreadCount(recipientId);
      await this.conversationRepository.save(conversation);

      console.log(`Imported email: ${email.subject} from ${email.from}`);
    } catch (error) {
      console.error('Error importing email:', error);
    }
  }

  /**
   * Find or create a conversation for email thread
   */
  private async findOrCreateConversation(
    senderId: string,
    recipientId: string,
    email: ImportedEmail
  ): Promise<Conversation> {
    // Try to find existing conversation based on email thread references
    let conversation: Conversation | null = null;

    if (email.inReplyTo) {
      // Look for conversation with this message ID
      conversation = await this.conversationRepository.findOne({
        where: {
          metadata: {
            emailThreadId: email.inReplyTo,
          },
        },
      });
    }

    // If not found, create new conversation
    if (!conversation) {
      conversation = this.conversationRepository.create({
        type: ConversationType.DIRECT,
        participants: [
          {
            userId: senderId,
            role: 'sender',
            joinedAt: new Date(),
            unreadCount: 0,
          },
          {
            userId: recipientId,
            role: 'recipient',
            joinedAt: new Date(),
            unreadCount: 1,
          },
        ],
        subject: email.subject,
        metadata: {
          emailThreadId: email.messageId,
          source: 'email_import',
        },
      });

      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  /**
   * Extract user ID from email address
   * In a real system, this would look up the user by email
   */
  private extractUserIdFromEmail(emailAddress: string, account: ImapAccount): string | null {
    // This is a placeholder
    // In production, you'd query the user service to find user by email
    // For now, return a hash of the email as a temporary ID
    const hash = emailAddress.split('@')[0];
    return hash || null;
  }

  /**
   * Stop polling for a specific account
   */
  stopPollingAccount(accountId: string): void {
    const timer = this.pollingTimers.get(accountId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(accountId);
      console.log(`Stopped polling for account ${accountId}`);
    }
  }

  /**
   * Stop all polling
   */
  async shutdown(): Promise<void> {
    for (const [accountId, timer] of this.pollingTimers.entries()) {
      clearInterval(timer);
    }
    this.pollingTimers.clear();
    this.isInitialized = false;
    console.log('Email polling service shut down');
  }

  /**
   * Get polling status for all accounts
   */
  getPollingStatus(): Array<{
    accountId: string;
    email: string;
    enabled: boolean;
    isPolling: boolean;
    lastPolledUid?: number;
  }> {
    return this.config.accounts.map((account) => ({
      accountId: account.accountId,
      email: account.email,
      enabled: account.enabled,
      isPolling: this.pollingTimers.has(account.accountId),
      lastPolledUid: this.lastPolledUids.get(account.accountId),
    }));
  }
}
