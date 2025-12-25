/**
 * DeliveryFilters Component Tests
 * Tests for delivery filter controls component
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
    expect(screen.getByLabelText('Filter by Status')).toBeInTheDocument();
  });

  it('renders all status options in select menu', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    expect(await screen.findByRole('option', { name: /All Deliveries/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Pending/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Assigned to Me/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /In Transit/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Delivered/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Failed/i })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Cancelled/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when status is selected', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const assignedOption = await screen.findByRole('option', { name: /Assigned to Me/i });
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
    const selectContainer = screen.getByTestId('status-filter-select');
    const hiddenInput = within(selectContainer).getByRole('combobox', { hidden: true });
    expect(hiddenInput).toHaveAttribute('aria-labelledby', expect.stringContaining('status-filter'));
  });

  it('disables filter when loading is true', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={true}
      />
    );
    const selectContainer = screen.getByTestId('status-filter-select');
    expect(selectContainer).toHaveClass('Mui-disabled');
  });

  it('enables filter when loading is false', () => {
    render(
      <DeliveryFilters
        currentFilter="all"
        onFilterChange={mockOnFilterChange}
        loading={false}
      />
    );
    const selectContainer = screen.getByTestId('status-filter-select');
    expect(selectContainer).not.toHaveClass('Mui-disabled');
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

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);
    const assignedOption = await screen.findByRole('option', { name: /Assigned to Me/i });
    await user.click(assignedOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.ASSIGNED);

    rerender(
      <DeliveryFilters
        currentFilter={DeliveryStatus.ASSIGNED}
        onFilterChange={mockOnFilterChange}
      />
    );

    const selectContainer = screen.getByTestId('status-filter-select');
    const combobox = within(selectContainer).getByRole('combobox', { hidden: true });
    expect(combobox).toHaveAttribute('aria-labelledby', expect.stringContaining('status-filter'));
  });

  it('calls onFilterChange with "all" when All Deliveries is selected', async () => {
    const user = userEvent.setup();
    render(
      <DeliveryFilters
        currentFilter={DeliveryStatus.DELIVERED}
        onFilterChange={mockOnFilterChange}
      />
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const allOption = await screen.findByRole('option', { name: /All Deliveries/i });
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

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const pendingOption = await screen.findByRole('option', { name: /Pending/i });
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

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const failedOption = await screen.findByRole('option', { name: /Failed/i });
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

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const cancelledOption = await screen.findByRole('option', { name: /Cancelled/i });
    await user.click(cancelledOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith(DeliveryStatus.CANCELLED);
  });
});
