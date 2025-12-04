/**
 * ProductReviews Component
 * Display product reviews with filtering, sorting, and pagination
 * T3-048: Review Frontend Components
 */

import React, { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { ReviewForm, type ReviewSubmission } from './ReviewForm';
import './ProductReviews.css';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string | null;
  user_id: string;
  userName?: string;
  verified_purchase: boolean;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  image_urls?: string[];
}

interface ReviewsResponse {
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  statistics: {
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  };
}

interface ProductReviewsProps {
  productId: string;
  onReviewSubmitted?: () => void;
  canReview?: boolean;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  onReviewSubmitted,
  canReview = true,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewsResponse['statistics'] | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [sort, setSort] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewsCallback = React.useCallback(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sort, filterRating, verifiedOnly, pagination.page]);

  useEffect(() => {
    fetchReviewsCallback();
  }, [fetchReviewsCallback]);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        sort,
        ...(filterRating && { rating: String(filterRating) }),
        ...(verifiedOnly && { verified_only: 'true' }),
      });

      const response = await fetch(
        `/api/products/${productId}/reviews?${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data: ReviewsResponse = await response.json();
      setReviews(data.data);
      setStatistics(data.statistics);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData: ReviewSubmission) => {
    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    setShowReviewForm(false);
    await fetchReviews();
    onReviewSubmitted?.();
  };

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark as helpful');
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const handleUnhelpfulClick = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/unhelpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark as unhelpful');
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error marking review as unhelpful:', err);
    }
  };

  const handleFlagClick = async (reviewId: string, reason: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag review');
      }

      await fetchReviews();
    } catch (err) {
      console.error('Error flagging review:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="product-reviews" data-testid="reviews-section">
      <h2 className="product-reviews__title">Customer Reviews</h2>

      {statistics && (
        <div className="product-reviews__header" data-testid="reviews-header">
          <div className="product-reviews__rating-overview">
            <div className="product-reviews__average" data-testid="average-rating">
              <span className="product-reviews__rating-value">
                {statistics.average_rating.toFixed(1)}
              </span>
              <div className="product-reviews__rating-stars">
                <StarRating value={Math.round(statistics.average_rating)} readOnly />
              </div>
              <span className="product-reviews__review-count" data-testid="review-count">
                {statistics.total_reviews} {statistics.total_reviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <div className="product-reviews__distribution" data-testid="star-distribution">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="product-reviews__distribution-row">
                  <button
                    className="product-reviews__distribution-label"
                    onClick={() => setFilterRating(filterRating === star ? undefined : star)}
                  >
                    {star} star
                  </button>
                  <div className="product-reviews__distribution-bar">
                    <div
                      className="product-reviews__distribution-fill"
                      style={{
                        width: `${
                          statistics.total_reviews > 0
                            ? ((statistics.rating_distribution[star] || 0) /
                                statistics.total_reviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="product-reviews__distribution-count" data-testid={`rating-count-${star}`}>
                    {statistics.rating_distribution[star] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {canReview && (
            <button
              className="product-reviews__write-button"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>
      )}

      {showReviewForm && canReview && (
        <ReviewForm
          _productId={productId}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      <div className="product-reviews__controls">
        <div className="product-reviews__filters">
          <select
            className="product-reviews__sort-dropdown"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as 'recent' | 'helpful' | 'rating');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            data-testid="sort-dropdown"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rated</option>
          </select>

          <label className="product-reviews__checkbox">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
            Verified Purchases Only
          </label>
        </div>
      </div>

      {error && <div className="product-reviews__error">{error}</div>}

      {isLoading ? (
        <div className="product-reviews__loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="product-reviews__empty">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="product-reviews__list">
          {reviews.map((review) => (
            <div key={review.id} className="product-reviews__item" data-testid={`review-item-${review.id}`}>
              <div className="product-reviews__item-header">
                <div>
                  <StarRating value={review.rating} readOnly size="small" showLabel={false} />
                  <h3 className="product-reviews__item-title" data-testid={`review-title-${review.id}`}>
                    {review.title}
                  </h3>
                </div>
                {review.verified_purchase && (
                  <span className="product-reviews__verified-badge" data-testid={`verified-badge-${review.id}`}>
                    Verified Purchase
                  </span>
                )}
              </div>

              <div className="product-reviews__item-meta">
                <span className="product-reviews__item-author" data-testid={`review-author-${review.id}`}>
                  {review.userName || 'Anonymous'}
                </span>
                <span className="product-reviews__item-date" data-testid={`review-date-${review.id}`}>
                  {formatDate(review.created_at)}
                </span>
              </div>

              {review.comment && (
                <p className="product-reviews__item-comment" data-testid={`review-comment-${review.id}`}>
                  {review.comment}
                </p>
              )}

              {review.image_urls && review.image_urls.length > 0 && (
                <div className="product-reviews__item-images">
                  {review.image_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Review image ${idx + 1}`}
                      className="product-reviews__item-image"
                      data-testid={`review-image-${review.id}`}
                    />
                  ))}
                </div>
              )}

              <div className="product-reviews__item-footer">
                <div className="product-reviews__helpful">
                  <button
                    className="product-reviews__helpful-btn"
                    onClick={() => handleHelpfulClick(review.id)}
                    data-testid={`helpful-btn-${review.id}`}
                  >
                    👍 Helpful
                    <span data-testid={`helpful-count-${review.id}`}>({review.helpful_count})</span>
                  </button>
                  <button
                    className="product-reviews__helpful-btn"
                    onClick={() => handleUnhelpfulClick(review.id)}
                    data-testid={`unhelpful-btn-${review.id}`}
                  >
                    👎
                    <span data-testid={`unhelpful-count-${review.id}`}>({review.unhelpful_count})</span>
                  </button>
                </div>
                <button
                  className="product-reviews__report-btn"
                  onClick={() =>
                    handleFlagClick(review.id, 'Inappropriate content')
                  }
                  data-testid={`report-btn-${review.id}`}
                >
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="product-reviews__pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            disabled={pagination.page === pagination.total_pages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
