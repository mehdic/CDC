/**
 * Recycling Request Form Component Tests
 * T5-052: Medication Return/Recycling Feature
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecyclingRequestForm } from '../components/RecyclingRequestForm';
import * as recyclingApi from '../services/recyclingApi';

// Mock the API
jest.mock('../services/recyclingApi');

const mockRecyclingApi = recyclingApi as jest.Mocked<typeof recyclingApi>;

describe('RecyclingRequestForm', () => {
  const mockProps = {
    patientId: 'patient-123',
    pharmacyId: 'pharmacy-456',
    onSuccess: jest.fn(),
  };

  const mockRecyclingRequest = {
    id: 'req-123',
    patientId: 'patient-123',
    pharmacyId: 'pharmacy-456',
    medications: [
      {
        name: 'Paracétamol',
        quantity: 10,
        unit: 'tablets',
        expiryDate: '2024-12-31',
      },
    ],
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with title', () => {
    render(<RecyclingRequestForm {...mockProps} />);

    expect(screen.getByText(/Recycler vos médicaments/i)).toBeInTheDocument();
  });

  it('should show initial empty state with no medications', () => {
    render(<RecyclingRequestForm {...mockProps} />);

    expect(screen.getByText(/Aucun médicament ajouté/i)).toBeInTheDocument();
  });

  it('should open medication dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });
  });

  it('should require at least one medication before submitting', () => {
    render(<RecyclingRequestForm {...mockProps} />);

    const submitButton = screen.getByText(/Soumettre la demande/i);
    expect(submitButton).toBeDisabled();
  });

  it('should display error message when required medication fields are missing', async () => {
    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });

    // Click confirm without filling required fields
    const dialogConfirmButtons = screen.getAllByText(/Ajouter/i);
    const dialogConfirm = dialogConfirmButtons[dialogConfirmButtons.length - 1];
    await user.click(dialogConfirm);

    await waitFor(() => {
      expect(screen.getByText(/Veuillez remplir tous les champs obligatoires/i)).toBeInTheDocument();
    });
  });

  it('should call API when form is submitted with valid data', async () => {
    mockRecyclingApi.createRecyclingRequest.mockResolvedValue(mockRecyclingRequest);

    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    // Add medication
    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/ex: Paracétamol/i);
    const quantityInput = screen.getByLabelText(/Quantité/i);
    const dateInput = screen.getByLabelText(/Date d'expiration/i);

    await user.type(nameInput, 'Paracétamol');
    await user.type(quantityInput, '10');
    await user.type(dateInput, '2024-12-31');

    const dialogConfirmButtons = screen.getAllByText(/Ajouter/i);
    const dialogConfirm = dialogConfirmButtons[dialogConfirmButtons.length - 1];
    await user.click(dialogConfirm);

    // Submit form
    await waitFor(() => {
      const submitButton = screen.getByText(/Soumettre la demande/i);
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByText(/Soumettre la demande/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRecyclingApi.createRecyclingRequest).toHaveBeenCalled();
    });
  });

  it('should call onSuccess callback after successful submission', async () => {
    mockRecyclingApi.createRecyclingRequest.mockResolvedValue(mockRecyclingRequest);

    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} onSuccess={onSuccess} />);

    // Add medication
    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/ex: Paracétamol/i);
    const quantityInput = screen.getByLabelText(/Quantité/i);
    const dateInput = screen.getByLabelText(/Date d'expiration/i);

    await user.type(nameInput, 'Paracétamol');
    await user.type(quantityInput, '10');
    await user.type(dateInput, '2024-12-31');

    const dialogConfirmButtons = screen.getAllByText(/Ajouter/i);
    const dialogConfirm = dialogConfirmButtons[dialogConfirmButtons.length - 1];
    await user.click(dialogConfirm);

    // Submit form
    await waitFor(() => {
      const submitButton = screen.getByText(/Soumettre la demande/i);
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByText(/Soumettre la demande/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockRecyclingRequest);
    }, { timeout: 3000 });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Erreur lors de la création de la demande';
    mockRecyclingApi.createRecyclingRequest.mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    // Add medication
    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/ex: Paracétamol/i);
    const quantityInput = screen.getByLabelText(/Quantité/i);
    const dateInput = screen.getByLabelText(/Date d'expiration/i);

    await user.type(nameInput, 'Paracétamol');
    await user.type(quantityInput, '10');
    await user.type(dateInput, '2024-12-31');

    const dialogConfirmButtons = screen.getAllByText(/Ajouter/i);
    const dialogConfirm = dialogConfirmButtons[dialogConfirmButtons.length - 1];
    await user.click(dialogConfirm);

    // Submit form
    await waitFor(() => {
      const submitButton = screen.getByText(/Soumettre la demande/i);
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByText(/Soumettre la demande/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should remove medication from list', async () => {
    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    // Add medication
    const addButtons = screen.getAllByText(/Ajouter un médicament/i);
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ex: Paracétamol/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/ex: Paracétamol/i);
    const quantityInput = screen.getByLabelText(/Quantité/i);
    const dateInput = screen.getByLabelText(/Date d'expiration/i);

    await user.type(nameInput, 'Paracétamol');
    await user.type(quantityInput, '10');
    await user.type(dateInput, '2024-12-31');

    const dialogConfirmButtons = screen.getAllByText(/Ajouter/i);
    const dialogConfirm = dialogConfirmButtons[dialogConfirmButtons.length - 1];
    await user.click(dialogConfirm);

    await waitFor(() => {
      const cells = screen.getAllByText(/Paracétamol/i);
      expect(cells.length).toBeGreaterThan(0);
    });

    // Delete medication
    const deleteButtons = screen.getAllByTitle(/Supprimer/i);
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
    }

    await waitFor(() => {
      expect(screen.getByText(/Aucun médicament ajouté/i)).toBeInTheDocument();
    });
  });

  it('should fill notes field', async () => {
    const user = userEvent.setup();
    render(<RecyclingRequestForm {...mockProps} />);

    const notesInput = screen.getByPlaceholderText(/Ajoutez des informations supplémentaires/i);
    await user.type(notesInput, 'Test notes');

    expect(notesInput).toHaveValue('Test notes');
  });

});
