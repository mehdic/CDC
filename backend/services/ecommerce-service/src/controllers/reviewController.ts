/**
 * Review Controller
 * Handles review API requests
 * T3-047 to T3-050: Product Reviews System
 */

import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';

const reviewService = new ReviewService();

/**
 * GET /api/products/:id/reviews
 * List reviews for a product with pagination
 */
export async function getProductReviews(req: Request, res: Response) {
  try {
    const { id: productId } = req.params;
    const {
      page = '1',
      limit = '10',
      rating,
      verified_only = 'false',
      sort = 'recent',
    } = req.query;

    const filters = {
      rating: rating ? parseInt(rating as string, 10) : undefined,
      verified_only: verified_only === 'true',
      approved_only: true,
      sort: (sort as 'recent' | 'helpful' | 'rating') || 'recent',
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const { reviews, total, averageRating, ratingDistribution } =
      await reviewService.getProductReviews(productId, filters);

    res.json({
      data: reviews,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        total_pages: Math.ceil(total / filters.limit),
      },
      statistics: {
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_reviews: total,
        rating_distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve reviews',
    });
  }
}

/**
 * POST /api/products/:id/reviews
 * Submit a new review
 */
export async function createReview(req: Request, res: Response) {
  try {
    const { id: productId } = req.params;
    const { rating, title, comment, image_urls } = req.body;
    const userId = (req as any).user?.id; // From auth middleware

    // Validate required fields
    if (!rating || !title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rating and title are required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to submit a review',
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    // Validate title length
    if (title.length < 3 || title.length > 255) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title must be between 3 and 255 characters',
      });
    }

    // Validate comment length if provided
    if (comment && comment.length > 5000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Comment must be at most 5000 characters',
      });
    }

    const review = await reviewService.createReview({
      product_id: productId,
      user_id: userId,
      rating,
      title,
      comment: comment || undefined,
      image_urls: image_urls || undefined,
    });

    res.status(201).json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    if (error.message.includes('already reviewed')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You have already reviewed this product',
      });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create review',
    });
  }
}

/**
 * PUT /api/reviews/:id
 * Update an existing review
 */
export async function updateReview(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;
    const { rating, title, comment, image_urls } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    const review = await reviewService.updateReview(reviewId, userId, {
      rating,
      title,
      comment,
      image_urls,
    });

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update review',
    });
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
export async function deleteReview(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    await reviewService.deleteReview(reviewId, userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting review:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete review',
    });
  }
}

/**
 * POST /api/reviews/:id/helpful
 * Mark a review as helpful
 */
export async function markReviewHelpful(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;

    const review = await reviewService.markReviewHelpful(reviewId);

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error marking review as helpful:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark review as helpful',
    });
  }
}

/**
 * DELETE /api/reviews/:id/helpful
 * Unmark a review as helpful
 */
export async function unmarkReviewHelpful(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;

    const review = await reviewService.unmarkReviewHelpful(reviewId);

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error unmarking review as helpful:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unmark review as helpful',
    });
  }
}

/**
 * POST /api/reviews/:id/unhelpful
 * Mark a review as unhelpful
 */
export async function markReviewUnhelpful(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;

    const review = await reviewService.markReviewUnhelpful(reviewId);

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error marking review as unhelpful:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark review as unhelpful',
    });
  }
}

/**
 * DELETE /api/reviews/:id/unhelpful
 * Unmark a review as unhelpful
 */
export async function unmarkReviewUnhelpful(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;

    const review = await reviewService.unmarkReviewUnhelpful(reviewId);

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error unmarking review as unhelpful:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unmark review as unhelpful',
    });
  }
}

/**
 * POST /api/reviews/:id/flag
 * Flag a review as inappropriate
 */
export async function flagReview(req: Request, res: Response) {
  try {
    const { id: reviewId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Flag reason is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in',
      });
    }

    const review = await reviewService.flagReview(reviewId, reason, userId);

    res.json({
      data: review,
    });
  } catch (error: any) {
    console.error('Error flagging review:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to flag review',
    });
  }
}
