/**
 * Integration Tests for Channel Integrations
 * Tests WhatsApp, Email, and Fax integrations with mocked external APIs
 */

import { whatsappClient } from '../integrations/whatsapp';
import { emailClient } from '../integrations/email';
import { faxClient } from '../integrations/fax';
import { MessageStatus } from '../types/message';

describe('WhatsApp Integration', () => {
  describe('sendMessage', () => {
    it('should send WhatsApp message successfully (stub)', async () => {
      const result = await whatsappClient.sendMessage({
        to: 'whatsapp:+41791234567',
        body: 'Test WhatsApp message',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.statusCode).toBe(200);
    });

    it('should reject invalid phone number format', async () => {
      const result = await whatsappClient.sendMessage({
        to: '+41791234567', // Missing 'whatsapp:' prefix
        body: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WhatsApp format');
    });

    it('should support media attachments', async () => {
      const result = await whatsappClient.sendMessage({
        to: 'whatsapp:+41791234567',
        body: 'Check this image',
        mediaUrl: ['https://example.com/image.jpg'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message successfully (stub)', async () => {
      const result = await whatsappClient.sendTemplateMessage({
        to: 'whatsapp:+41791234567',
        templateSid: 'HXXXXXXXXXXXXXXXXXXX',
        contentVariables: {
          name: 'John Doe',
          pharmacy: 'MetaPharm',
        },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('getMessageStatus', () => {
    it('should return message status (stub)', async () => {
      const status = await whatsappClient.getMessageStatus('WA123456');

      expect(status).toBe(MessageStatus.DELIVERED);
    });
  });

  describe('handleIncomingMessage', () => {
    it('should parse incoming WhatsApp webhook', async () => {
      const webhookData = {
        From: 'whatsapp:+41791234567',
        To: 'whatsapp:+41791234568',
        Body: 'Hello from WhatsApp',
        MessageSid: 'SM123456',
      };

      const message = await whatsappClient.handleIncomingMessage(webhookData);

      expect(message).toBeDefined();
      expect(message?.from.phone).toBe(webhookData.From);
      expect(message?.body).toBe(webhookData.Body);
    });
  });
});

describe('Email Integration', () => {
  describe('sendEmail', () => {
    it('should send email successfully (stub)', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: 'Test Email',
        text: 'Test email body',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should require at least one recipient', async () => {
      const result = await emailClient.sendEmail({
        to: [],
        subject: 'Test',
        text: 'Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('recipient');
    });

    it('should require subject', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: '',
        text: 'Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('subject');
    });

    it('should require content (text or HTML)', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('content');
    });

    it('should support HTML content', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: 'Test HTML Email',
        html: '<h1>Hello</h1><p>This is HTML email</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should support attachments', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: 'Email with Attachment',
        text: 'See attached document',
        attachments: [
          {
            filename: 'document.pdf',
            content: Buffer.from('PDF content'),
            contentType: 'application/pdf',
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should support CC and BCC recipients', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test CC/BCC',
        text: 'Email with CC and BCC',
      });

      expect(result.success).toBe(true);
    });

    it('should support threading with In-Reply-To', async () => {
      const result = await emailClient.sendEmail({
        to: ['user@example.com'],
        subject: 'Re: Original Subject',
        text: 'Reply to your email',
        inReplyTo: '<original-message-id@example.com>',
        references: ['<original-message-id@example.com>'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendBulkEmails', () => {
    it('should send multiple emails', async () => {
      const emails = [
        {
          to: ['user1@example.com'],
          subject: 'Email 1',
          text: 'Body 1',
        },
        {
          to: ['user2@example.com'],
          subject: 'Email 2',
          text: 'Body 2',
        },
      ];

      const results = await emailClient.sendBulkEmails(emails);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('handleIncomingEmail', () => {
    it('should parse incoming email webhook', async () => {
      const webhookData = {
        from: 'sender@example.com',
        to: 'pharmacy@metapharm.ch',
        subject: 'Question about medication',
        text: 'I have a question...',
        html: '<p>I have a question...</p>',
        messageId: '<msg-id@example.com>',
      };

      const message = await emailClient.handleIncomingEmail(webhookData);

      expect(message).toBeDefined();
      expect(message?.from.email).toBe(webhookData.from);
      expect(message?.subject).toBe(webhookData.subject);
    });
  });

  describe('extractThreadingInfo', () => {
    it('should extract threading information', () => {
      const result = emailClient.extractThreadingInfo(
        '<reply-to@example.com>',
        ['<original@example.com>', '<reply-to@example.com>']
      );

      expect(result.threadId).toBe('<original@example.com>');
      expect(result.parentMessageId).toBe('<reply-to@example.com>');
    });
  });
});

describe('Fax Integration', () => {
  describe('sendFax', () => {
    it('should send fax successfully (stub)', async () => {
      const result = await faxClient.sendFax({
        to: '+14155551234',
        pdfUrl: 'https://example.com/document.pdf',
      });

      expect(result.success).toBe(true);
      expect(result.faxId).toBeDefined();
      expect(result.statusCode).toBe(200);
    });

    it('should validate fax number format (E.164)', async () => {
      const result = await faxClient.sendFax({
        to: '555-1234', // Invalid format
        pdfUrl: 'https://example.com/document.pdf',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid fax number');
    });

    it('should require PDF source', async () => {
      const result = await faxClient.sendFax({
        to: '+14155551234',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('pdfUrl or pdfContent');
    });

    it('should support quality settings', async () => {
      const result = await faxClient.sendFax({
        to: '+14155551234',
        pdfUrl: 'https://example.com/document.pdf',
        quality: 'superfine',
      });

      expect(result.success).toBe(true);
    });

    it('should support sending from PDF buffer', async () => {
      const pdfBuffer = Buffer.from('PDF content');

      const result = await faxClient.sendFax({
        to: '+14155551234',
        pdfContent: pdfBuffer,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getFaxStatus', () => {
    it('should return fax status (stub)', async () => {
      const status = await faxClient.getFaxStatus('FX123456');

      expect(status).toBe(MessageStatus.DELIVERED);
    });
  });

  describe('handleIncomingFax', () => {
    it('should parse incoming fax webhook', async () => {
      const webhookData = {
        From: '+14155551234',
        To: '+14155551235',
        MediaUrl: 'https://example.com/received-fax.pdf',
        NumPages: 3,
        FaxSid: 'FX123456',
      };

      const message = await faxClient.handleIncomingFax(webhookData);

      expect(message).toBeDefined();
      expect(message?.from.faxNumber).toBe(webhookData.From);
      expect(message?.attachments).toHaveLength(1);
      expect(message?.attachments?.[0].mimeType).toBe('application/pdf');
    });
  });

  describe('convertToPDF', () => {
    it('should convert text to PDF (stub)', async () => {
      const pdfBuffer = await faxClient.convertToPDF('Test fax content', {
        title: 'Test Document',
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('getFaxPagesCount', () => {
    it('should return pages count (stub)', async () => {
      const pages = await faxClient.getFaxPagesCount('FX123456');

      expect(pages).toBe(1);
    });
  });
});

describe('Cross-Integration Tests', () => {
  it('should handle different channel types independently', async () => {
    const whatsappResult = await whatsappClient.sendMessage({
      to: 'whatsapp:+41791234567',
      body: 'WhatsApp message',
    });

    const emailResult = await emailClient.sendEmail({
      to: ['user@example.com'],
      subject: 'Email message',
      text: 'Email body',
    });

    const faxResult = await faxClient.sendFax({
      to: '+14155551234',
      pdfUrl: 'https://example.com/fax.pdf',
    });

    expect(whatsappResult.success).toBe(true);
    expect(emailResult.success).toBe(true);
    expect(faxResult.success).toBe(true);
  });
});
