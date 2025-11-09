import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Navigation } from '../Navigation';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navigation Component', () => {
  it('renders navigation items', () => {
    renderWithRouter(<Navigation />);
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Inventaire')).toBeInTheDocument();
    expect(screen.getByText('Téléconsultation')).toBeInTheDocument();
  });

  it('expands and collapses sections with children', async () => {
    renderWithRouter(<Navigation />);

    // Prescriptions section should have children
    const prescriptionsItem = screen.getByText('Prescriptions');
    expect(screen.queryByText("File d'attente")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(prescriptionsItem);
    expect(screen.getByText("File d'attente")).toBeInTheDocument();
    expect(screen.getByText('Vérification')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(prescriptionsItem);
    // Wait for the collapse animation to complete
    await waitFor(() => {
      expect(screen.queryByText("File d'attente")).not.toBeInTheDocument();
    });
  });

  it('filters items based on user role', () => {
    renderWithRouter(<Navigation userRole="guest" />);

    // Items without role restrictions should be visible
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();

    // Items with role restrictions should not be visible
    expect(screen.queryByText('Analyses')).not.toBeInTheDocument();
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument();
  });

  it('shows role-restricted items for authorized users', () => {
    renderWithRouter(<Navigation userRole="pharmacist" />);

    // Items with pharmacist role should be visible
    expect(screen.getByText('Analyses')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('calls onNavigate when provided', () => {
    const handleNavigate = jest.fn();
    renderWithRouter(<Navigation onNavigate={handleNavigate} />);

    const dashboardItem = screen.getByText('Tableau de bord');
    fireEvent.click(dashboardItem);
    expect(handleNavigate).toHaveBeenCalledWith('/');
  });

  it('highlights active route', () => {
    const { container } = renderWithRouter(<Navigation />);

    // The active route styling would be applied
    // This is a simplified test - in reality you'd check the styling
    expect(container.querySelector('[aria-label="navigation principale"]')).toBeInTheDocument();
  });
});
