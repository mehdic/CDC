/**
 * Behavior Tracking Routes
 * T5-031: Express routes for behavioral tracking endpoints
 */

import { Router } from 'express';
import { BehaviorController } from '../controllers/behaviorController';

const router = Router();
const behaviorController = new BehaviorController();

/**
 * @route   POST /api/analytics/behavior/track
 * @desc    Track a user behavior event
 * @access  Private (requires authentication)
 */
router.post('/track', behaviorController.trackEvent);

/**
 * @route   GET /api/analytics/behavior/pattern/:userId
 * @desc    Get user behavior patterns
 * @access  Private (requires authentication)
 */
router.get('/pattern/:userId', behaviorController.getUserPattern);

/**
 * @route   GET /api/analytics/behavior/journey/:userId/:sessionId
 * @desc    Get user journey for a specific session
 * @access  Private (requires authentication)
 */
router.get('/journey/:userId/:sessionId', behaviorController.getUserJourney);

/**
 * @route   DELETE /api/analytics/behavior/:userId
 * @desc    Delete user behavior data (GDPR right to be forgotten)
 * @access  Private (requires admin/user authentication)
 */
router.delete('/:userId', behaviorController.deleteUserData);

/**
 * @route   POST /api/analytics/behavior/anonymize/:userId
 * @desc    Anonymize user behavior data (GDPR alternative)
 * @access  Private (requires admin authentication)
 */
router.post('/anonymize/:userId', behaviorController.anonymizeUserData);

/**
 * @route   GET /api/analytics/behavior/sessions/:userId
 * @desc    Get active sessions count
 * @access  Private (requires authentication)
 */
router.get('/sessions/:userId', behaviorController.getActiveSessions);

export default router;
