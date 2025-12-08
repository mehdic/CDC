/**
 * Recycling Management Component Tests
 * T5-052: Medication Return/Recycling Feature
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecyclingManagement } from '../components/RecyclingManagement';
import * as recyclingApi from '../services/recyclingApi';

// Mock the API
jest.mock('../services/recyclingApi');

const mockRecyclingApi = recyclingApi as jest.Mocked<typeof recyclingApi>;

describe('RecyclingManagement', () => {
  const mockProps = {
    pharmacyId: 'pharmacy-456',
    onRefresh: jest.fn(),
  };

  const mockRecyclingRequests = [
    {
      id: 'req-1',
      patientId: 'patient-1',
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
    },
    {
      id: 'req-2',
      patientId: 'patient-2',
      pharmacyId: 'pharmacy-456',
      medications: [
        {
          name: 'Ibuprofen',
          quantity: 20,
          unit: 'tablets',
          expiryDate: '2024-11-30',
        },
      ],
      status: 'assigned' as const,
      driverId: 'driver-1',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecyclingApi.getPharmacyRecyclingRequests.mockResolvedValue(mockRecyclingRequests);
  });

  it('should render the component with title', async () => {
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Gestion du recyclage des médicaments/i)).toBeInTheDocument();
    });
  });

  it('should load recycling requests on mount', async () => {
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(mockRecyclingApi.getPharmacyRecyclingRequests).toHaveBeenCalledWith('pharmacy-456');
    });
  });

  it('should display summary statistics', async () => {
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const headers = screen.getAllByText(/En attente/i);
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  it('should display requests in tabs', async () => {
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/En attente \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Assignées \(1\)/i)).toBeInTheDocument();
    });
  });

  it('should show pending requests in first tab', async () => {
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const cells = screen.getAllByText(/req-1/i);
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it('should display error message on API failure', async () => {
    const errorMessage = 'Erreur lors du chargement des demandes';
    mockRecyclingApi.getPharmacyRecyclingRequests.mockRejectedValue(new Error(errorMessage));

    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Assignées \(1\)/i)).toBeInTheDocument();
    });

    const assignedTab = screen.getByText(/Assignées \(1\)/i);
    await user.click(assignedTab);

    await waitFor(() => {
      const cells = screen.getAllByText(/req-2/i);
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it('should refresh requests when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(mockRecyclingApi.getPharmacyRecyclingRequests).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByText(/Actualiser/i);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockRecyclingApi.getPharmacyRecyclingRequests).toHaveBeenCalledTimes(2);
    });
  });

  it('should display loading state when isLoading is true', () => {
    mockRecyclingApi.getPharmacyRecyclingRequests.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<RecyclingManagement {...mockProps} isLoading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display empty message when no requests exist', async () => {
    mockRecyclingApi.getPharmacyRecyclingRequests.mockResolvedValue([]);

    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Aucune demande en attente/i)).toBeInTheDocument();
    });
  });

  it('should open assign driver dialog when assign button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const assignButtons = screen.getAllByText(/Assigner/i);
      expect(assignButtons.length).toBeGreaterThan(0);
    });

    const assignButtons = screen.getAllByText(/Assigner/i);
    await user.click(assignButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Assigner un conducteur/i)).toBeInTheDocument();
    });
  });

  it('should require driver ID before confirming assignment', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const assignButtons = screen.getAllByText(/Assigner/i);
      expect(assignButtons.length).toBeGreaterThan(0);
    });

    const assignButtons = screen.getAllByText(/Assigner/i);
    await user.click(assignButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Entrez l'ID du conducteur/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/Confirmer/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Veuillez entrer un ID de conducteur/i)).toBeInTheDocument();
    });
  });


  it('should expand request details when expand button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const expandButtons = screen.getAllByRole('button').filter((btn) => {
        const icon = btn.querySelector('svg');
        return icon && icon.getAttribute('data-testid') === 'ExpandMoreIcon';
      });
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    const expandButtons = screen.getAllByRole('button').filter((btn) => {
      const icon = btn.querySelector('svg');
      return icon && icon.getAttribute('data-testid') === 'ExpandMoreIcon';
    });

    if (expandButtons.length > 0) {
      await user.click(expandButtons[0]);
    }

    await waitFor(() => {
      expect(screen.getByText(/Détails de la demande/i)).toBeInTheDocument();
    });
  });

  it('should display medication details in expanded view', async () => {
    const user = userEvent.setup();
    render(<RecyclingManagement {...mockProps} />);

    await waitFor(() => {
      const expandButtons = screen.getAllByRole('button').filter((btn) => {
        const icon = btn.querySelector('svg');
        return icon && icon.getAttribute('data-testid') === 'ExpandMoreIcon';
      });
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    const expandButtons = screen.getAllByRole('button').filter((btn) => {
      const icon = btn.querySelector('svg');
      return icon && icon.getAttribute('data-testid') === 'ExpandMoreIcon';
    });

    if (expandButtons.length > 0) {
      await user.click(expandButtons[0]);
    }

    await waitFor(() => {
      const medCells = screen.getAllByText(/Paracétamol/i);
      expect(medCells.length).toBeGreaterThan(0);
    });
  });
});
