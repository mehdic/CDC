/**
 * Loading Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  Loading,
  LoadingOverlay,
  LoadingSpinner,
  SkeletonLoader,
  SkeletonCard,
} from '../components/Loading';

describe('Loading Component', () => {
  describe('LoadingOverlay', () => {
    it('should render when visible', () => {
      const { getByTestId } = render(
        <LoadingOverlay visible={true} testID="overlay" />
      );

      expect(getByTestId('overlay')).toBeTruthy();
    });

    it('should render with message', () => {
      const { getByText } = render(
        <LoadingOverlay visible={true} message="Loading data..." />
      );

      expect(getByText('Loading data...')).toBeTruthy();
    });
  });

  describe('LoadingSpinner', () => {
    it('should render spinner', () => {
      const { getByTestId } = render(<LoadingSpinner testID="spinner" />);

      expect(getByTestId('spinner')).toBeTruthy();
    });

    it('should render with message', () => {
      const { getByText } = render(<LoadingSpinner message="Please wait..." />);

      expect(getByText('Please wait...')).toBeTruthy();
    });
  });

  describe('SkeletonLoader', () => {
    it('should render skeleton', () => {
      const { UNSAFE_root } = render(<SkeletonLoader />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with custom dimensions', () => {
      const { UNSAFE_root } = render(
        <SkeletonLoader width={200} height={50} borderRadius={8} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('SkeletonCard', () => {
    it('should render skeleton card', () => {
      const { UNSAFE_root } = render(<SkeletonCard />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Loading (factory)', () => {
    it('should render inline spinner by default', () => {
      const { getByTestId } = render(<Loading testID="loading" />);

      expect(getByTestId('loading')).toBeTruthy();
    });

    it('should render overlay when type is overlay', () => {
      const { getByTestId } = render(
        <Loading type="overlay" testID="overlay-loading" />
      );

      expect(getByTestId('overlay-loading')).toBeTruthy();
    });

    it('should render skeleton when type is skeleton', () => {
      const { UNSAFE_root } = render(<Loading type="skeleton" />);

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
