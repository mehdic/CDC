/**
 * DeliveryDetailScreen Component Tests
 * Tests for delivery detail view component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryDetailScreen } from '../DeliveryDetailScreen';
import { Delivery, DeliveryStatus } from '../../../../shared/hooks/useDelivery';

// Mock the useDeliveryData hook
jest.mock('../../../../shared/hooks/useDelivery', () => ({
  ...jest.requireActual('../../../../shared/hooks/useDelivery'),
  useDeliveryData: jest.fn(),
}));

import { useDeliveryData } from '../../../../shared/hooks/useDelivery';

const mockUseDeliveryData = useDeliveryData as jest.MockedFunction<typeof useDeliveryData>;

describe('DeliveryDetailScreen Component', () => {
  const mockDelivery: Delivery = {
    id: 'delivery-123',
    user_id: 'patient-456',
    order_id: 'order-789',
    delivery_personnel_id: 'driver-001',
    status: DeliveryStatus.IN_TRANSIT,
    tracking_info: {
      address: '123 Main St, Springfield',
      contains_controlled_substance: false,
      requires_temperature_control: false,
      special_handling_instructions: null,
    },
    tracking_number: 'TRACK123456',
    scheduled_at: '2025-12-15T14:00:00Z',
    picked_up_at: '2025-12-15T14:30:00Z',
    delivered_at: null,
    failed_at: null,
    failure_reason: null,
    created_at: '2025-12-12T10:00:00Z',
    updated_at: '2025-12-15T14:30:00Z',
  };

  const mockFetchDelivery = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockUseDeliveryData.mockReturnValue({
      deliveries: [],
      pagination: null,
      loading: false,
      error: null,
      fetchDeliveries: jest.fn(),
      fetchDelivery: mockFetchDelivery,
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      deleteDelivery: jest.fn(),
      assignDelivery: jest.fn(),
    });
    mockFetchDelivery.mockResolvedValue(mockDelivery);
    mockOnBack.mockClear();
  });

  it('renders back button', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-back-button')).toBeInTheDocument();
    });
  });

  it('fetches delivery on mount', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(mockFetchDelivery).toHaveBeenCalledWith('delivery-123');
    });
  });

  it('displays loading state initially', () => {
    mockFetchDelivery.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays delivery information after loading', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/patient-456/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St, Springfield/i)).toBeInTheDocument();
    });
  });

  it('displays delivery status', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-status-delivery-123')).toBeInTheDocument();
      expect(screen.getByText(/IN_TRANSIT/i)).toBeInTheDocument();
    });
  });

  it('displays tracking number', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText('TRACK123456')).toBeInTheDocument();
    });
  });

  it('displays order ID', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText('order-789')).toBeInTheDocument();
    });
  });

  it('displays delivery information card', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-info-card')).toBeInTheDocument();
    });
  });

  it('displays timeline card', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-timeline-card')).toBeInTheDocument();
    });
  });

  it('displays requirements card', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-requirements-card')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeliveryDetailScreen deliveryId="delivery-123" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByTestId('delivery-detail-back-button')).toBeInTheDocument();
    });

    const backButton = screen.getByTestId('delivery-detail-back-button');
    await user.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays error message when fetch fails', async () => {
    mockFetchDelivery.mockResolvedValue(null);
    render(<DeliveryDetailScreen deliveryId="delivery-123" onBack={mockOnBack} />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load delivery details')).toBeInTheDocument();
    });
  });

  it('displays Timeline section with created date', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/CREATED/i)).toBeInTheDocument();
    });
  });

  it('displays pickup time in timeline', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/PICKED UP/i)).toBeInTheDocument();
    });
  });

  it('displays delivered status and time when delivery is completed', async () => {
    const deliveredDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.DELIVERED,
      delivered_at: '2025-12-15T15:30:00Z',
    };
    mockFetchDelivery.mockResolvedValue(deliveredDelivery);

    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      const deliveredElements = screen.getAllByText(/DELIVERED/i);
      expect(deliveredElements.length).toBeGreaterThan(0);
    });
  });

  it('displays failure reason when delivery failed', async () => {
    const failedDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.FAILED,
      failed_at: '2025-12-15T15:30:00Z',
      failure_reason: 'Address not found',
    };
    mockFetchDelivery.mockResolvedValue(failedDelivery);

    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/Address not found/i)).toBeInTheDocument();
    });
  });

  it('displays cold chain requirements when applicable', async () => {
    const coldChainDelivery: Delivery = {
      ...mockDelivery,
      tracking_info: {
        ...mockDelivery.tracking_info,
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        max_delivery_duration_minutes: 30,
      },
    };
    mockFetchDelivery.mockResolvedValue(coldChainDelivery);

    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/COLD CHAIN REQUIRED/i)).toBeInTheDocument();
      expect(screen.getByText(/2°C - 8°C/i)).toBeInTheDocument();
    });
  });

  it('displays controlled substance information when applicable', async () => {
    const controlledDelivery: Delivery = {
      ...mockDelivery,
      tracking_info: {
        ...mockDelivery.tracking_info,
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
        age_verification_required: true,
      },
    };
    mockFetchDelivery.mockResolvedValue(controlledDelivery);

    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/CONTROLLED SUBSTANCE/i)).toBeInTheDocument();
      expect(screen.getByText(/Schedule: II/i)).toBeInTheDocument();
      expect(screen.getByText(/Requires signature: Yes/i)).toBeInTheDocument();
    });
  });

  it('displays no special requirements message when none apply', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/No special requirements for this delivery/i)).toBeInTheDocument();
    });
  });

  it('handles delivery with all timeline events', async () => {
    const completedDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.DELIVERED,
      scheduled_at: '2025-12-15T14:00:00Z',
      picked_up_at: '2025-12-15T14:30:00Z',
      delivered_at: '2025-12-15T15:30:00Z',
    };
    mockFetchDelivery.mockResolvedValue(completedDelivery);

    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/SCHEDULED/i)).toBeInTheDocument();
      expect(screen.getByText(/PICKED UP/i)).toBeInTheDocument();
      const deliveredElements = screen.getAllByText(/DELIVERED/i);
      expect(deliveredElements.length).toBeGreaterThan(0);
    });
  });

  it('displays delivery ID in header', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      expect(screen.getByText(/delivery-123/i)).toBeInTheDocument();
    });
  });

  it('renders delivery ID in info section', async () => {
    render(<DeliveryDetailScreen deliveryId="delivery-123" />);
    await waitFor(() => {
      const deliveryIdElements = screen.getAllByText('delivery-123', { exact: false });
      expect(deliveryIdElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
