/**
 * Unit Tests for PrescriptionStatusBadge Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PrescriptionStatusBadge } from '../src/components/PrescriptionStatusBadge';
import { PrescriptionStatus } from '@metapharm/api-types';

describe('PrescriptionStatusBadge', () => {
  it('renders pending status correctly', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.PENDING} />
    );
    expect(getByText('En attente')).toBeTruthy();
  });

  it('renders approved status correctly', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.APPROVED} />
    );
    expect(getByText('Approuvée')).toBeTruthy();
  });

  it('renders rejected status correctly', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.REJECTED} />
    );
    expect(getByText('Rejetée')).toBeTruthy();
  });

  it('renders with small size', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.PENDING} size="small" />
    );
    const element = getByText('En attente');
    expect(element).toBeTruthy();
  });

  it('renders with medium size (default)', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.PENDING} size="medium" />
    );
    const element = getByText('En attente');
    expect(element).toBeTruthy();
  });

  it('renders with large size', () => {
    const { getByText } = render(
      <PrescriptionStatusBadge status={PrescriptionStatus.PENDING} size="large" />
    );
    const element = getByText('En attente');
    expect(element).toBeTruthy();
  });
});
