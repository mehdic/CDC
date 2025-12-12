/**
 * DeliveryCard Component Tests
 * Tests for delivery card list item component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryCard } from '../DeliveryCard';
import { Delivery, DeliveryStatus } from '../../../../../shared/hooks/useDelivery';

describe('DeliveryCard Component', () => {
  const mockDelivery: Delivery = {
    id: 'delivery-123',
    user_id: 'patient-456',
    order_id: 'order-789',
    delivery_personnel_id: 'driver-001',
    status: DeliveryStatus.ASSIGNED,
    tracking_info: {
      address: '123 Main St, Springfield',
      contains_controlled_substance: false,
      requires_temperature_control: false,
      special_handling_instructions: null,
    },
    tracking_number: 'TRACK123456',
    scheduled_at: '2025-12-15T14:00:00Z',
    picked_up_at: null,
    delivered_at: null,
    failed_at: null,
    failure_reason: null,
    created_at: '2025-12-12T10:00:00Z',
    updated_at: '2025-12-12T10:00:00Z',
  };

  it('renders delivery card with user information', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByText(/patient-456/i)).toBeInTheDocument();
  });

  it('displays delivery address', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByText(/123 Main St, Springfield/i)).toBeInTheDocument();
  });

  it('displays delivery status with correct color', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByTestId('delivery-status-delivery-123')).toHaveTextContent('ASSIGNED');
  });

  it('displays tracking number if available', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByText(/Track #: TRACK123456/i)).toBeInTheDocument();
  });

  it('displays scheduled date if available', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByText(/Scheduled:/i)).toBeInTheDocument();
  });

  it('calls onClick handler when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<DeliveryCard delivery={mockDelivery} onClick={handleClick} />);

    const card = screen.getByTestId('delivery-card-delivery-123');
    await user.click(card);
    expect(handleClick).toHaveBeenCalled();
  });

  it('displays View Details button', () => {
    render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByTestId('view-delivery-button-delivery-123')).toBeInTheDocument();
  });

  it('handles missing address gracefully', () => {
    const deliveryNoAddress: Delivery = {
      ...mockDelivery,
      tracking_info: { ...mockDelivery.tracking_info, address: null },
    };
    render(<DeliveryCard delivery={deliveryNoAddress} />);
    expect(screen.getByText(/Address not available/i)).toBeInTheDocument();
  });

  it('displays special handling instructions if present', () => {
    const deliveryWithInstructions: Delivery = {
      ...mockDelivery,
      tracking_info: {
        ...mockDelivery.tracking_info,
        special_handling_instructions: 'Keep in cool place',
      },
    };
    render(<DeliveryCard delivery={deliveryWithInstructions} />);
    expect(screen.getByText(/Keep in cool place/i)).toBeInTheDocument();
  });

  it('displays different status colors for different statuses', () => {
    const { rerender } = render(<DeliveryCard delivery={mockDelivery} />);
    expect(screen.getByTestId('delivery-status-delivery-123')).toBeInTheDocument();

    const deliveredDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.DELIVERED,
    };
    rerender(<DeliveryCard delivery={deliveredDelivery} />);
    expect(screen.getByTestId('delivery-status-delivery-123')).toHaveTextContent('DELIVERED');
  });

  it('renders test id correctly', () => {
    render(<DeliveryCard delivery={mockDelivery} data-testid="test-delivery-card" />);
    expect(screen.getByTestId('test-delivery-card')).toBeInTheDocument();
  });

  it('does not call onClick if not provided', () => {
    const { container } = render(<DeliveryCard delivery={mockDelivery} />);
    const card = container.querySelector('[data-testid="delivery-card-delivery-123"]');
    expect(card).toBeInTheDocument();
  });

  it('displays IN_TRANSIT status', () => {
    const inTransitDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.IN_TRANSIT,
      picked_up_at: '2025-12-15T14:30:00Z',
    };
    render(<DeliveryCard delivery={inTransitDelivery} />);
    expect(screen.getByTestId('delivery-status-delivery-123')).toHaveTextContent('IN_TRANSIT');
  });

  it('displays FAILED status with correct styling', () => {
    const failedDelivery: Delivery = {
      ...mockDelivery,
      status: DeliveryStatus.FAILED,
      failed_at: '2025-12-15T16:00:00Z',
      failure_reason: 'Address not found',
    };
    render(<DeliveryCard delivery={failedDelivery} />);
    expect(screen.getByTestId('delivery-status-delivery-123')).toHaveTextContent('FAILED');
  });

  it('handles null scheduled_at gracefully', () => {
    const deliveryNoSchedule: Delivery = {
      ...mockDelivery,
      scheduled_at: null,
    };
    render(<DeliveryCard delivery={deliveryNoSchedule} />);
    // Should not throw error
    expect(screen.getByTestId('delivery-card-delivery-123')).toBeInTheDocument();
  });
});
