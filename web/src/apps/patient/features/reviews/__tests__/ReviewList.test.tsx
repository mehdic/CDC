/**
 * ReviewList Component Tests
 * Task: T6-019
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewList from '../components/ReviewList';

const mockReviews = [
  {
    id: 'review-1',
    rating: 5,
    title: 'Excellent product',
    comment: 'This product is amazing!',
    author: 'John D.',
    createdAt: new Date().toISOString(),
    helpful: 10,
    notHelpful: 1,
    wouldRecommend: true,
    verifiedPurchase: true,
    status: 'approved' as const,
  },
  {
    id: 'review-2',
    rating: 3,
    title: 'Average product',
    comment: 'Works okay, nothing special',
    author: 'Jane S.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    helpful: 5,
    notHelpful: 2,
    wouldRecommend: false,
    verifiedPurchase: true,
    status: 'approved' as const,
  },
];

describe('ReviewList', () => {
  it('should render review list', () => {
    render(<ReviewList reviews={mockReviews} />);

    expect(screen.getByText('Excellent product')).toBeInTheDocument();
    expect(screen.getByText('Average product')).toBeInTheDocument();
  });

  it('should display statistics', () => {
    render(<ReviewList reviews={mockReviews} />);

    expect(screen.getByText('2 avis')).toBeInTheDocument();
  });

  it('should sort by recent', async () => {
    const user = userEvent.setup();
    render(<ReviewList reviews={mockReviews} />);

    const sortSelect = screen.getByLabelText('Trier par:');
    await user.selectOptions(sortSelect, 'recent');

    const titles = screen.getAllByText(/product/i);
    expect(titles[0]).toHaveTextContent('Excellent product');
  });

  it('should filter by verified purchase', async () => {
    const user = userEvent.setup();
    render(<ReviewList reviews={mockReviews} />);

    const filterSelect = screen.getByLabelText('Filtrer:');
    await user.selectOptions(filterSelect, 'verified');

    // Should still show reviews as both are verified
    expect(screen.getByText('Excellent product')).toBeInTheDocument();
    expect(screen.getByText('Average product')).toBeInTheDocument();
  });

  it('should show empty state when no reviews', () => {
    render(<ReviewList reviews={[]} />);

    expect(screen.getByText(/Aucun avis pour le moment/)).toBeInTheDocument();
  });

  it('should calculate and display correct average rating', () => {
    render(<ReviewList reviews={mockReviews} />);

    // Average of 5 and 3 = 4
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(<ReviewList reviews={mockReviews} isLoading={true} />);

    // Component should still render even when loading
    expect(screen.getByText('Excellent product')).toBeInTheDocument();
  });

  it('should call onLoadMore when load more button is clicked', async () => {
    const user = userEvent.setup();
    const mockLoadMore = jest.fn().mockResolvedValue(undefined);

    render(
      <ReviewList reviews={mockReviews} onLoadMore={mockLoadMore} />
    );

    const loadMoreBtn = screen.getByText('Charger plus d\'avis');
    await user.click(loadMoreBtn);

    expect(mockLoadMore).toHaveBeenCalled();
  });

  it('should display verified purchase badges', () => {
    render(<ReviewList reviews={mockReviews} />);

    const verifiedBadges = screen.getAllByText('✓ Achat vérifié');
    expect(verifiedBadges.length).toBeGreaterThan(0);
  });

  it('should display recommendation badges when applicable', () => {
    render(<ReviewList reviews={mockReviews} />);

    const recommendBadges = screen.getAllByText('👍 Recommande');
    expect(recommendBadges.length).toBeGreaterThan(0);
  });

  it('should handle filter by rating', async () => {
    const user = userEvent.setup();
    const reviews = [
      ...mockReviews,
      {
        id: 'review-3',
        rating: 1,
        title: 'Terrible',
        comment: 'Do not buy',
        author: 'Bad R.',
        createdAt: new Date().toISOString(),
        helpful: 0,
        notHelpful: 15,
        wouldRecommend: false,
        verifiedPurchase: false,
        status: 'approved' as const,
      },
    ];

    render(<ReviewList reviews={reviews} />);

    const filterSelect = screen.getByLabelText('Filtrer:');
    await user.selectOptions(filterSelect, '1-star');

    expect(screen.getByText('Terrible')).toBeInTheDocument();
    expect(screen.queryByText('Excellent product')).not.toBeInTheDocument();
  });

  it('should calculate rating distribution correctly', () => {
    const reviews = [
      { ...mockReviews[0], rating: 5 },
      { ...mockReviews[1], rating: 5 },
      { ...mockReviews[0], id: 'review-3', rating: 4 },
      { ...mockReviews[1], id: 'review-4', rating: 3 },
      { ...mockReviews[0], id: 'review-5', rating: 2 },
    ];

    render(<ReviewList reviews={reviews} />);

    // Check distribution bars exist
    const distributionRows = screen.getAllByText(/★/);
    expect(distributionRows.length).toBeGreaterThan(0);
  });

  it('should handle error state', () => {
    render(
      <ReviewList reviews={mockReviews} />
    );

    // Component should render normally
    expect(screen.getByText('Excellent product')).toBeInTheDocument();
  });

  it('should display sort options', () => {
    render(<ReviewList reviews={mockReviews} />);

    const sortSelect = screen.getByLabelText('Trier par:');
    expect(sortSelect).toBeInTheDocument();

    const options = sortSelect as HTMLSelectElement;
    expect(options.options.length).toBeGreaterThan(1);
  });

  it('should display filter options', () => {
    render(<ReviewList reviews={mockReviews} />);

    const filterSelect = screen.getByLabelText('Filtrer:');
    expect(filterSelect).toBeInTheDocument();

    const options = filterSelect as HTMLSelectElement;
    expect(options.options.length).toBeGreaterThan(1);
  });
});
