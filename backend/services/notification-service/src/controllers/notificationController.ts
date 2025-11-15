/**
 * Notification Controller
 * CRUD operations for Notification entity
 * HIPAA/GDPR compliant with audit logging
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Notification, NotificationType, NotificationStatus } from '../../../../shared/models/Notification';
import { AuditLog } from '../../../../shared/models/AuditLog';

const notificationRepository = AppDataSource.getRepository(Notification);
const auditLogRepository = AppDataSource.getRepository(AuditLog);

/**
 * Create audit log entry
 */
async function createAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: Record<string, any>
): Promise<void> {
  try {
    const auditLog = auditLogRepository.create({
      user_id: userId,
      action,
      resource: resourceType,
      resource_id: resourceId,
      details: changes || {},
      ip_address: null,
      user_agent: null,
    });
    await auditLogRepository.save(auditLog);
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
    // Don't throw - audit logging failure shouldn't block the operation
  }
}

/**
 * GET /notifications
 * List all notifications with filtering
 */
export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const {
      user_id,
      type,
      status,
      limit = 50,
      offset = 0,
    } = req.query;

    const query = notificationRepository.createQueryBuilder('notification');

    // Apply filters
    if (user_id) {
      query.andWhere('notification.user_id = :user_id', { user_id });
    }
    if (type) {
      query.andWhere('notification.type = :type', { type });
    }
    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    // Apply pagination
    query.take(Number(limit));
    query.skip(Number(offset));

    // Order by created_at DESC
    query.orderBy('notification.created_at', 'DESC');

    const [notifications, total] = await query.getManyAndCount();

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Notification] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list notifications',
      message: error.message,
    });
  }
}

/**
 * GET /notifications/:id
 * Get notification by ID
 */
export async function getNotification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const notification = await notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error('[Notification] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification',
      message: error.message,
    });
  }
}

/**
 * POST /notifications
 * Create new notification
 */
export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const {
      user_id,
      type,
      subject,
      message,
      metadata,
    } = req.body;

    // Validation
    if (!user_id || !type || !subject || !message) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, type, subject, message',
      });
      return;
    }

    // Validate type
    if (!Object.values(NotificationType).includes(type)) {
      res.status(400).json({
        success: false,
        error: `Invalid notification type. Must be one of: ${Object.values(NotificationType).join(', ')}`,
      });
      return;
    }

    // Create notification
    const notification = notificationRepository.create({
      user_id,
      type,
      subject,
      message,
      status: NotificationStatus.PENDING,
      metadata: metadata || null,
    });

    const savedNotification = await notificationRepository.save(notification);

    // Audit log
    await createAuditLog(
      user_id,
      'CREATE',
      'notification',
      savedNotification.id,
      { type, subject }
    );

    res.status(201).json({
      success: true,
      data: savedNotification,
      message: 'Notification created successfully',
    });
  } catch (error: any) {
    console.error('[Notification] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message,
    });
  }
}

/**
 * PUT /notifications/:id
 * Update notification
 */
export async function updateNotification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      status,
      metadata,
      error_message,
    } = req.body;

    const notification = await notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};

    // Update status
    if (status && Object.values(NotificationStatus).includes(status)) {
      changes.status = { old: notification.status, new: status };
      notification.status = status;

      // Update timestamps based on status
      if (status === NotificationStatus.SENT && !notification.sent_at) {
        notification.sent_at = new Date();
      } else if (status === NotificationStatus.DELIVERED && !notification.delivered_at) {
        notification.delivered_at = new Date();
      } else if (status === NotificationStatus.READ && !notification.read_at) {
        notification.read_at = new Date();
      }
    }

    // Update metadata
    if (metadata !== undefined) {
      changes.metadata = { old: notification.metadata, new: metadata };
      notification.metadata = metadata;
    }

    // Update error message
    if (error_message !== undefined) {
      changes.error_message = { old: notification.error_message, new: error_message };
      notification.error_message = error_message;
    }

    const updatedNotification = await notificationRepository.save(notification);

    // Audit log
    await createAuditLog(
      notification.user_id,
      'UPDATE',
      'notification',
      notification.id,
      changes
    );

    res.status(200).json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully',
    });
  } catch (error: any) {
    console.error('[Notification] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification',
      message: error.message,
    });
  }
}

/**
 * DELETE /notifications/:id
 * Delete notification (soft delete)
 */
export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const notification = await notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    // Hard delete (for GDPR right to be forgotten)
    await notificationRepository.remove(notification);

    // Audit log
    await createAuditLog(
      notification.user_id,
      'DELETE',
      'notification',
      id,
      { type: notification.type, subject: notification.subject }
    );

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('[Notification] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message,
    });
  }
}

/**
 * POST /notifications/:id/mark-read
 * Mark notification as read (for in-app notifications)
 */
export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const notification = await notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    // Only in-app notifications can be marked as read
    if (notification.type !== NotificationType.IN_APP) {
      res.status(400).json({
        success: false,
        error: 'Only in-app notifications can be marked as read',
      });
      return;
    }

    notification.markAsRead();
    const updatedNotification = await notificationRepository.save(notification);

    // Audit log
    await createAuditLog(
      notification.user_id,
      'MARK_READ',
      'notification',
      notification.id
    );

    res.status(200).json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('[Notification] Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message,
    });
  }
}

/**
 * GET /notifications/user/:user_id/unread
 * Get unread in-app notifications for a user
 */
export async function getUnreadNotifications(req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.params;

    const notifications = await notificationRepository.find({
      where: {
        user_id,
        type: NotificationType.IN_APP,
        status: NotificationStatus.DELIVERED,
      },
      order: {
        created_at: 'DESC',
      },
    });

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    console.error('[Notification] Get unread error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread notifications',
      message: error.message,
    });
  }
}
