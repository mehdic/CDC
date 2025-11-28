/**
 * StarRating Component
 * Display and interactive star rating for reviews
 * T3-048: Review Frontend Components
 */

import React, { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
  value?: number; // 1-5
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  readOnly = false,
  size = 'medium',
  showLabel = true,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || value;
  const sizeClass = `star-rating--${size}`;
  const readOnlyClass = readOnly ? 'star-rating--readonly' : '';

  const getRatingLabel = (rating: number): string => {
    if (rating === 0) return 'No rating';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return '';
  };

  return (
    <div className={`star-rating ${sizeClass} ${readOnlyClass}`} data-testid="star-rating">
      <div className="star-rating__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`star-rating__star ${star <= displayRating ? 'star-rating__star--filled' : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            data-testid={`star-rating-${star}`}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="star-rating__label" data-testid="rating-label">
          {getRatingLabel(displayRating)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
