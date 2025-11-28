/**
 * Review Routes
 * T3-047 to T3-050: Product Reviews System
 */

import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
  markReviewUnhelpful,
  unmarkReviewUnhelpful,
  flagReview,
} from '../controllers/reviewController';

const router = Router();

// Product reviews endpoints
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', createReview);

// Individual review endpoints
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// Helpful voting endpoints
router.post('/reviews/:id/helpful', markReviewHelpful);
router.delete('/reviews/:id/helpful', unmarkReviewHelpful);

// Unhelpful voting endpoints
router.post('/reviews/:id/unhelpful', markReviewUnhelpful);
router.delete('/reviews/:id/unhelpful', unmarkReviewUnhelpful);

// Moderation endpoints
router.post('/reviews/:id/flag', flagReview);

export default router;
