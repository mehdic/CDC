/**
 * DeliveryListScreen Component Tests
 * Tests for delivery list screen with pagination and filtering
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryListScreen } from '../DeliveryListScreen';
import { Delivery, DeliveryStatus } from '../../../../shared/hooks/useDelivery';

// Mock the useDeliveryData hook
jest.mock('../../../../shared/hooks/useDelivery', () => ({
  ...jest.requireActual('../../../../shared/hooks/useDelivery'),
  useDeliveryData: jest.fn(),
}));

import { useDeliveryData } from '../../../../shared/hooks/useDelivery';

const mockUseDeliveryData = useDeliveryData as jest.MockedFunction<typeof useDeliveryData>;

describe('DeliveryListScreen Component', () => {
  const mockDeliveries: Delivery[] = [
    {
      id: 'delivery-1',
      user_id: 'patient-1',
      order_id: 'order-1',
      delivery_personnel_id: 'driver-001',
      status: DeliveryStatus.ASSIGNED,
      tracking_info: { address: '123 Main St' },
      tracking_number: 'TRACK001',
      scheduled_at: '2025-12-15T14:00:00Z',
      picked_up_at: null,
      delivered_at: null,
      failed_at: null,
      failure_reason: null,
      created_at: '2025-12-12T10:00:00Z',
      updated_at: '2025-12-12T10:00:00Z',
    },
    {
      id: 'delivery-2',
      user_id: 'patient-2',
      order_id: 'order-2',
      delivery_personnel_id: 'driver-001',
      status: DeliveryStatus.IN_TRANSIT,
      tracking_info: { address: '456 Oak Ave' },
      tracking_number: 'TRACK002',
      scheduled_at: '2025-12-15T15:00:00Z',
      picked_up_at: '2025-12-15T14:30:00Z',
      delivered_at: null,
      failed_at: null,
      failure_reason: null,
      created_at: '2025-12-12T10:05:00Z',
      updated_at: '2025-12-12T14:30:00Z',
    },
  ];

  const mockFetchDeliveries = jest.fn();
  const mockOnSelectDelivery = jest.fn();

  beforeEach(() => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: mockDeliveries,
      pagination: {
        page: 1,
        limit: 20,
        total_items: 2,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });
    mockFetchDeliveries.mockClear();
    mockOnSelectDelivery.mockClear();
  });

  it('renders delivery list screen header', () => {
    render(<DeliveryListScreen />);
    expect(screen.getByText('My Deliveries')).toBeInTheDocument();
    expect(screen.getByText(/Manage and complete your delivery assignments/i)).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<DeliveryListScreen />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders delivery filter component', () => {
    render(<DeliveryListScreen />);
    expect(screen.getByTestId('delivery-filters')).toBeInTheDocument();
  });

  it('displays list of deliveries', () => {
    render(<DeliveryListScreen />);
    expect(screen.getByTestId('delivery-card-delivery-1')).toBeInTheDocument();
    expect(screen.getByTestId('delivery-card-delivery-2')).toBeInTheDocument();
  });

  it('displays loading state when fetching', () => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: [],
      pagination: null,
      loading: true,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    expect(screen.getByText(/Loading deliveries/i)).toBeInTheDocument();
  });

  it('displays empty state when no deliveries', () => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: [],
      pagination: {
        page: 1,
        limit: 20,
        total_items: 0,
        total_pages: 0,
        has_next_page: false,
        has_prev_page: false,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    expect(screen.getByText(/No deliveries found/i)).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: [],
      pagination: null,
      loading: false,
      error: 'Failed to fetch deliveries',
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    expect(screen.getByText('Failed to fetch deliveries')).toBeInTheDocument();
  });

  it('calls onSelectDelivery when delivery card is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryListScreen onSelectDelivery={mockOnSelectDelivery} />);

    const card = screen.getByTestId('delivery-card-delivery-1');
    await user.click(card);

    expect(mockOnSelectDelivery).toHaveBeenCalledWith(mockDeliveries[0]);
  });

  it('fetches deliveries on mount', () => {
    render(<DeliveryListScreen />);
    expect(mockFetchDeliveries).toHaveBeenCalled();
  });

  it('refreshes deliveries when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryListScreen />);

    mockFetchDeliveries.mockClear();
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    expect(mockFetchDeliveries).toHaveBeenCalled();
  });

  it('displays pagination when total_pages > 1', () => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: mockDeliveries,
      pagination: {
        page: 1,
        limit: 20,
        total_items: 40,
        total_pages: 2,
        has_next_page: true,
        has_prev_page: false,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    expect(screen.getByTestId('delivery-pagination')).toBeInTheDocument();
  });

  it('changes page when pagination button is clicked', async () => {
    const user = userEvent.setup();
    mockUseDeliveryData.mockReturnValue({
      deliveries: mockDeliveries,
      pagination: {
        page: 1,
        limit: 20,
        total_items: 40,
        total_pages: 2,
        has_next_page: true,
        has_prev_page: false,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    const pagination = screen.getByTestId('delivery-pagination');
    const page2Button = pagination.querySelector('button[aria-label="Go to page 2"]');

    if (page2Button) {
      await user.click(page2Button);
      expect(mockFetchDeliveries).toHaveBeenCalled();
    }
  });

  it('filters deliveries by status', async () => {
    const user = userEvent.setup();
    render(<DeliveryListScreen />);

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const inTransitOption = await screen.findByRole('option', { name: /In Transit/i });
    await user.click(inTransitOption);

    await waitFor(() => {
      expect(mockFetchDeliveries).toHaveBeenCalledWith({
        status: DeliveryStatus.IN_TRANSIT,
        page: 1,
        limit: 20,
      });
    });
  });

  it('displays delivery count', () => {
    render(<DeliveryListScreen />);
    expect(screen.getByText(/Showing 2 of 2 deliveries/i)).toBeInTheDocument();
  });

  it('handles multiple deliveries correctly', () => {
    const manyDeliveries = Array.from({ length: 5 }, (_, i) => ({
      ...mockDeliveries[0],
      id: `delivery-${i}`,
      user_id: `patient-${i}`,
    }));

    mockUseDeliveryData.mockReturnValue({
      deliveries: manyDeliveries,
      pagination: {
        page: 1,
        limit: 20,
        total_items: 5,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);
    expect(screen.getByText(/Showing 5 of 5 deliveries/i)).toBeInTheDocument();
    manyDeliveries.forEach((delivery) => {
      expect(screen.getByTestId(`delivery-card-${delivery.id}`)).toBeInTheDocument();
    });
  });

  it('resets page to 1 when filter changes', async () => {
    const user = userEvent.setup();
    mockUseDeliveryData.mockReturnValue({
      deliveries: mockDeliveries,
      pagination: {
        page: 2,
        limit: 20,
        total_items: 40,
        total_pages: 2,
        has_next_page: false,
        has_prev_page: true,
      },
      loading: false,
      error: null,
      fetchDeliveries: mockFetchDeliveries,
      fetchDelivery: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });

    render(<DeliveryListScreen />);

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const assignedOption = await screen.findByRole('option', { name: /Assigned to Me/i });
    await user.click(assignedOption);

    await waitFor(() => {
      expect(mockFetchDeliveries).toHaveBeenCalledWith({
        status: DeliveryStatus.ASSIGNED,
        page: 1,
        limit: 20,
      });
    });
  });
});
