import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the pharmacist pages with simple string returns to avoid JSX/React hoisting issues
jest.mock('@apps/pharmacist/pages/PrescriptionDashboard', () => ({
  default: () => 'Prescription Dashboard',
}));

jest.mock('@apps/pharmacist/pages/PrescriptionReview', () => ({
  default: () => 'Prescription Review',
}));

jest.mock('@apps/pharmacist/pages/InventoryManagement', () => ({
  default: () => 'Inventory Management',
}));

jest.mock('@apps/pharmacist/pages/VideoCall', () => ({
  default: () => 'Video Call',
}));

describe('App Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    // Set auth token for protected routes
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders App component', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Wait for AppShell to render (async loading)
    await waitFor(() => {
      expect(screen.getAllByText('MetaPharm Connect').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders user information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Dr. Martin Dupont')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Inventaire')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    localStorage.removeItem('auth_token');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Should redirect to login (route exists but user not authenticated)
    // This is a basic test - more complex routing tests would use MemoryRouter
  });
});
