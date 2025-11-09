import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Loading,
  FullScreenLoading,
  InlineLoading,
  SkeletonLoader,
} from '../Loading';

describe('Loading Component', () => {
  describe('Fullscreen variant', () => {
    it('renders fullscreen loading with default message', () => {
      render(<Loading variant="fullscreen" />);
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('renders fullscreen loading with custom message', () => {
      render(<Loading variant="fullscreen" message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders circular progress indicator', () => {
      const { container } = render(<Loading variant="fullscreen" />);
      expect(
        container.querySelector('.MuiCircularProgress-root')
      ).toBeInTheDocument();
    });
  });

  describe('Inline variant', () => {
    it('renders inline loading with message', () => {
      render(<Loading variant="inline" message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders circular progress indicator', () => {
      const { container } = render(<Loading variant="inline" />);
      expect(
        container.querySelector('.MuiCircularProgress-root')
      ).toBeInTheDocument();
    });
  });

  describe('Skeleton variant', () => {
    it('renders skeleton loaders with default count', () => {
      const { container } = render(<Loading variant="skeleton" />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(5);
    });

    it('renders skeleton loaders with custom count', () => {
      const { container } = render(
        <Loading variant="skeleton" skeletonCount={3} />
      );
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(3);
    });

    it('renders skeleton loaders with custom height', () => {
      const { container } = render(
        <Loading variant="skeleton" height={100} />
      );
      const skeleton = container.querySelector('.MuiSkeleton-root');
      expect(skeleton).toHaveStyle({ height: '100px' });
    });
  });

  describe('Convenience components', () => {
    it('renders FullScreenLoading', () => {
      render(<FullScreenLoading message="Loading app..." />);
      expect(screen.getByText('Loading app...')).toBeInTheDocument();
    });

    it('renders InlineLoading', () => {
      render(<InlineLoading message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders SkeletonLoader', () => {
      const { container } = render(<SkeletonLoader count={2} height={80} />);
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(2);
    });
  });
});
