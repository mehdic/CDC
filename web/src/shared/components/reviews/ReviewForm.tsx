/**
 * ReviewForm Component
 * Form to submit and edit product reviews
 * T3-048: Review Frontend Components
 */

import React, { useState } from 'react';
import { StarRating } from './StarRating';
import './ReviewForm.css';

interface ReviewFormProps {
  _productId?: string; // Unused parameter for future extensibility
  onSubmit?: (review: ReviewSubmission) => Promise<void>;
  onCancel?: () => void;
  initialReview?: ReviewSubmission;
  isEditing?: boolean;
}

export interface ReviewSubmission {
  rating: number;
  title: string;
  comment?: string;
  image_urls?: string[];
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  initialReview,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<ReviewSubmission>(
    initialReview || {
      rating: 0,
      title: '',
      comment: '',
      image_urls: [],
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Please select a rating between 1 and 5';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    if (formData.comment && formData.comment.length > 5000) {
      newErrors.comment = 'Comment must not exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: '' }));
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({ ...prev, title }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: '' }));
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const comment = e.target.value;
    setFormData((prev) => ({ ...prev, comment }));
    if (errors.comment) {
      setErrors((prev) => ({ ...prev, comment: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      if (onSubmit) {
        await onSubmit(formData);
        setSuccessMessage(
          isEditing ? 'Review updated successfully!' : 'Review submitted successfully!'
        );
        if (!isEditing) {
          setFormData({
            rating: 0,
            title: '',
            comment: '',
            image_urls: [],
          });
        }
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to submit review',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} data-testid="review-form">
      <div className="review-form__group">
        <label htmlFor="review-rating-input" className="review-form__label">Rating *</label>
        <div id="review-rating-input" data-testid="review-rating-input">
          <StarRating value={formData.rating} onChange={handleRatingChange} size="large" />
        </div>
        {errors.rating && <div className="review-form__error">{errors.rating}</div>}
      </div>

      <div className="review-form__group">
        <label className="review-form__label" htmlFor="review-title">
          Title *
        </label>
        <input
          id="review-title"
          type="text"
          className="review-form__input"
          placeholder="Summarize your experience"
          value={formData.title}
          onChange={handleTitleChange}
          maxLength={255}
          data-testid="review-title-input"
          disabled={isSubmitting}
        />
        <div className="review-form__counter">
          {formData.title.length}/255 characters
        </div>
        {errors.title && <div className="review-form__error">{errors.title}</div>}
      </div>

      <div className="review-form__group">
        <label className="review-form__label" htmlFor="review-comment">
          Comment (Optional)
        </label>
        <textarea
          id="review-comment"
          className="review-form__textarea"
          placeholder="Share more details about your experience"
          value={formData.comment}
          onChange={handleCommentChange}
          maxLength={5000}
          rows={5}
          data-testid="review-comment-input"
          disabled={isSubmitting}
        />
        <div className="review-form__counter">
          {(formData.comment || '').length}/5000 characters
        </div>
        {errors.comment && <div className="review-form__error">{errors.comment}</div>}
      </div>

      {errors.submit && (
        <div className="review-form__error review-form__error--alert">{errors.submit}</div>
      )}

      {successMessage && (
        <div className="review-form__success" data-testid="success-message">
          {successMessage}
        </div>
      )}

      <div className="review-form__actions">
        <button
          type="submit"
          className="review-form__button review-form__button--primary"
          disabled={isSubmitting}
          data-testid="review-submit"
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="review-form__button review-form__button--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
