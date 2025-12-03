/**
 * Unit Tests for NurseDashboard Component
 */

import { render, screen, waitFor } from '../../../shared/utils/test-utils';
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
    render(<NurseDashboard />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord infirmière')).toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    render(<NurseDashboard />, { withRouter: true });

    await waitFor(() => {
      // Use getAllByText and filter to avoid ambiguity
      const allTwentyFive = screen.getAllByText('25');
      expect(allTwentyFive.length).toBeGreaterThan(0); // Total patients

      const allFive = screen.getAllByText('5');
      expect(allFive.length).toBeGreaterThan(0); // Pending orders

      const allThree = screen.getAllByText('3');
      expect(allThree.length).toBeGreaterThan(0); // In transit

      const allTwo = screen.getAllByText('2');
      expect(allTwo.length).toBeGreaterThan(0); // Urgent orders
    });
  });

  it('shows pending orders list', async () => {
    render(<NurseDashboard />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText(/Chambre 101/)).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', async () => {
    render(<NurseDashboard />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nouvelle commande/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voir patients/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Suivi des livraisons/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Notifications/i })).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
      orders: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<NurseDashboard />, { withRouter: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (nurseApi.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<NurseDashboard />, { withRouter: true });

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
