/**
 * Delivery Rating Component
 * T8-042: Patient Delivery Tracking
 * Allows patients to rate delivery service
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { Star as StarIcon, Send as SendIcon } from '@mui/icons-material';
import type { DeliveryRating as DeliveryRatingType } from '../types/tracking';

/**
 * Props
 */
export interface DeliveryRatingProps {
  deliveryId: string;
  driverId: string;
  existingRating?: DeliveryRatingType;
  onSubmit: (rating: Omit<DeliveryRatingType, 'timestamp' | 'driver_id'>) => Promise<void>;
}

/**
 * Delivery Rating Component
 */
export const DeliveryRating: React.FC<DeliveryRatingProps> = ({
  deliveryId,
  driverId,
  existingRating,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(existingRating?.rating || 0);
  const [comment, setComment] = useState<string>(existingRating?.comment || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(!!existingRating);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rating,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('[DeliveryRating] Submit error:', err);
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <StarIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Thank You for Your Feedback!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your rating helps us improve our delivery service
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Rating value={rating} readOnly size="large" />
              {comment && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  "{comment}"
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Rate Your Delivery
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          How was your delivery experience?
        </Typography>

        <Box sx={{ my: 3, textAlign: 'center' }}>
          <Rating
            name="delivery-rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue || 0);
              setError(null);
            }}
            size="large"
            precision={1}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {rating === 0 && 'Select a rating'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Comments (Optional)"
          placeholder="Share more about your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitting}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </CardContent>
    </Card>
  );
};
