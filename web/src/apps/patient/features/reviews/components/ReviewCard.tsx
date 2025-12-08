/**
 * ReviewCard Component
 * Display single review with helpful/unhelpful voting and report option
 * Task: T6-019
 */

import React, { useState } from 'react';
import '../styles/ReviewCard.css';

interface ReviewCardProps {
  review: {
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
  };
  onHelpful?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpful,
  onReport,
  isLoading = false,
}) => {
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(
    null
  );
  const [voting, setVoting] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleHelpful = async () => {
    if (userVote === 'helpful') return;
    setVoting(true);

    try {
      if (onHelpful) {
        await onHelpful(review.id);
        setUserVote('helpful');
      }
    } catch (err) {
      console.error('Error voting helpful:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);

    try {
      if (onReport) {
        await onReport(review.id, reportReason);
        setShowReportOptions(false);
        setReportReason('');
      }
    } catch (err) {
      console.error('Error reporting review:', err);
    } finally {
      setReporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return `il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'hier';
    } else if (diffDays < 30) {
      return `il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const hasPhotos = review.photos && review.photos.length > 0;

  return (
    <div className="review-card">
      {/* Header */}
      <div className="review-header">
        <div className="review-author-info">
          <div className="author-avatar">{review.author.charAt(0).toUpperCase()}</div>
          <div className="author-details">
            <div className="author-name">{review.author}</div>
            <div className="review-meta">
              <span className="review-date">{formatDate(review.createdAt)}</span>
              {review.verifiedPurchase && (
                <span className="verified-badge">✓ Achat vérifié</span>
              )}
              {review.wouldRecommend && (
                <span className="recommend-badge">👍 Recommande</span>
              )}
            </div>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="review-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= review.rating ? 'filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="rating-value">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Title and Comment */}
      <div className="review-content">
        <h4 className="review-title">{review.title}</h4>
        <p className="review-comment">{review.comment}</p>
      </div>

      {/* Photos */}
      {hasPhotos && (
        <div className="review-photos">
          <div className="photo-main">
            <img
              src={review.photos![currentPhotoIndex]}
              alt={`Customer review ${currentPhotoIndex + 1} of ${review.photos!.length}`}
              className="photo-image"
            />
          </div>
          {review.photos!.length > 1 && (
            <div className="photo-thumbnails">
              <button
                className="photo-nav-btn prev"
                onClick={() =>
                  setCurrentPhotoIndex(
                    (currentPhotoIndex - 1 + review.photos!.length) %
                      review.photos!.length
                  )
                }
              >
                ‹
              </button>
              {review.photos!.map((photo, index) => (
                <button
                  key={index}
                  className={`thumbnail ${
                    index === currentPhotoIndex ? 'active' : ''
                  }`}
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <img src={photo} alt={`Thumbnail ${index + 1}`} />
                </button>
              ))}
              <button
                className="photo-nav-btn next"
                onClick={() =>
                  setCurrentPhotoIndex(
                    (currentPhotoIndex + 1) % review.photos!.length
                  )
                }
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer - Helpful/Report */}
      <div className="review-footer">
        <div className="review-helpful">
          <span className="helpful-label">Cet avis vous a-t-il été utile?</span>
          <div className="helpful-buttons">
            <button
              className={`helpful-btn ${userVote === 'helpful' ? 'active' : ''}`}
              onClick={handleHelpful}
              disabled={voting || isLoading || userVote === 'helpful'}
              title="Cet avis m'a été utile"
            >
              👍 Oui ({review.helpful})
            </button>
            <button
              className={`helpful-btn ${userVote === 'not-helpful' ? 'active' : ''}`}
              disabled={voting || isLoading}
              title="Cet avis ne m'a pas été utile"
            >
              👎 Non ({review.notHelpful})
            </button>
          </div>
        </div>

        {/* Report Button */}
        <div className="review-actions">
          <button
            className="report-btn"
            onClick={() => setShowReportOptions(!showReportOptions)}
            title="Signaler cet avis"
          >
            🚩 Signaler
          </button>
        </div>
      </div>

      {/* Report Options */}
      {showReportOptions && (
        <div className="report-options">
          <div className="report-form">
            <label htmlFor={`report-reason-${review.id}`}>Motif du signalement:</label>
            <select
              id={`report-reason-${review.id}`}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="report-select"
            >
              <option value="">Choisir un motif...</option>
              <option value="spam">Spam ou publicité</option>
              <option value="offensive">Contenu offensant</option>
              <option value="false">Information fausse</option>
              <option value="personal">Attaque personnelle</option>
              <option value="other">Autre</option>
            </select>

            <div className="report-buttons">
              <button
                className="btn btn-danger btn-sm"
                onClick={handleReport}
                disabled={reporting || !reportReason}
              >
                {reporting ? 'Signalement...' : 'Signaler'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowReportOptions(false);
                  setReportReason('');
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
