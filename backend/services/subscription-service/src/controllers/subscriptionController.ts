/**
 * Subscription Controller
 * HTTP handlers for subscription endpoints
 * Task T6-016 - Subscription Service Implementation
 */

import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { SchedulerService } from '../services/schedulerService';

/**
 * POST /api/v1/patients/:id/subscriptions
 * Create a new subscription
 */
export async function createSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id: patientId } = req.params;
    const subscriptionData = req.body;

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.createSubscription({
      ...subscriptionData,
      patient_id: patientId,
    });

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Create error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create subscription',
    });
  }
}

/**
 * GET /api/v1/patients/:id/subscriptions
 * List patient subscriptions
 */
export async function listPatientSubscriptions(req: Request, res: Response): Promise<void> {
  try {
    const { id: patientId } = req.params;
    const { include_inactive } = req.query;

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscriptions = await subscriptionService.listPatientSubscriptions(
      patientId,
      include_inactive === 'true'
    );

    res.status(200).json({
      success: true,
      data: subscriptions,
      count: subscriptions.length,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list subscriptions',
    });
  }
}

/**
 * GET /api/v1/subscriptions/:id
 * Get subscription by ID
 */
export async function getSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.getSubscription(id, userId, userRole);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Get error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to get subscription',
    });
  }
}

/**
 * PUT /api/v1/subscriptions/:id
 * Update subscription
 */
export async function updateSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.updateSubscription(
      id,
      updates,
      userId,
      userRole
    );

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Update error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to update subscription',
    });
  }
}

/**
 * DELETE /api/v1/subscriptions/:id
 * Delete subscription
 */
export async function deleteSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const deleted = await subscriptionService.deleteSubscription(id, userId, userRole);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Delete error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to delete subscription',
    });
  }
}

/**
 * POST /api/v1/subscriptions/:id/pause
 * Pause subscription
 */
export async function pauseSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.pauseSubscription(id, userId, userRole);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Pause error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to pause subscription',
    });
  }
}

/**
 * POST /api/v1/subscriptions/:id/resume
 * Resume subscription
 */
export async function resumeSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.resumeSubscription(id, userId, userRole);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Resume error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to resume subscription',
    });
  }
}

/**
 * POST /api/v1/subscriptions/:id/skip
 * Skip next delivery
 */
export async function skipNextDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.skipNextDelivery(id, userId, userRole);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
      message: `Next delivery skipped, new date: ${subscription.next_delivery_date}`,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Skip error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to skip delivery',
    });
  }
}

/**
 * POST /api/v1/subscriptions/:id/cancel
 * Cancel subscription
 */
export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const subscription = await subscriptionService.cancelSubscription(
      id,
      reason,
      userId,
      userRole
    );

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Cancel error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      error: error.message || 'Failed to cancel subscription',
    });
  }
}

/**
 * GET /api/v1/subscriptions/:id/next-delivery
 * Get next delivery preview
 */
export async function getNextDeliveryPreview(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || '';
    const userRole = (req as any).user?.role || 'patient';

    const subscriptionService = new SubscriptionService(req.app.locals.dataSource);

    const preview = await subscriptionService.getNextDeliveryPreview(id, userId, userRole);

    if (!preview) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Preview error:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Failed to get delivery preview',
    });
  }
}

/**
 * POST /api/v1/subscriptions/process-scheduled (internal endpoint)
 * Process scheduled subscriptions (called by cron job)
 */
export async function processScheduledOrders(req: Request, res: Response): Promise<void> {
  try {
    // TODO: Add internal auth check (API key, IP whitelist, etc.)

    const schedulerService = new SchedulerService(req.app.locals.dataSource);

    const results = await schedulerService.processScheduledOrders();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.status(200).json({
      success: true,
      data: {
        total_processed: results.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error: any) {
    console.error('[SubscriptionController] Process scheduled error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process scheduled orders',
    });
  }
}
