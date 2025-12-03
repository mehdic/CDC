/**
 * ReviewList Component
 * Display product/pharmacy reviews with filtering and sorting
 * Task: T6-019
 */

import React, { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import '../styles/ReviewList.css';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  author: string;
  createdAt: string;
  helpful: number;
  notHelpful: number;
  photos?: string[];
  wouldRecommend: boolean;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
}

interface ReviewListProps {
  productId?: string;
  pharmacyId?: string;
  reviews?: Review[];
  onLoadMore?: () => Promise<void>;
  isLoading?: boolean;
}

type SortOption = 'recent' | 'helpful' | 'rating-high' | 'rating-low';
type FilterOption = 'all' | 'verified' | '5-star' | '4-star' | '1-star';

export const ReviewList: React.FC<ReviewListProps> = ({
  productId,
  pharmacyId,
  reviews: initialReviews = [],
  onLoadMore,
  isLoading = false,
}) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const getSortedAndFilteredReviews = () => {
    let filtered = [...reviews];

    // Apply filters
    if (filterBy === 'verified') {
      filtered = filtered.filter((r) => r.verifiedPurchase);
    } else if (filterBy !== 'all') {
      const ratingMap: Record<FilterOption, number> = {
        all: 0,
        verified: 0,
        '5-star': 5,
        '4-star': 4,
        '1-star': 1,
      };
      const rating = ratingMap[filterBy];
      filtered = filtered.filter((r) => r.rating === rating);
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'helpful') {
      sorted.sort(
        (a, b) =>
          b.helpful - a.helpful ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'rating-high') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-low') {
      sorted.sort((a, b) => a.rating - b.rating);
    }

    return sorted;
  };

  const calculateStats = () => {
    const approved = reviews.filter((r) => r.status === 'approved');
    if (approved.length === 0)
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };

    const average =
      approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
    const distribution = {
      5: approved.filter((r) => r.rating === 5).length,
      4: approved.filter((r) => r.rating === 4).length,
      3: approved.filter((r) => r.rating === 3).length,
      2: approved.filter((r) => r.rating === 2).length,
      1: approved.filter((r) => r.rating === 1).length,
    };

    return {
      average: Math.round(average * 10) / 10,
      total: approved.length,
      distribution,
    };
  };

  const handleLoadMore = async () => {
    setLoading(true);
    setError(null);

    try {
      if (onLoadMore) {
        await onLoadMore();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateStats();
  const sortedAndFiltered = getSortedAndFilteredReviews();

  return (
    <div className="review-list-container">
      {/* Statistics Section */}
      {reviews.length > 0 && (
        <div className="review-stats">
          <div className="stats-main">
            <div className="average-rating">
              <div className="rating-number">
                {stats.average.toFixed(1)}
              </div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${
                      star <= Math.round(stats.average) ? 'filled' : ''
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="total-reviews">
                {stats.total} avis
              </div>
            </div>

            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="distribution-row">
                  <span className="rating-label">{rating}★</span>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill"
                      style={{
                        width: `${
                          stats.total > 0
                            ? (stats.distribution[rating] / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="rating-count">
                    {stats.distribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="review-controls">
        <div className="control-group sort-group">
          <label htmlFor="sort-select" className="control-label">
            Trier par:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="control-select"
          >
            <option value="recent">Plus récents</option>
            <option value="helpful">Plus utiles</option>
            <option value="rating-high">Note la plus élevée</option>
            <option value="rating-low">Note la plus basse</option>
          </select>
        </div>

        <div className="control-group filter-group">
          <label htmlFor="filter-select" className="control-label">
            Filtrer:
          </label>
          <select
            id="filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="control-select"
          >
            <option value="all">Tous les avis</option>
            <option value="verified">Achat vérifié</option>
            <option value="5-star">5 étoiles</option>
            <option value="4-star">4 étoiles</option>
            <option value="1-star">1 étoile</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="review-cards">
        {sortedAndFiltered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>Aucun avis pour le moment</p>
            <small>Soyez le premier à partager votre expérience!</small>
          </div>
        ) : (
          <>
            {sortedAndFiltered.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}

            {reviews.length < 20 && onLoadMore && (
              <div className="load-more-container">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="btn btn-secondary btn-load-more"
                >
                  {loading ? 'Chargement...' : 'Charger plus d\'avis'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
