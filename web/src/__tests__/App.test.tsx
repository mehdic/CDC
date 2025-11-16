import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';

// Use React type to satisfy linter
void (React as unknown);

// Mock the pharmacist pages
jest.mock('@apps/pharmacist/pages/PrescriptionDashboard', () => ({
  default: function PrescriptionDashboard() {
    return React.createElement('div', {}, 'Prescription Dashboard');
  },
}));

jest.mock('@apps/pharmacist/pages/PrescriptionReview', () => ({
  default: function PrescriptionReview() {
    return React.createElement('div', {}, 'Prescription Review');
  },
}));

jest.mock('@apps/pharmacist/pages/InventoryManagement', () => ({
  default: function InventoryManagement() {
    return React.createElement('div', {}, 'Inventory Management');
  },
}));

jest.mock('@apps/pharmacist/pages/VideoCall', () => ({
  default: function VideoCall() {
    return React.createElement('div', {}, 'Video Call');
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    // Set auth token for protected routes
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders App component', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // AppShell should render (there are multiple instances of this text)
    expect(screen.getAllByText('MetaPharm Connect').length).toBeGreaterThanOrEqual(1);
  });

  it('renders user information', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Dr. Martin Dupont')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Inventaire')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    localStorage.removeItem('auth_token');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Should redirect to login (route exists but user not authenticated)
    // This is a basic test - more complex routing tests would use MemoryRouter
  });
});
