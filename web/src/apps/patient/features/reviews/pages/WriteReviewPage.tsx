/**
 * WriteReviewPage Component
 * Patient component for writing product and service reviews
 * Task: T6-019
 */

import React, { useState } from 'react';
import '../styles/WriteReviewPage.css';

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  photos: File[];
  wouldRecommend: boolean;
}

interface WriteReviewPageProps {
  productId?: string;
  productName?: string;
  serviceType?: 'product' | 'delivery' | 'teleconsultation' | 'pharmacy';
  referenceId?: string;
  onSubmit?: (reviewData: ReviewFormData) => Promise<void>;
  isLoading?: boolean;
}

export const WriteReviewPage: React.FC<WriteReviewPageProps> = ({
  productId,
  productName,
  serviceType = 'product',
  referenceId,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    comment: '',
    photos: [],
    wouldRecommend: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3); // Limit to 3 photos
      setFormData({
        ...formData,
        photos: [...formData.photos, ...newFiles].slice(0, 3),
      });
    }
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  const handleRecommendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, wouldRecommend: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.rating === 0) {
      setError('Veuillez sélectionner une évaluation');
      return;
    }

    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.comment.trim()) {
      setError('Le commentaire est obligatoire');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(formData);
        setSuccess(true);
        setFormData({
          rating: 0,
          title: '',
          comment: '',
          photos: [],
          wouldRecommend: true,
        });

        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission de l\'avis');
    }
  };

  const getServiceLabel = () => {
    const labels: Record<string, string> = {
      product: 'Produit',
      delivery: 'Livraison',
      teleconsultation: 'Téléconsultation',
      pharmacy: 'Pharmacie',
    };
    return labels[serviceType] || 'Produit';
  };

  return (
    <div className="write-review-page-container">
      <div className="write-review-card">
        <div className="review-header">
          <h1>Écrire un avis</h1>
          {productName && (
            <p className="review-subtitle">
              {getServiceLabel()}: <strong>{productName}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            Merci pour votre avis! Il sera publié après modération.
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form">
          {/* Star Rating */}
          <div className="form-group">
            <label htmlFor="rating" className="form-label">Votre évaluation</label>
            <div className="star-rating" id="rating" role="group" aria-label="Votre évaluation">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${
                    star <= (hoveredRating || formData.rating) ? 'active' : ''
                  }`}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  title={`${star} étoile${star > 1 ? 's' : ''}`}
                  aria-pressed={star <= (hoveredRating || formData.rating)}
                >
                  ★
                </button>
              ))}
            </div>
            {formData.rating > 0 && (
              <span className="rating-text">
                {formData.rating} étoile{formData.rating > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Review Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Titre de l'avis
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="Résumez votre expérience en quelques mots"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={100}
              disabled={isLoading}
              className="form-input"
            />
            <small>{formData.title.length}/100</small>
          </div>

          {/* Review Comment */}
          <div className="form-group">
            <label htmlFor="comment" className="form-label">
              Votre avis
            </label>
            <textarea
              id="comment"
              name="comment"
              placeholder="Partagez votre expérience détaillée..."
              value={formData.comment}
              onChange={handleInputChange}
              maxLength={1000}
              rows={6}
              disabled={isLoading}
              className="form-textarea"
            />
            <small>{formData.comment.length}/1000</small>
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label htmlFor="photo-upload-group" className="form-label">
              Ajouter des photos (optionnel, max 3)
            </label>
            <div className="photo-upload">
              <label htmlFor="photos" className="upload-label">
                <span className="upload-icon">📷</span>
                <span className="upload-text">
                  Cliquez pour ajouter des photos
                </span>
              </label>
              <input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isLoading || formData.photos.length >= 3}
                className="photo-input"
              />
            </div>

            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="photo-preview">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="photo-image"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="photo-remove-btn"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="form-group checkbox-group">
            <label htmlFor="recommend" className="checkbox-label">
              <input
                id="recommend"
                type="checkbox"
                checked={formData.wouldRecommend}
                onChange={handleRecommendChange}
                disabled={isLoading}
              />
              <span>Je recommande ce {getServiceLabel().toLowerCase()}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || formData.rating === 0}
            className="btn btn-primary btn-submit"
          >
            {isLoading ? 'Envoi en cours...' : 'Publier mon avis'}
          </button>
        </form>

        {/* Help Text */}
        <div className="review-help">
          <h4>Conseils pour un bon avis:</h4>
          <ul>
            <li>Soyez honnête et constructif</li>
            <li>Partagez votre expérience personnelle</li>
            <li>Évitez les contenus offensants ou publicitaires</li>
            <li>Les avis détaillés sont plus utiles aux autres clients</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WriteReviewPage;
