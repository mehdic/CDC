/**
 * ReviewManagementPage Component
 * Pharmacist view for managing product and service reviews
 * Task: T6-019
 */

import React, { useState, useEffect } from 'react';
import ReviewModerator from '../components/ReviewModerator';
import '../styles/ReviewManagementPage.css';

interface PendingReview {
  id: string;
  productId?: string;
  productName?: string;
  serviceType?: string;
  rating: number;
  title: string;
  comment: string;
  author: string;
  createdAt: string;
  photos?: string[];
  wouldRecommend: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

interface ReviewStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
  recommendationRate: number;
}

interface ReviewManagementPageProps {
  pharmacyId: string;
  onModerationComplete?: (reviewId: string, approved: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewManagementPage: React.FC<ReviewManagementPageProps> = ({
  pharmacyId,
  onModerationComplete,
  isLoading = false,
}) => {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    averageRating: 0,
    recommendationRate: 0,
  });

  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [pharmacyId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with real implementation
      const mockReviews: PendingReview[] = [
        {
          id: 'review-1',
          productName: 'Paracétamol 500mg',
          rating: 4,
          title: 'Très efficace pour les maux de tête',
          comment: 'Produit de qualité, livraison rapide et emballage soigné.',
          author: 'Jean D.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          wouldRecommend: true,
          status: 'pending',
        },
        {
          id: 'review-2',
          serviceType: 'delivery',
          productName: 'Service de livraison',
          rating: 5,
          title: 'Livraison impeccable',
          comment: 'Livreur courtois et professionnel.',
          author: 'Marie B.',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          wouldRecommend: true,
          status: 'pending',
        },
        {
          id: 'review-3',
          productName: 'Vitamines C',
          rating: 2,
          title: 'Déçu par la qualité',
          comment: 'Le produit ne correspond pas à la description.',
          author: 'Pierre L.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          wouldRecommend: false,
          status: 'pending',
        },
      ];

      const mockStats: ReviewStats = {
        totalReviews: 245,
        pendingReviews: 3,
        approvedReviews: 235,
        rejectedReviews: 7,
        averageRating: 4.3,
        recommendationRate: 88,
      };

      setReviews(mockReviews);
      setStats(mockStats);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des avis');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationComplete = async (
    reviewId: string,
    approved: boolean,
    reason?: string
  ) => {
    try {
      if (onModerationComplete) {
        await onModerationComplete(reviewId, approved);
      }

      // Update local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                status: approved ? 'approved' : 'rejected',
              }
            : review
        )
      );

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        pendingReviews: Math.max(0, prevStats.pendingReviews - 1),
        approvedReviews: approved
          ? prevStats.approvedReviews + 1
          : prevStats.approvedReviews,
        rejectedReviews: !approved
          ? prevStats.rejectedReviews + 1
          : prevStats.rejectedReviews,
      }));

      setSelectedReviewId(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modération');
      console.error('Error moderating review:', err);
    }
  };

  const handleReviewResponse = async (
    reviewId: string,
    response: string
  ) => {
    try {
      // Call API to save response
      // This would be integrated with the actual API
      console.log(`Response to review ${reviewId}:`, response);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la réponse');
    }
  };

  const getFilteredReviews = () => {
    let filtered = [...reviews];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => a.rating - b.rating);
    }

    return sorted;
  };

  const filteredReviews = getFilteredReviews();
  const selectedReview = reviews.find((r) => r.id === selectedReviewId);

  return (
    <div className="review-management-page-container">
      {/* Header */}
      <div className="review-management-header">
        <h1>Gestion des avis</h1>
        <p className="subtitle">Modérez et répondez aux avis des clients</p>
      </div>

      {/* Statistics Cards */}
      <div className="review-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Avis totaux</div>
          <div className="stat-value">{stats.totalReviews}</div>
          <div className="stat-secondary">
            Moyenne: {stats.averageRating.toFixed(1)} ★
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-label">En attente de modération</div>
          <div className="stat-value">{stats.pendingReviews}</div>
          <div className="stat-secondary">À traiter</div>
        </div>

        <div className="stat-card approved">
          <div className="stat-label">Approuvés</div>
          <div className="stat-value">{stats.approvedReviews}</div>
          <div className="stat-secondary">
            {((stats.approvedReviews / stats.totalReviews) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-label">Rejetés</div>
          <div className="stat-value">{stats.rejectedReviews}</div>
          <div className="stat-secondary">Refusés</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Recommandent</div>
          <div className="stat-value">{stats.recommendationRate}%</div>
          <div className="stat-secondary">Satisfaction</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
          <button
            className="alert-close"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="review-controls">
        <div className="control-group">
          <label htmlFor="filter-status">Filtrer:</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as 'all' | 'pending' | 'approved' | 'rejected'
              )
            }
            className="control-select"
          >
            <option value="all">Tous les avis</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sort-by">Trier:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
            className="control-select"
          >
            <option value="recent">Plus récents</option>
            <option value="rating">Note (faible à élevée)</option>
          </select>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="btn btn-secondary btn-refresh"
        >
          {loading ? 'Chargement...' : '⟳ Rafraîchir'}
        </button>
      </div>

      {/* Main Content */}
      <div className="review-management-content">
        {/* Reviews List */}
        <div className="reviews-list-section">
          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Aucun avis à afficher</p>
            </div>
          ) : (
            <div className="reviews-list">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className={`review-list-item ${
                    selectedReviewId === review.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedReviewId(review.id)}
                >
                  <div className="review-item-header">
                    <div className="review-item-status">
                      <span className={`status-badge status-${review.status}`}>
                        {review.status === 'pending'
                          ? 'En attente'
                          : review.status === 'approved'
                          ? 'Approuvé'
                          : 'Rejeté'}
                      </span>
                    </div>
                    <div className="review-item-title">{review.title}</div>
                    <div className="review-item-rating">
                      <span className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`star ${
                              i < review.rating ? 'filled' : ''
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="review-item-meta">
                    <span className="author">{review.author}</span>
                    <span className="date">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {review.productName && (
                      <span className="product">{review.productName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Details Panel */}
        {selectedReview && (
          <div className="review-details-section">
            <ReviewModerator
              review={selectedReview}
              onApprove={() => handleModerationComplete(selectedReview.id, true)}
              onReject={() => handleModerationComplete(selectedReview.id, false)}
              onResponse={(response) =>
                handleReviewResponse(selectedReview.id, response)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManagementPage;
