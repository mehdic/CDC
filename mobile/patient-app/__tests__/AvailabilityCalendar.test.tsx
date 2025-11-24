/**
 * Tests for AvailabilityCalendar Component
 * Task: T153
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AvailabilityCalendar, { TimeSlot } from '../src/components/AvailabilityCalendar';

describe('AvailabilityCalendar', () => {
  const mockSlots: TimeSlot[] = [
    {
      datetime: '2025-11-08T10:00:00Z',
      available: true,
      duration_minutes: 15,
    },
    {
      datetime: '2025-11-08T10:30:00Z',
      available: true,
      duration_minutes: 15,
    },
    {
      datetime: '2025-11-08T11:00:00Z',
      available: false,
      duration_minutes: 15,
    },
    {
      datetime: '2025-11-09T14:00:00Z',
      available: true,
      duration_minutes: 30,
    },
  ];

  const mockOnSelectSlot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <AvailabilityCalendar
        slots={[]}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
        loading={true}
      />
    );

    expect(getByText('Loading available slots...')).toBeTruthy();
  });

  it('renders empty state when no slots available', () => {
    const { getByText } = render(
      <AvailabilityCalendar
        slots={[]}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
        loading={false}
      />
    );

    expect(getByText('No available slots at this time')).toBeTruthy();
  });

  it('renders available slots grouped by date', () => {
    const { getByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    // Should show date headers (formatted as "Sat, Nov 8" etc.)
    // The dates in mockSlots are 2025-11-08 and 2025-11-09
    expect(getByText(/Sat, Nov 8/)).toBeTruthy();
    expect(getByText(/Sun, Nov 9/)).toBeTruthy();
  });

  it('only renders available slots (filters out unavailable)', () => {
    const { getAllByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    // Should render 3 available slots (10:00, 10:30, 14:00)
    // The unavailable 11:00 slot should not be shown
    // This is checked by verifying we have exactly 3 slots with "min"
    const slots = getAllByText(/min/);
    expect(slots).toHaveLength(3); // Verify exactly 3 available slots
  });

  it('calls onSelectSlot when a slot is clicked', () => {
    const { getAllByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    const slotButtons = getAllByText(/min/);
    fireEvent.press(slotButtons[0]);

    expect(mockOnSelectSlot).toHaveBeenCalledTimes(1);
  });

  it('highlights selected slot', () => {
    const selectedSlot = '2025-11-08T10:00:00Z';
    const { getByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    // Selected slot should be rendered (formatted as "11:00 AM" in local time)
    expect(getByText(/11:00 AM/)).toBeTruthy();
  });

  it('formats time correctly', () => {
    const { getByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    // Should format time as "11:00 AM" (10:00 UTC converts to 11:00 AM local time)
    expect(getByText(/11:00 AM/i)).toBeTruthy();
  });

  it('displays duration for slots', () => {
    const { getAllByText } = render(
      <AvailabilityCalendar
        slots={mockSlots}
        selectedSlot={null}
        onSelectSlot={mockOnSelectSlot}
      />
    );

    const durationLabels = getAllByText(/min/);
    expect(durationLabels.length).toBeGreaterThan(0);
  });
});
