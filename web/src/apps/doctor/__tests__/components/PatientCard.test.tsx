/**
 * Test for PatientCard Component
 */

import { screen } from '@testing-library/react';
import { render } from '../../../../shared/utils/test-utils';

describe.skip('PatientCard Component', () => {
  it('should render patient card', () => {
    // Use require instead of import due to ts-jest module resolution issue
    const { PatientCard } = require('../../components/PatientCard');

    const mockPatient = {
      id: 'p1',
      firstName: 'Jean',
      lastName: 'Martin',
      email: 'jean@example.com',
      phone: '+41 79 123 45 67',
      dateOfBirth: '1970-05-15',
      medicalHistory: ['Hypertension'],
      allergies: ['Pénicilline'],
      lastVisit: new Date().toISOString(),
      activeConditions: ['Diabète de type 2'],
      chronicPatient: true,
    };

    render(
      PatientCard({ patient: mockPatient, onViewDetails: jest.fn() }),
      { withRouter: true }
    );

    expect(screen.getByText('Jean Martin')).toBeInTheDocument();
  });
});
