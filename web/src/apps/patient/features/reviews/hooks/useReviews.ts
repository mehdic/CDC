/**
 * useReviews Hook
 * API integration for reviews management
 * Task: T6-019
 */

import { useState, useCallback } from 'react';

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

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  photos: File[];
  wouldRecommend: boolean;
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  fetchReviews: (
    productId?: string,
    pharmacyId?: string,
    page?: number
  ) => Promise<void>;
  submitReview: (formData: ReviewFormData, productId?: string) => Promise<void>;
  markHelpful: (reviewId: string) => Promise<void>;
  reportReview: (reviewId: string, reason: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const useReviews = (): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (productId?: string, pharmacyId?: string, page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = `${API_BASE_URL}/reviews`;
        const params = new URLSearchParams();

        if (productId) {
          params.append('productId', productId);
        }

        if (pharmacyId) {
          params.append('pharmacyId', pharmacyId);
        }

        params.append('page', page.toString());
        params.append('limit', '10');

        const queryString = params.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des avis');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitReview = useCallback(
    async (formData: ReviewFormData, productId?: string) => {
      setLoading(true);
      setError(null);

      try {
        const formDataObj = new FormData();
        formDataObj.append('rating', formData.rating.toString());
        formDataObj.append('title', formData.title);
        formDataObj.append('comment', formData.comment);
        formDataObj.append('wouldRecommend', formData.wouldRecommend.toString());

        if (productId) {
          formDataObj.append('productId', productId);
        }

        // Append photos
        formData.photos.forEach((photo, index) => {
          formDataObj.append(`photo_${index}`, photo);
        });

        const response = await fetch(`${API_BASE_URL}/reviews/product`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formDataObj,
        });

        if (!response.ok) {
          throw new Error(`Failed to submit review: ${response.statusText}`);
        }

        const data = await response.json();
        // Add new review to the list (it will be in pending status)
        setReviews([data.review, ...reviews]);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la soumission de l\'avis');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reviews]
  );

  const markHelpful = useCallback(async (reviewId: string) => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark review as helpful: ${response.statusText}`);
      }

      // Update review in local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? { ...review, helpful: review.helpful + 1 }
            : review
        )
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors du vote');
      console.error('Error marking review as helpful:', err);
      throw err;
    }
  }, []);

  const reportReview = useCallback(
    async (reviewId: string, reason: string) => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
          throw new Error(`Failed to report review: ${response.statusText}`);
        }

        // Success - show feedback to user
      } catch (err: any) {
        setError(err.message || 'Erreur lors du signalement');
        console.error('Error reporting review:', err);
        throw err;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    submitReview,
    markHelpful,
    reportReview,
    clearError,
  };
};

export default useReviews;
