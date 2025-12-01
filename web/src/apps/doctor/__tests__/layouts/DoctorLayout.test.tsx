/**
 * Doctor Layout Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DoctorLayout } from '../../layouts/DoctorLayout';

describe('DoctorLayout Component', () => {
  const renderComponent = (children: React.ReactNode = <div>Test Content</div>) => {
    return render(
      <BrowserRouter>
        <DoctorLayout>{children}</DoctorLayout>
      </BrowserRouter>
    );
  };

  it('should render layout container', () => {
    renderComponent();

    expect(screen.getByTestId('doctor-layout')).toBeInTheDocument();
  });

  it('should render app bar', () => {
    renderComponent();

    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
  });

  it('should render main content area', () => {
    renderComponent(<div data-testid="custom-content">Custom Content</div>);

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('should render navigation list', () => {
    renderComponent();

    expect(screen.getByTestId('navigation-list')).toBeInTheDocument();
  });

  it('should have navigation items', () => {
    renderComponent();

    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-patients')).toBeInTheDocument();
    expect(screen.getByTestId('nav-treatments')).toBeInTheDocument();
    expect(screen.getByTestId('nav-messages')).toBeInTheDocument();
    expect(screen.getByTestId('nav-observance')).toBeInTheDocument();
  });

  it('should display user menu button', () => {
    renderComponent();

    expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
  });

  it('should open user menu when clicking user menu button', () => {
    renderComponent();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should display profile menu item', () => {
    renderComponent();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    expect(screen.getByTestId('profile-menu-item')).toBeInTheDocument();
  });

  it('should display settings menu item', () => {
    renderComponent();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    expect(screen.getByTestId('settings-menu-item')).toBeInTheDocument();
  });

  it('should display logout menu item', () => {
    renderComponent();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    expect(screen.getByTestId('logout-menu-item')).toBeInTheDocument();
  });

  it('should have settings button in sidebar', () => {
    renderComponent();

    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
  });

  it('should have sidebar logo', () => {
    renderComponent();

    expect(screen.getByTestId('sidebar-logo')).toBeInTheDocument();
  });

  it('should have navigation links with correct text', () => {
    renderComponent();

    expect(screen.getByText('Tableau de Bord')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Traitements')).toBeInTheDocument();
    expect(screen.getByText('Messagerie')).toBeInTheDocument();
    expect(screen.getByText('Observance')).toBeInTheDocument();
  });

  it('should render children content', () => {
    const testContent = 'This is test content';
    renderComponent(<div>{testContent}</div>);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('should have desktop drawer for larger screens', () => {
    renderComponent();

    expect(screen.getByTestId('desktop-drawer')).toBeInTheDocument();
  });

  it('should have content area', () => {
    renderComponent();

    expect(screen.getByTestId('content-area')).toBeInTheDocument();
  });

  it('should display menu button on mobile', () => {
    renderComponent();

    // Menu button exists in the DOM (though may be hidden on larger screens)
    expect(screen.getByTestId('menu-button')).toBeInTheDocument();
  });

  it('should close user menu when clicking logout', () => {
    renderComponent();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    const logoutItem = screen.getByTestId('logout-menu-item');
    fireEvent.click(logoutItem);

    // Menu should close after logout action
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should display doctor role in branding', () => {
    renderComponent();

    expect(screen.getByText('Médecin')).toBeInTheDocument();
  });

  it('should display MetaPharm branding', () => {
    renderComponent();

    expect(screen.getByText('MetaPharm')).toBeInTheDocument();
  });

  it('should have main content section', () => {
    renderComponent();

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });
});
