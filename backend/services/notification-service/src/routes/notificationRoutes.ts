/**
 * Notification Routes
 * RESTful routes for Notification CRUD operations
 */

import { Router } from 'express';
import {
  listNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  getUnreadNotifications,
} from '../controllers/notificationController';

const router = Router();

// CRUD routes
router.get('/notifications', listNotifications);
router.get('/notifications/:id', getNotification);
router.post('/notifications', createNotification);
router.put('/notifications/:id', updateNotification);
router.delete('/notifications/:id', deleteNotification);

// Special routes
router.post('/notifications/:id/mark-read', markNotificationAsRead);
router.get('/notifications/user/:user_id/unread', getUnreadNotifications);

export default router;
