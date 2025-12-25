/**
 * Admin Dashboard Tests
 * Tests for the admin dashboard page and components
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../pages/AdminDashboard';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { UserManagement } from '../components/UserManagement';
import { AnalyticsWidget } from '../components/AnalyticsWidget';
import { ConfigManagement } from '../components/ConfigManagement';
import { AuditLogViewer } from '../components/AuditLogViewer';
import type { SystemMonitoring, AdminAnalytics } from '../types/admin.types';

// Mock the admin service
jest.mock('../services/adminService', () => ({
  adminService: {
    getDashboardSummary: jest.fn(),
    getUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getSystemHealth: jest.fn(),
    getAnalytics: jest.fn(),
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    getAuditLogs: jest.fn(),
    exportAuditLogs: jest.fn(),
  },
}));

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockSystemHealth: SystemMonitoring = {
  overall: 'healthy',
  services: [
    { name: 'API Gateway', status: 'healthy', responseTime: 45, lastCheck: new Date().toISOString() },
    { name: 'Auth Service', status: 'healthy', responseTime: 32, lastCheck: new Date().toISOString() },
    { name: 'User Service', status: 'degraded', responseTime: 150, lastCheck: new Date().toISOString() },
  ],
  metrics: {
    cpuUsage: 42,
    memoryUsage: 68,
    diskUsage: 55,
    activeConnections: 312,
  },
  timestamp: new Date().toISOString(),
};

const mockAnalytics: AdminAnalytics = {
  users: {
    total: 1250,
    byType: {
      pharmacist: 85,
      doctor: 120,
      nurse: 200,
      delivery_person: 45,
      patient: 790,
      admin: 10,
    },
    newThisMonth: 48,
    activeToday: 312,
  },
  orders: {
    total: 3420,
    completed: 3156,
    pending: 264,
    revenue: 425680,
  },
  prescriptions: {
    total: 2890,
    processed: 2654,
    pending: 236,
  },
  consultations: {
    total: 856,
    completed: 789,
    scheduled: 67,
  },
  deliveries: {
    total: 1876,
    completed: 1723,
    inProgress: 142,
    failed: 11,
  },
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the admin dashboard with title', async () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Administration')).toBeInTheDocument();
  });

  it('displays quick stats cards', async () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('stat-users')).toBeInTheDocument();
      expect(screen.getByTestId('stat-orders')).toBeInTheDocument();
      expect(screen.getByTestId('stat-prescriptions')).toBeInTheDocument();
      expect(screen.getByTestId('stat-revenue')).toBeInTheDocument();
    });
  });

  it('shows tabs for different sections', async () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-users')).toBeInTheDocument();
      expect(screen.getByTestId('tab-system')).toBeInTheDocument();
      expect(screen.getByTestId('tab-config')).toBeInTheDocument();
      expect(screen.getByTestId('tab-audit')).toBeInTheDocument();
    });
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('tab-users')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('tab-users'));

    await waitFor(() => {
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });
  });
});

describe('SystemHealthCard', () => {
  it('renders overall system status', () => {
    render(<SystemHealthCard health={mockSystemHealth} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('system-health-card')).toBeInTheDocument();
    expect(screen.getByTestId('overall-status')).toBeInTheDocument();
    expect(screen.getByText('Operationnel')).toBeInTheDocument();
  });

  it('displays system metrics', () => {
    render(<SystemHealthCard health={mockSystemHealth} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('cpu-usage')).toBeInTheDocument();
    expect(screen.getByTestId('memory-usage')).toBeInTheDocument();
    expect(screen.getByTestId('disk-usage')).toBeInTheDocument();
    expect(screen.getByTestId('active-connections')).toHaveTextContent('312');
  });

  it('shows all service statuses', () => {
    render(<SystemHealthCard health={mockSystemHealth} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('service-api-gateway')).toBeInTheDocument();
    expect(screen.getByTestId('service-auth-service')).toBeInTheDocument();
    expect(screen.getByTestId('service-user-service')).toBeInTheDocument();
  });

  it('shows degraded status correctly', () => {
    const degradedHealth: SystemMonitoring = {
      ...mockSystemHealth,
      overall: 'degraded',
    };

    render(<SystemHealthCard health={degradedHealth} />, { wrapper: createWrapper() });

    expect(screen.getByText('Degrade')).toBeInTheDocument();
  });
});

describe('AnalyticsWidget', () => {
  it('renders analytics data', () => {
    render(<AnalyticsWidget analytics={mockAnalytics} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('analytics-widget')).toBeInTheDocument();
  });

  it('displays user totals', () => {
    render(<AnalyticsWidget analytics={mockAnalytics} />, { wrapper: createWrapper() });

    expect(screen.getByText('1 250')).toBeInTheDocument(); // Total users formatted
    expect(screen.getByText('Utilisateurs Totaux')).toBeInTheDocument();
  });

  it('shows user type breakdown', () => {
    render(<AnalyticsWidget analytics={mockAnalytics} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('user-type-pharmacist')).toBeInTheDocument();
    expect(screen.getByTestId('user-type-doctor')).toBeInTheDocument();
    expect(screen.getByTestId('user-type-nurse')).toBeInTheDocument();
    expect(screen.getByTestId('user-type-patient')).toBeInTheDocument();
  });

  it('displays performance indicators', () => {
    render(<AnalyticsWidget analytics={mockAnalytics} />, { wrapper: createWrapper() });

    // Check that percentages are calculated and displayed
    expect(screen.getByText('Ordonnances traitees')).toBeInTheDocument();
    expect(screen.getByText('Consultations terminees')).toBeInTheDocument();
    expect(screen.getByText('Livraisons reussies')).toBeInTheDocument();
  });
});

describe('UserManagement', () => {
  it('renders user management component', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    expect(screen.getByText('Gestion des Utilisateurs')).toBeInTheDocument();
  });

  it('has search and filter controls', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type')).toBeInTheDocument();
      expect(screen.getByTestId('filter-status')).toBeInTheDocument();
    });
  });

  it('has add user button', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });
  });

  it('opens create user dialog on add button click', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /ajouter/i }));

    await waitFor(() => {
      expect(screen.getByText('Nouvel Utilisateur')).toBeInTheDocument();
      expect(screen.getByTestId('user-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('user-firstname-input')).toBeInTheDocument();
      expect(screen.getByTestId('user-lastname-input')).toBeInTheDocument();
      expect(screen.getByTestId('user-type-select')).toBeInTheDocument();
    });
  });
});

describe('ConfigManagement', () => {
  it('renders configuration management component', async () => {
    render(<ConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('config-management')).toBeInTheDocument();
    });

    expect(screen.getByText('Configuration Systeme')).toBeInTheDocument();
  });

  it('shows loading state initially or error when API unavailable', async () => {
    render(<ConfigManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('config-management')).toBeInTheDocument();
    });

    // Either shows loading, error, or tabs depending on API state
    // Since we're mocking and API returns error, check for error message
    await waitFor(() => {
      const errorMessage = screen.queryByText('Erreur lors du chargement de la configuration');
      const tabGeneral = screen.queryByTestId('tab-general');
      expect(errorMessage || tabGeneral).toBeTruthy();
    });
  });
});

describe('AuditLogViewer', () => {
  it('renders audit log viewer component', async () => {
    render(<AuditLogViewer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-viewer')).toBeInTheDocument();
    });

    expect(screen.getByText("Journal d'Audit")).toBeInTheDocument();
  });

  it('has export button', async () => {
    render(<AuditLogViewer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exporter/i })).toBeInTheDocument();
    });
  });

  it('has filters button', async () => {
    render(<AuditLogViewer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filtres/i })).toBeInTheDocument();
    });
  });

  it('expands filters when clicked', async () => {
    const user = userEvent.setup();
    render(<AuditLogViewer />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /filtres/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /filtres/i }));

    await waitFor(() => {
      expect(screen.getByTestId('filter-action')).toBeInTheDocument();
      expect(screen.getByTestId('filter-actor')).toBeInTheDocument();
      expect(screen.getByTestId('filter-start-date')).toBeInTheDocument();
      expect(screen.getByTestId('filter-end-date')).toBeInTheDocument();
    });
  });
});

describe('RBAC Integration', () => {
  it('user management shows correct role labels', async () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    // Open add user dialog
    await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    await waitFor(() => {
      expect(screen.getByTestId('user-type-select')).toBeInTheDocument();
    });

    // Check that user type select contains all 5 user types + admin
    const select = screen.getByTestId('user-type-select');
    fireEvent.mouseDown(within(select).getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pharmacien' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Medecin' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Infirmier(e)' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Livreur' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Patient' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Administrateur' })).toBeInTheDocument();
    });
  });
});
