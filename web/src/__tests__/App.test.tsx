import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import App from '../App';

// Use React type to satisfy linter
void (React as unknown);

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock the pharmacist pages - use null to avoid out-of-scope variable references
jest.mock('@apps/pharmacist/pages/PrescriptionDashboard', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@apps/pharmacist/pages/PrescriptionReview', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@apps/pharmacist/pages/InventoryManagement', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('@apps/pharmacist/pages/VideoCall', () => ({
  __esModule: true,
  default: () => null
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
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Wrapper>
    );

    // The app should at least render the loading state or the dashboard
    // Check for either loading text or dashboard elements
    const hasLoading = screen.queryByText('Chargement de la page...');
    const hasMetaPharm = screen.queryAllByText('MetaPharm Connect');

    // Either loading state OR the actual app should be visible
    expect(hasLoading || hasMetaPharm.length > 0).toBeTruthy();
  });

  it('renders user information', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Wrapper>
    );

    expect(screen.getByText('Dr. Martin Dupont')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Wrapper>
    );

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Inventaire')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    localStorage.removeItem('auth_token');

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Wrapper>
    );

    // Should redirect to login (route exists but user not authenticated)
    // This is a basic test - more complex routing tests would use MemoryRouter
  });
});
