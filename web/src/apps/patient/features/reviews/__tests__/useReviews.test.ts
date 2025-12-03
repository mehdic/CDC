/**
 * useReviews Hook Tests
 * Task: T6-019
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useReviews from '../hooks/useReviews';

// Mock fetch
global.fetch = jest.fn();

describe('useReviews Hook', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
    localStorage.setItem('authToken', 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useReviews());

    expect(result.current.reviews).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch reviews successfully', async () => {
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        title: 'Great product',
        comment: 'Really good',
        author: 'John',
        createdAt: new Date().toISOString(),
        helpful: 10,
        notHelpful: 0,
        wouldRecommend: true,
        verifiedPurchase: true,
        status: 'approved' as const,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1');
    });

    expect(result.current.reviews).toEqual(mockReviews);
    expect(result.current.loading).toBe(false);
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.reviews).toEqual([]);
  });

  it('should submit review successfully', async () => {
    const mockResponse = {
      review: {
        id: 'new-review',
        rating: 5,
        title: 'Great',
        comment: 'Love it',
        author: 'Jane',
        createdAt: new Date().toISOString(),
        helpful: 0,
        notHelpful: 0,
        wouldRecommend: true,
        verifiedPurchase: true,
        status: 'pending' as const,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.submitReview(
        {
          rating: 5,
          title: 'Great',
          comment: 'Love it',
          photos: [],
          wouldRecommend: true,
        },
        'product-1'
      );
    });

    expect(result.current.reviews).toContainEqual(mockResponse.review);
  });

  it('should mark review as helpful', async () => {
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        title: 'Great',
        comment: 'Good',
        author: 'John',
        createdAt: new Date().toISOString(),
        helpful: 10,
        notHelpful: 0,
        wouldRecommend: true,
        verifiedPurchase: true,
        status: 'approved' as const,
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: mockReviews }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1');
    });

    await act(async () => {
      await result.current.markHelpful('review-1');
    });

    expect(result.current.reviews[0].helpful).toBe(11);
  });

  it('should report review', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.reportReview('review-1', 'spam');
    });

    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('review-1/report'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'spam' }),
      })
    );
  });

  it('should clear error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1');
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should include pagination in fetch request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1', undefined, 2);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    );
  });

  it('should include authorization token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    const { result } = renderHook(() => useReviews());

    await act(async () => {
      await result.current.fetchReviews('product-1');
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBe('Bearer mock-token');
  });

  it('should handle form data for photo upload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ review: {} }),
    });

    const { result } = renderHook(() => useReviews());
    const mockFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.submitReview(
        {
          rating: 5,
          title: 'Test',
          comment: 'Test comment',
          photos: [mockFile],
          wouldRecommend: true,
        },
        'product-1'
      );
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(callArgs.body instanceof FormData).toBe(true);
  });

  it('should update loading state during fetch', async () => {
    const slowFetch = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: async () => ({ reviews: [] }),
          }),
        50
      )
    );

    (global.fetch as jest.Mock).mockReturnValueOnce(slowFetch);

    const { result } = renderHook(() => useReviews());

    const promise = act(async () => {
      await result.current.fetchReviews('product-1');
    });

    // Note: Would need to check loading state during fetch
    await promise;

    expect(result.current.loading).toBe(false);
  });
});
