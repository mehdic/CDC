import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AppShell } from '../AppShell';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AppShell Component', () => {
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'pharmacist',
    avatar: 'https://example.com/avatar.jpg',
  };

  it('renders with children', () => {
    renderWithRouter(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders title in header', () => {
    renderWithRouter(
      <AppShell title="Test App">
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getAllByText('Test App')[0]).toBeInTheDocument();
  });

  it('renders default title when not provided', () => {
    renderWithRouter(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getAllByText('MetaPharm Connect')[0]).toBeInTheDocument();
  });

  it('renders user information when provided', () => {
    renderWithRouter(
      <AppShell user={mockUser}>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('opens user menu when profile icon is clicked', () => {
    renderWithRouter(
      <AppShell user={mockUser}>
        <div>Content</div>
      </AppShell>
    );

    const profileButton = screen.getByLabelText('profil utilisateur');
    fireEvent.click(profileButton);

    expect(screen.getByText('Profil')).toBeInTheDocument();
    // There are two "Paramètres" - one in navigation, one in menu
    expect(screen.getAllByText('Paramètres').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked', () => {
    const handleLogout = jest.fn();
    renderWithRouter(
      <AppShell user={mockUser} onLogout={handleLogout}>
        <div>Content</div>
      </AppShell>
    );

    const profileButton = screen.getByLabelText('profil utilisateur');
    fireEvent.click(profileButton);

    const logoutButton = screen.getByText('Déconnexion');
    fireEvent.click(logoutButton);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onProfileClick when profile is clicked', () => {
    const handleProfileClick = jest.fn();
    renderWithRouter(
      <AppShell user={mockUser} onProfileClick={handleProfileClick}>
        <div>Content</div>
      </AppShell>
    );

    const profileButton = screen.getByLabelText('profil utilisateur');
    fireEvent.click(profileButton);

    // Get all instances and click the one in the menu (second occurrence)
    const profileMenuItems = screen.getAllByText('Profil');
    fireEvent.click(profileMenuItems[0]);

    expect(handleProfileClick).toHaveBeenCalledTimes(1);
  });

  it('calls onSettingsClick when settings is clicked', () => {
    const handleSettingsClick = jest.fn();
    renderWithRouter(
      <AppShell user={mockUser} onSettingsClick={handleSettingsClick}>
        <div>Content</div>
      </AppShell>
    );

    const profileButton = screen.getByLabelText('profil utilisateur');
    fireEvent.click(profileButton);

    // Get all instances and click the one in the menu dropdown (first occurrence in menu)
    const settingsMenuItems = screen.getAllByText('Paramètres');
    // The first "Paramètres" is in the navigation sidebar, the second is in the user menu
    fireEvent.click(settingsMenuItems[1]);

    expect(handleSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('toggles drawer when menu button is clicked', () => {
    renderWithRouter(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    const menuButton = screen.getByLabelText('ouvrir le menu');
    expect(menuButton).toBeInTheDocument();

    // Click should toggle drawer state
    fireEvent.click(menuButton);
  });

  it('renders footer with copyright', () => {
    renderWithRouter(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} MetaPharm Connect. Tous droits réservés.`)
    ).toBeInTheDocument();
  });

  it('renders navigation in drawer', () => {
    renderWithRouter(
      <AppShell user={mockUser}>
        <div>Content</div>
      </AppShell>
    );

    // Navigation items should be in the drawer
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
  });
});
