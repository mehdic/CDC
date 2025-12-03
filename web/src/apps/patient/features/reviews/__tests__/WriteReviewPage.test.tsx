/**
 * WriteReviewPage Component Tests
 * Task: T6-019
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WriteReviewPage from '../pages/WriteReviewPage';

describe('WriteReviewPage', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render the review form', () => {
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Écrire un avis')).toBeInTheDocument();
    expect(screen.getByLabelText('Votre évaluation')).toBeInTheDocument();
    expect(screen.getByLabelText('Titre de l\'avis')).toBeInTheDocument();
    expect(screen.getByLabelText('Votre avis')).toBeInTheDocument();
  });

  it('should display product name when provided', () => {
    render(
      <WriteReviewPage productName="Paracétamol 500mg" onSubmit={mockOnSubmit} />
    );

    expect(screen.getByText(/Paracétamol 500mg/)).toBeInTheDocument();
  });

  it('should allow rating selection', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );

    await user.click(starButtons[3]); // Click 4 stars

    expect(screen.getByText('4 étoiles')).toBeInTheDocument();
  });

  it('should not allow form submission without rating', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByPlaceholderText(/Résumez votre expérience/);
    const commentInput = screen.getByPlaceholderText(/Partagez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.type(titleInput, 'Great product');
    await user.type(commentInput, 'This product is amazing');

    await user.click(submitButton);

    expect(screen.getByText(/Veuillez sélectionner une évaluation/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not allow form submission without title', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const commentInput = screen.getByPlaceholderText(/Partagez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[3]); // 4 stars
    await user.type(commentInput, 'This product is amazing');
    await user.click(submitButton);

    expect(screen.getByText(/Le titre est obligatoire/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not allow form submission without comment', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const titleInput = screen.getByPlaceholderText(/Résumez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[3]); // 4 stars
    await user.type(titleInput, 'Great product');
    await user.click(submitButton);

    expect(screen.getByText(/Le commentaire est obligatoire/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const titleInput = screen.getByPlaceholderText(/Résumez votre expérience/);
    const commentInput = screen.getByPlaceholderText(/Partagez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[4]); // 5 stars
    await user.type(titleInput, 'Excellent product');
    await user.type(commentInput, 'This product exceeded my expectations');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
          title: 'Excellent product',
          comment: 'This product exceeded my expectations',
          wouldRecommend: true,
        })
      );
    });
  });

  it('should display success message after submission', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const titleInput = screen.getByPlaceholderText(/Résumez votre expérience/);
    const commentInput = screen.getByPlaceholderText(/Partagez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[3]); // 4 stars
    await user.type(titleInput, 'Good product');
    await user.type(commentInput, 'Works as expected');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Merci pour votre avis/)
      ).toBeInTheDocument();
    });
  });

  it('should handle recommendation checkbox', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const recommendCheckbox = screen.getByRole('checkbox');
    expect(recommendCheckbox).toBeChecked();

    await user.click(recommendCheckbox);
    expect(recommendCheckbox).not.toBeChecked();
  });

  it('should limit review comment length', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const commentInput = screen.getByPlaceholderText(
      /Partagez votre expérience/
    ) as HTMLTextAreaElement;

    expect(commentInput.maxLength).toBe(1000);
  });

  it('should limit review title length', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByPlaceholderText(
      /Résumez votre expérience/
    ) as HTMLInputElement;

    expect(titleInput.maxLength).toBe(100);
  });

  it('should display loading state during submission', async () => {
    const user = userEvent.setup();
    const slowSubmit = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<WriteReviewPage onSubmit={slowSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const titleInput = screen.getByPlaceholderText(/Résumez votre expérience/);
    const commentInput = screen.getByPlaceholderText(/Partagez votre expérience/);
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[3]); // 4 stars
    await user.type(titleInput, 'Test');
    await user.type(commentInput, 'Test comment');
    await user.click(submitButton);

    expect(screen.getByText('Envoi en cours...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Envoi en cours...')).not.toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<WriteReviewPage onSubmit={mockOnSubmit} />);

    const starButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('star-button')
    );
    const titleInput = screen.getByPlaceholderText(
      /Résumez votre expérience/
    ) as HTMLInputElement;
    const commentInput = screen.getByPlaceholderText(
      /Partagez votre expérience/
    ) as HTMLTextAreaElement;
    const submitButton = screen.getByText('Publier mon avis');

    await user.click(starButtons[3]); // 4 stars
    await user.type(titleInput, 'Test title');
    await user.type(commentInput, 'Test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(commentInput.value).toBe('');
    });
  });
});
