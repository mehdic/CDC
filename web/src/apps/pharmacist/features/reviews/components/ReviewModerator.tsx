/**
 * ReviewModerator Component
 * Pharmacist component for approving/rejecting reviews and responding
 * Task: T6-019
 */

import React, { useState } from 'react';
import '../styles/ReviewModerator.css';

interface ReviewModeratorProps {
  review: {
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
  };
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onResponse?: (response: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReviewModerator: React.FC<ReviewModeratorProps> = ({
  review,
  onApprove,
  onReject,
  onResponse,
  isLoading = false,
}) => {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [responseText, setResponseText] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);

    try {
      if (onApprove) {
        await onApprove();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'approbation');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Veuillez spécifier un motif de rejet');
      return;
    }

    setRejecting(true);
    setError(null);

    try {
      if (onReject) {
        await onReject();
        setSuccess(true);
        setShowRejectReason(false);
        setRejectReason('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet');
    } finally {
      setRejecting(false);
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) {
      setError('Veuillez saisir une réponse');
      return;
    }

    setResponding(true);
    setError(null);

    try {
      if (onResponse) {
        await onResponse(responseText);
        setSuccess(true);
        setResponseText('');
        setShowResponse(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la réponse');
    } finally {
      setResponding(false);
    }
  };

  const flagsInappropriate = review.rating <= 1 && review.comment.length < 20;

  return (
    <div className="review-moderator-container">
      <div className="moderator-card">
        {/* Review Content */}
        <div className="review-content-section">
          <div className="content-header">
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
              <span className="rating-value">{review.rating}/5</span>
            </div>

            <div className="review-title-section">
              <h2>{review.title}</h2>
              <p className="review-author">
                Par <strong>{review.author}</strong> le{' '}
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Product/Service Info */}
          {review.productName && (
            <div className="review-product">
              <strong>Produit/Service:</strong> {review.productName}
              {review.serviceType && ` (${review.serviceType})`}
            </div>
          )}

          {/* Comment */}
          <div className="review-text">
            {review.comment}
          </div>

          {/* Recommendation Status */}
          <div className="review-meta">
            {review.wouldRecommend && (
              <span className="recommend-badge">👍 Client recommande</span>
            )}
            {review.rating >= 4 && (
              <span className="positive-badge">✓ Avis positif</span>
            )}
            {review.rating <= 2 && (
              <span className="negative-badge">⚠️ Avis critique</span>
            )}
          </div>

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="review-photos">
              <p className="photos-label">Photos attachées:</p>
              <div className="photos-grid">
                {review.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="photo-thumbnail"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Flags */}
        {flagsInappropriate && (
          <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <span>Cet avis pourrait être inapproprié (note basse + peu de détails)</span>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            Opération effectuée avec succès
          </div>
        )}

        {/* Actions */}
        {review.status === 'pending' && (
          <div className="moderator-actions">
            <div className="action-buttons">
              <button
                onClick={handleApprove}
                disabled={approving || isLoading}
                className="btn btn-success btn-approve"
              >
                {approving ? 'Approbation...' : '✓ Approuver'}
              </button>

              <button
                onClick={() => setShowRejectReason(!showRejectReason)}
                className="btn btn-danger btn-reject"
              >
                ✕ Rejeter
              </button>
            </div>

            {/* Reject Reason */}
            {showRejectReason && (
              <div className="reject-reason-form">
                <label htmlFor="reject-reason">Motif du rejet:</label>
                <select
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="form-select"
                >
                  <option value="">Choisir un motif...</option>
                  <option value="spam">Spam ou publicité</option>
                  <option value="offensive">Contenu offensant</option>
                  <option value="false">Information fausse</option>
                  <option value="personal">Attaque personnelle</option>
                  <option value="off_topic">Hors sujet</option>
                  <option value="other">Autre</option>
                </select>

                <textarea
                  placeholder="Notes supplémentaires (optionnel)..."
                  className="form-textarea"
                  rows={3}
                />

                <div className="reject-buttons">
                  <button
                    onClick={handleReject}
                    disabled={rejecting || !rejectReason}
                    className="btn btn-danger btn-confirm"
                  >
                    {rejecting ? 'Rejet...' : 'Confirmer le rejet'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason('');
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Response Section */}
        <div className="response-section">
          <div className="response-header">
            <h3>Répondre à cet avis</h3>
            <small>Répondez pour montrer que vous écoutez vos clients</small>
          </div>

          {!showResponse ? (
            <button
              onClick={() => setShowResponse(true)}
              className="btn btn-secondary btn-add-response"
            >
              💬 Ajouter une réponse
            </button>
          ) : (
            <div className="response-form">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Saisissez votre réponse..."
                maxLength={500}
                rows={4}
                className="form-textarea"
              />
              <small>{responseText.length}/500</small>

              <div className="response-buttons">
                <button
                  onClick={handleResponse}
                  disabled={responding || !responseText.trim()}
                  className="btn btn-primary"
                >
                  {responding ? 'Envoi...' : 'Envoyer la réponse'}
                </button>
                <button
                  onClick={() => {
                    setShowResponse(false);
                    setResponseText('');
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Moderation Status */}
        <div className="moderation-status">
          <div className="status-section">
            <p className="status-label">Statut de modération:</p>
            <span className={`status-badge status-${review.status}`}>
              {review.status === 'pending'
                ? 'En attente de modération'
                : review.status === 'approved'
                ? 'Approuvé'
                : 'Rejeté'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModerator;
