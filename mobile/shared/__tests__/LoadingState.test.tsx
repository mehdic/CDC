/**
 * LoadingState Component Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LoadingState, {
  SpinnerState,
  SkeletonState,
  ProgressState,
  ErrorState,
  EmptyStateComponent,
  OverlayState,
} from '../components/LoadingState';

// Mock i18n
jest.mock('../utils/i18n', () => ({
  t: (key: string) => key,
}));

describe('LoadingState Component', () => {
  describe('SpinnerState', () => {
    it('renders spinner with message', () => {
      const { getByText } = render(
        <SpinnerState message="Loading data..." testID="spinner" />
      );
      expect(getByText('Loading data...')).toBeDefined();
    });

    it('renders spinner without message', () => {
      const { queryByText } = render(<SpinnerState testID="spinner" />);
      expect(queryByText(/./)).toBeNull();
    });

    it('has correct accessibility props', () => {
      const { getByLabelText } = render(
        <SpinnerState message="Loading" testID="spinner" />
      );
      expect(getByLabelText('accessibility.loading')).toBeDefined();
    });
  });

  describe('SkeletonState', () => {
    it('renders skeleton with default props', () => {
      const { getByLabelText } = render(<SkeletonState />);
      expect(getByLabelText('accessibility.loading')).toBeDefined();
    });

    it('renders skeleton with custom dimensions', () => {
      const { getByLabelText } = render(
        <SkeletonState width={200} height={50} borderRadius={8} />
      );
      expect(getByLabelText('accessibility.loading')).toBeDefined();
    });
  });

  describe('ProgressState', () => {
    it('renders progress bar with message', () => {
      const { getByText } = render(
        <ProgressState progress={50} message="Processing..." testID="progress" />
      );
      expect(getByText('Processing...')).toBeDefined();
      expect(getByText('50%')).toBeDefined();
    });

    it('clamps progress to 0-100 range', () => {
      const { getByText: getText1 } = render(<ProgressState progress={-10} />);
      expect(getText1('0%')).toBeDefined();

      const { getByText: getText2 } = render(<ProgressState progress={150} />);
      expect(getText2('100%')).toBeDefined();
    });
  });

  describe('ErrorState', () => {
    it('renders error with title and message', () => {
      const error = {
        title: 'Error Title',
        message: 'Error message',
      };
      const { getByText } = render(<ErrorState error={error} testID="error" />);
      expect(getByText('Error Title')).toBeDefined();
      expect(getByText('Error message')).toBeDefined();
    });

    it('renders retry button when retryable', () => {
      const onRetry = jest.fn();
      const error = {
        title: 'Error',
        message: 'Try again',
        retryable: true,
        onRetry,
      };
      const { getByTestId } = render(<ErrorState error={error} testID="error" />);
      expect(getByTestId('error-retry')).toBeDefined();
    });

    it('renders null when no error provided', () => {
      const { queryByText } = render(<ErrorState testID="error" />);
      expect(queryByText(/./)).toBeNull();
    });
  });

  describe('EmptyStateComponent', () => {
    it('renders empty state with title and message', () => {
      const empty = {
        title: 'No Data',
        message: 'Nothing to show',
      };
      const { getByText } = render(
        <EmptyStateComponent empty={empty} testID="empty" />
      );
      expect(getByText('No Data')).toBeDefined();
      expect(getByText('Nothing to show')).toBeDefined();
    });

    it('renders action button when provided', () => {
      const onPress = jest.fn();
      const empty = {
        title: 'Empty',
        message: 'Add items',
        action: {
          label: 'Add',
          onPress,
        },
      };
      const { getByTestId } = render(
        <EmptyStateComponent empty={empty} testID="empty" />
      );
      expect(getByTestId('empty-action')).toBeDefined();
    });

    it('renders null when no empty data provided', () => {
      const { queryByText } = render(<EmptyStateComponent testID="empty" />);
      expect(queryByText(/./)).toBeNull();
    });
  });

  describe('OverlayState', () => {
    it('renders overlay when visible', () => {
      const { getByTestId } = render(
        <OverlayState visible={true} message="Loading..." testID="overlay" />
      );
      expect(getByTestId('overlay')).toBeDefined();
    });

    it('does not render when not visible', () => {
      const { queryByTestId } = render(
        <OverlayState visible={false} message="Loading..." testID="overlay" />
      );
      expect(queryByTestId('overlay')).toBeNull();
    });
  });

  describe('LoadingState Factory', () => {
    it('renders spinner for "spinner" type', () => {
      const { getByLabelText } = render(
        <LoadingState type="spinner" message="Loading" />
      );
      expect(getByLabelText('accessibility.loading')).toBeDefined();
    });

    it('renders skeleton for "skeleton" type', () => {
      const { getByLabelText } = render(<LoadingState type="skeleton" />);
      expect(getByLabelText('accessibility.loading')).toBeDefined();
    });

    it('renders progress for "progress" type', () => {
      const { getByText } = render(
        <LoadingState type="progress" progress={75} />
      );
      expect(getByText('75%')).toBeDefined();
    });

    it('renders error for "error" type', () => {
      const error = { title: 'Error', message: 'Failed' };
      const { getByText } = render(
        <LoadingState type="error" error={error} />
      );
      expect(getByText('Error')).toBeDefined();
    });

    it('renders empty for "empty" type', () => {
      const empty = { title: 'Empty', message: 'No data' };
      const { getByText } = render(
        <LoadingState type="empty" empty={empty} />
      );
      expect(getByText('Empty')).toBeDefined();
    });

    it('renders overlay for "overlay" type', () => {
      const { getByTestId } = render(
        <LoadingState type="overlay" visible={true} testID="overlay" />
      );
      expect(getByTestId('overlay')).toBeDefined();
    });
  });
});
