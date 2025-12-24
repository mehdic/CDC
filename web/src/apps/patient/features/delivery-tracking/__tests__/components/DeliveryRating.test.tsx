/**
 * DeliveryRating Component Tests
 * T8-042: Patient Delivery Tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryRating } from '../../components/DeliveryRating';

describe('DeliveryRating', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render rating form', () => {
    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/Rate Your Delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a rating/i)).toBeInTheDocument();
  });

  it('should allow user to select rating', () => {
    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]); // 5 stars

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('should allow user to add comment', () => {
    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    const commentField = screen.getByPlaceholderText(/Share more about your experience/i);
    fireEvent.change(commentField, { target: { value: 'Great service!' } });

    expect(commentField).toHaveValue('Great service!');
  });

  it('should show error when submitting without rating', () => {
    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText(/Submit Rating/i);
    expect(submitButton).toBeDisabled();
  });

  it('should submit rating successfully', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    // Select rating
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]); // 5 stars

    // Add comment
    const commentField = screen.getByPlaceholderText(/Share more about your experience/i);
    fireEvent.change(commentField, { target: { value: 'Excellent!' } });

    // Submit
    const submitButton = screen.getByText(/Submit Rating/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Excellent!',
      });
    });
  });

  it('should display thank you message after submission', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        onSubmit={mockOnSubmit}
      />
    );

    // Select rating and submit
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[3]); // 4 stars
    const submitButton = screen.getByText(/Submit Rating/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thank You for Your Feedback!/i)).toBeInTheDocument();
    });
  });

  it('should display existing rating', () => {
    const existingRating = {
      rating: 5,
      comment: 'Great service!',
      timestamp: new Date().toISOString(),
      driver_id: 'driver-456',
    };

    render(
      <DeliveryRating
        deliveryId="delivery-123"
        driverId="driver-456"
        existingRating={existingRating}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/Thank You for Your Feedback!/i)).toBeInTheDocument();
    expect(screen.getByText('"Great service!"')).toBeInTheDocument();
  });
});
