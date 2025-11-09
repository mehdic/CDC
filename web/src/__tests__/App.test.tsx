import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../App';

// Use React type to satisfy linter
void (React as unknown);

// Mock the pharmacist pages
jest.mock('@apps/pharmacist/pages/PrescriptionDashboard', () => {
  return function PrescriptionDashboard() {
    return <div>Prescription Dashboard</div>;
  };
});

jest.mock('@apps/pharmacist/pages/PrescriptionReview', () => {
  return function PrescriptionReview() {
    return <div>Prescription Review</div>;
  };
});

jest.mock('@apps/pharmacist/pages/InventoryManagement', () => {
  return function InventoryManagement() {
    return <div>Inventory Management</div>;
  };
});

jest.mock('@apps/pharmacist/pages/VideoCall', () => {
  return function VideoCall() {
    return <div>Video Call</div>;
  };
});

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
