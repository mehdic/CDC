/**
 * Review Service
 * Business logic for review operations
 * T3-047 to T3-050: Product Reviews System
 */

import { AppDataSource } from '../config/database';
import { Review } from '../../../../shared/models/Review';
import { Product } from '../../../../shared/models/Product';
import { User } from '../../../../shared/models/User';

interface CreateReviewInput {
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment?: string;
  image_urls?: string[];
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
  image_urls?: string[];
}

interface ReviewFilters {
  rating?: number;
  verified_only?: boolean;
  approved_only?: boolean;
  sort?: 'recent' | 'helpful' | 'rating';
  page?: number;
  limit?: number;
}

export class ReviewService {
  private reviewRepository = AppDataSource.getRepository(Review);
  private productRepository = AppDataSource.getRepository(Product);

  /**
   * Create a new review
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: input.product_id },
    });
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate user exists
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: input.user_id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product_id: input.product_id,
        user_id: input.user_id,
      },
    });
    if (existingReview) {
      throw new Error('User has already reviewed this product');
    }

    // Create review
    const review = this.reviewRepository.create({
      product_id: input.product_id,
      user_id: input.user_id,
      rating: input.rating,
      title: input.title,
      comment: input.comment || null,
      image_urls: input.image_urls || null,
      verified_purchase: await this.isVerifiedPurchase(input.user_id, input.product_id),
      is_approved: true, // Auto-approve for now (can be made configurable)
    });

    // Save review
    const savedReview = await this.reviewRepository.save(review);

    // Update product rating
    await this.updateProductRating(product);

    return savedReview;
  }

  /**
   * Get reviews for a product with pagination and filtering
   */
  async getProductReviews(
    productId: string,
    filters: ReviewFilters = {}
  ): Promise<{ reviews: Review[]; total: number; averageRating: number; ratingDistribution: Record<number, number> }> {
    const {
      rating,
      verified_only = false,
      approved_only = true,
      sort = 'recent',
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    // Build query
    let query = this.reviewRepository
      .createQueryBuilder('review')
      .where('review.product_id = :productId', { productId });

    // Apply filters
    if (rating) {
      query = query.andWhere('review.rating = :rating', { rating });
    }

    if (verified_only) {
      query = query.andWhere('review.verified_purchase = true');
    }

    if (approved_only) {
      query = query.andWhere('review.is_approved = true');
    }

    // Apply sorting
    switch (sort) {
      case 'helpful':
        query = query.orderBy('review.helpful_count', 'DESC');
        break;
      case 'rating':
        query = query.orderBy('review.rating', 'DESC');
        break;
      case 'recent':
      default:
        query = query.orderBy('review.created_at', 'DESC');
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const reviews = await query.skip(skip).take(limit).leftJoinAndSelect('review.user', 'user').getMany();

    // Calculate average rating
    const allReviews = await this.reviewRepository.find({
      where: {
        product_id: productId,
        is_approved: true,
      },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      ratingDistribution[r.rating]++;
    });

    return {
      reviews,
      total,
      averageRating,
      ratingDistribution,
    };
  }

  /**
   * Get a specific review
   */
  async getReviewById(reviewId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['product', 'user'],
    });
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, userId: string, input: UpdateReviewInput): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Check authorization
    if (review.user_id !== userId) {
      throw new Error('Unauthorized to update this review');
    }

    // Validate rating if provided
    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Update fields
    if (input.rating !== undefined) {
      review.rating = input.rating;
    }
    if (input.title !== undefined) {
      review.title = input.title;
    }
    if (input.comment !== undefined) {
      review.comment = input.comment;
    }
    if (input.image_urls !== undefined) {
      review.image_urls = input.image_urls;
    }

    const updatedReview = await this.reviewRepository.save(review);

    // Update product rating if rating changed
    if (input.rating !== undefined) {
      const product = await this.productRepository.findOne({
        where: { id: review.product_id },
      });
      if (product) {
        await this.updateProductRating(product);
      }
    }

    return updatedReview;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Check authorization
    if (review.user_id !== userId) {
      throw new Error('Unauthorized to delete this review');
    }

    // Get product ID before deletion
    const productId = review.product_id;

    // Delete review
    await this.reviewRepository.remove(review);

    // Update product rating
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (product) {
      await this.updateProductRating(product);
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.markHelpful();
    return this.reviewRepository.save(review);
  }

  /**
   * Unmark review as helpful
   */
  async unmarkReviewHelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.unmarkHelpful();
    return this.reviewRepository.save(review);
  }

  /**
   * Mark review as unhelpful
   */
  async markReviewUnhelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.markUnhelpful();
    return this.reviewRepository.save(review);
  }

  /**
   * Unmark review as unhelpful
   */
  async unmarkReviewUnhelpful(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.unmarkUnhelpful();
    return this.reviewRepository.save(review);
  }

  /**
   * Flag review as inappropriate
   */
  async flagReview(reviewId: string, reason: string, flaggedBy: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.flag(reason, flaggedBy);
    return this.reviewRepository.save(review);
  }

  /**
   * Approve review (pharmacist action)
   */
  async approveReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.approve();
    return this.reviewRepository.save(review);
  }

  /**
   * Reject review (pharmacist action)
   */
  async rejectReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.reject();
    return this.reviewRepository.save(review);
  }

  /**
   * Check if user made a verified purchase of this product
   */
  private async isVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    // TODO: Implement order service integration to check if user purchased this product
    // For now, return false
    return false;
  }

  /**
   * Update product rating and review count
   */
  private async updateProductRating(product: Product): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: {
        product_id: product.id,
        is_approved: true,
      },
    });

    if (reviews.length === 0) {
      product.rating = 0;
      product.review_count = 0;
    } else {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = totalRating / reviews.length;
      product.review_count = reviews.length;
    }

    await this.productRepository.save(product);
  }
}
