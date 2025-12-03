/**
 * Recommendation Routes
 * T5-032: Express routes for AI recommendation endpoints
 */

import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();
const recommendationController = new RecommendationController();

/**
 * @route   POST /api/analytics/recommendations/generate
 * @desc    Generate personalized recommendations for a user
 * @access  Private (requires authentication)
 */
router.post('/generate', recommendationController.generateRecommendations);

/**
 * @route   GET /api/analytics/recommendations/:userId
 * @desc    Get active recommendations for a user
 * @access  Private (requires authentication)
 */
router.get('/:userId', recommendationController.getActiveRecommendations);

/**
 * @route   POST /api/analytics/recommendations/:recommendationId/view
 * @desc    Track recommendation view
 * @access  Private (requires authentication)
 */
router.post('/:recommendationId/view', recommendationController.trackView);

/**
 * @route   POST /api/analytics/recommendations/:recommendationId/click
 * @desc    Track recommendation click
 * @access  Private (requires authentication)
 */
router.post('/:recommendationId/click', recommendationController.trackClick);

/**
 * @route   POST /api/analytics/recommendations/:recommendationId/conversion
 * @desc    Track recommendation conversion (purchase)
 * @access  Private (requires authentication)
 */
router.post('/:recommendationId/conversion', recommendationController.trackConversion);

/**
 * @route   POST /api/analytics/recommendations/:recommendationId/dismiss
 * @desc    Dismiss a recommendation
 * @access  Private (requires authentication)
 */
router.post('/:recommendationId/dismiss', recommendationController.dismissRecommendation);

/**
 * @route   GET /api/analytics/recommendations/abtest/:experimentId/metrics
 * @desc    Get A/B test performance metrics
 * @access  Private (requires admin authentication)
 */
router.get('/abtest/:experimentId/metrics', recommendationController.getABTestMetrics);

export default router;
