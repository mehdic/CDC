/**
 * DeliveryFilters Component Tests
 * Tests for delivery filter controls component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryFilters } from '../DeliveryFilters';
import { DeliveryStatus } from '../../../../../shared/hooks/useDelivery';

describe('DeliveryFilters Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders filter component with label', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('renders all status options in select menu', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    expect(screen.getByText('All Deliveries')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Assigned to Me')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('calls onFilterChange when status is selected', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    const assignedOption = screen.getByText('Assigned to Me');
    await user.click(assignedOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.ASSIGNED);
  });

  it('displays current filter selection', () => {
    render(
      <DeliveryFilters
        currentFilter={DeliveryStatus.IN_TRANSIT}
        onFilterChange={mockOnFilterChange}
      />
    );
    const select = screen.getByTestId('status-filter-select');
    expect(select).toHaveValue(DeliveryStatus.IN_TRANSIT);
  });

  it('disables filter when loading is true', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={true}
      />
    );
    const select = screen.getByTestId('status-filter-select');
    expect(select).toBeDisabled();
  });

  it('enables filter when loading is false', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={false}
      />
    );
    const select = screen.getByTestId('status-filter-select');
    expect(select).not.toBeDisabled();
  });

  it('displays loading indicator when loading is true', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={true}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not display loading indicator when loading is false', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={false}
      />
    );
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('displays helpful tip text', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.getByText(/Use status filters to find deliveries/i)).toBeInTheDocument();
  });

  it('renders with test id', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.getByTestId('delivery-filters')).toBeInTheDocument();
  });

  it('can switch between different status filters', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    let select = screen.getByTestId('status-filter-select');
    await user.click(select);
    const assignedOption = screen.getByText('Assigned to Me');
    await user.click(assignedOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.ASSIGNED);

    rerender(
      <DeliveryFilters
        currentFilter={DeliveryStatus.ASSIGNED}
        onFilterChange={mockOnFilterChange}
      />
    );

    select = screen.getByTestId('status-filter-select');
    expect(select).toHaveValue(DeliveryStatus.ASSIGNED);
  });

  it('calls onFilterChange with "all" when All Deliveries is selected', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter={DeliveryStatus.DELIVERED}
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    const allOption = screen.getByText('All Deliveries');
    await user.click(allOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });

  it('handles pending status filter', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    const pendingOption = screen.getByText('Pending');
    await user.click(pendingOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.PENDING);
  });

  it('handles failed status filter', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    const failedOption = screen.getByText('Failed');
    await user.click(failedOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.FAILED);
  });

  it('handles cancelled status filter', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const select = screen.getByTestId('status-filter-select');
    await user.click(select);

    const cancelledOption = screen.getByText('Cancelled');
    await user.click(cancelledOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.CANCELLED);
  });
});
