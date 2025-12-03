/**
 * Unit Tests for NurseDashboard Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NurseDashboard from '../components/NurseDashboard';
import * as nurseApi from '../services/nurseApi';
import * as useOrdersHook from '../hooks/useOrders';

jest.mock('../services/nurseApi');
jest.mock('../hooks/useOrders');

const mockStats = {
  totalPatients: 25,
  pendingOrders: 5,
  inTransitDeliveries: 3,
  todayDeliveries: 8,
  urgentOrders: 2,
};

const mockOrders = [
  {
    id: 'order-1',
    patientName: 'Jean Dupont',
    room: '101',
    medications: [{ drugName: 'Paracétamol', dosage: '500mg', quantity: 1, instructions: '' }],
    urgency: 'routine' as const,
    status: 'pending' as const,
    pharmacyId: 'pharmacy-1',
    pharmacyName: 'Pharmacie Centrale',
    createdBy: 'nurse-1',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
];

describe('NurseDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (nurseApi.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);
    (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
      orders: mockOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders dashboard title', async () => {
    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord infirmière')).toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total patients
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending orders
      expect(screen.getByText('3')).toBeInTheDocument(); // In transit
      expect(screen.getByText('2')).toBeInTheDocument(); // Urgent orders
    });
  });

  it('shows pending orders list', async () => {
    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText(/Chambre 101/)).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', async () => {
    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nouvelle commande')).toBeInTheDocument();
      expect(screen.getByText('Voir patients')).toBeInTheDocument();
      expect(screen.getByText('Suivi des livraisons')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
      orders: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (nurseApi.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <NurseDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
