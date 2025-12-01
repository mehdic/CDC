/**
 * Webhook Routes
 * Handle incoming webhooks from WhatsApp, Email, Fax providers
 */

import { Router, Request, Response } from 'express';
import { WhatsAppChannel } from '../channels/whatsappChannel';
import { EmailChannel } from '../channels/emailChannel';
import { FaxChannel } from '../channels/faxChannel';

export function createWebhookRoutes(
  whatsappChannel?: WhatsAppChannel,
  emailChannel?: EmailChannel,
  faxChannel?: FaxChannel
): Router {
  const router = Router();

  /**
   * GET /api/webhooks/whatsapp
   * WhatsApp webhook verification (for initial setup)
   */
  router.get('/whatsapp', (req: Request, res: Response) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN || 'metapharm_webhook_token';

      if (mode === 'subscribe' && token === expectedToken) {
        console.log('WhatsApp webhook verified');
        return res.status(200).send(challenge);
      }

      return res.status(403).json({
        error: 'Webhook verification failed',
      });
    } catch (error) {
      console.error('Error verifying WhatsApp webhook:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/webhooks/whatsapp
   * Handle incoming WhatsApp messages and status updates
   */
  router.post('/whatsapp', async (req: Request, res: Response) => {
    try {
      if (!whatsappChannel) {
        return res.status(503).json({
          error: 'WhatsApp channel not configured',
        });
      }

      // Verify webhook signature
      const signature = req.headers['x-hub-signature-256'] as string;

      if (signature && whatsappChannel.verifyWebhook) {
        const isValid = whatsappChannel.verifyWebhook(signature, req.body);

        if (!isValid) {
          return res.status(401).json({
            error: 'Invalid webhook signature',
          });
        }
      }

      // Process webhook
      await whatsappChannel.handleIncoming(req.body);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/webhooks/email
   * Handle email delivery events (SendGrid, etc.)
   */
  router.post('/email', async (req: Request, res: Response) => {
    try {
      if (!emailChannel) {
        return res.status(503).json({
          error: 'Email channel not configured',
        });
      }

      // Process email webhook events
      await emailChannel.handleIncoming(req.body);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing email webhook:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/webhooks/fax
   * Handle fax delivery events (Twilio, etc.)
   */
  router.post('/fax', async (req: Request, res: Response) => {
    try {
      if (!faxChannel) {
        return res.status(503).json({
          error: 'Fax channel not configured',
        });
      }

      // Process fax webhook
      await faxChannel.handleIncoming(req.body);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing fax webhook:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  return router;
}
