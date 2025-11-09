import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import {
  ErrorPage,
  NotFoundPage,
  ServerErrorPage,
  GenericErrorPage,
} from '../Error';

// Use React type to satisfy linter
void (React as unknown);

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Error Page Components', () => {
  describe('ErrorPage', () => {
    it('renders 404 error page', () => {
      renderWithRouter(<ErrorPage type="404" />);
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page non trouvée')).toBeInTheDocument();
    });

    it('renders 500 error page', () => {
      renderWithRouter(<ErrorPage type="500" />);
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });

    it('renders generic error page', () => {
      renderWithRouter(<ErrorPage type="generic" />);
      expect(
        screen.getByText('Une erreur est survenue')
      ).toBeInTheDocument();
    });

    it('renders custom title and message', () => {
      renderWithRouter(
        <ErrorPage
          type="generic"
          title="Custom Error"
          message="Custom message"
        />
      );
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('renders home button by default', () => {
      renderWithRouter(<ErrorPage />);
      expect(screen.getByRole('button', { name: /accueil/i })).toBeInTheDocument();
    });

    it('renders back button by default', () => {
      renderWithRouter(<ErrorPage />);
      expect(screen.getByRole('button', { name: /retour/i })).toBeInTheDocument();
    });

    it('hides home button when showHomeButton is false', () => {
      renderWithRouter(<ErrorPage showHomeButton={false} />);
      expect(
        screen.queryByRole('button', { name: /accueil/i })
      ).not.toBeInTheDocument();
    });

    it('hides back button when showBackButton is false', () => {
      renderWithRouter(<ErrorPage showBackButton={false} />);
      expect(
        screen.queryByRole('button', { name: /retour/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Convenience components', () => {
    it('renders NotFoundPage', () => {
      renderWithRouter(<NotFoundPage />);
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page non trouvée')).toBeInTheDocument();
    });

    it('renders ServerErrorPage', () => {
      renderWithRouter(<ServerErrorPage />);
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });

    it('renders GenericErrorPage with custom props', () => {
      renderWithRouter(
        <GenericErrorPage
          title="Test Error"
          message="Test message"
        />
      );
      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });
});
