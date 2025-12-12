/**
 * PriorityBadge Component Tests
 * Tests for priority indicator badge component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge Component', () => {
  it('renders nothing when no priority flags are set', () => {
    const { container } = render(
      <PriorityBadge
        isControlledSubstance={false}
        requiresTemperatureControl={false}
        isUrgent={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders urgent badge when isUrgent is true', () => {
    render(
      <PriorityBadge
        isUrgent={true}
        isControlledSubstance={false}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-urgent')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders controlled substance badge when isControlledSubstance is true', () => {
    render(
      <PriorityBadge
        isControlledSubstance={true}
        isUrgent={false}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-controlled')).toBeInTheDocument();
    expect(screen.getByText('Controlled')).toBeInTheDocument();
  });

  it('renders cold chain badge when requiresTemperatureControl is true', () => {
    render(
      <PriorityBadge
        requiresTemperatureControl={true}
        isUrgent={false}
        isControlledSubstance={false}
      />
    );
    expect(screen.getByTestId('priority-badge-cold-chain')).toBeInTheDocument();
    expect(screen.getByText('Cold Chain')).toBeInTheDocument();
  });

  it('renders multiple badges when multiple flags are set', () => {
    render(
      <PriorityBadge
        isUrgent={true}
        isControlledSubstance={true}
        requiresTemperatureControl={true}
      />
    );
    expect(screen.getByTestId('priority-badge-urgent')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge-controlled')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge-cold-chain')).toBeInTheDocument();
  });

  it('renders badge container with correct test id', () => {
    render(
      <PriorityBadge
        isUrgent={true}
        isControlledSubstance={false}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-container')).toBeInTheDocument();
  });

  it('renders urgent and controlled substance badges together', () => {
    render(
      <PriorityBadge
        isUrgent={true}
        isControlledSubstance={true}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-urgent')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge-controlled')).toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-cold-chain')).not.toBeInTheDocument();
  });

  it('renders controlled substance and cold chain badges together', () => {
    render(
      <PriorityBadge
        isUrgent={false}
        isControlledSubstance={true}
        requiresTemperatureControl={true}
      />
    );
    expect(screen.getByTestId('priority-badge-controlled')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge-cold-chain')).toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-urgent')).not.toBeInTheDocument();
  });

  it('renders only urgent badge when only urgent is true', () => {
    render(
      <PriorityBadge
        isUrgent={true}
        isControlledSubstance={false}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-urgent')).toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-controlled')).not.toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-cold-chain')).not.toBeInTheDocument();
  });

  it('renders only controlled substance badge when only controlled is true', () => {
    render(
      <PriorityBadge
        isUrgent={false}
        isControlledSubstance={true}
        requiresTemperatureControl={false}
      />
    );
    expect(screen.getByTestId('priority-badge-controlled')).toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-urgent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-cold-chain')).not.toBeInTheDocument();
  });

  it('renders only cold chain badge when only cold chain is true', () => {
    render(
      <PriorityBadge
        isUrgent={false}
        isControlledSubstance={false}
        requiresTemperatureControl={true}
      />
    );
    expect(screen.getByTestId('priority-badge-cold-chain')).toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-urgent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('priority-badge-controlled')).not.toBeInTheDocument();
  });

  it('handles undefined props with default values', () => {
    const { container } = render(<PriorityBadge />);
    expect(container.firstChild).toBeNull();
  });
});
