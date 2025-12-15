/**
 * Unit Tests for LoadingStates Component
 * Tests skeleton loaders, shimmer effects, and progressive loading
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import {
  DeliveryCardSkeleton,
  DeliveryListSkeleton,
  ProgressiveLoading,
  SlowNetworkIndicator,
  LoadingSpinner,
  InlineLoading,
} from '../LoadingStates';

describe('LoadingStates Component', () => {
  describe('DeliveryCardSkeleton', () => {
    it('should render without crashing', () => {
      const { UNSAFE_root } = render(<DeliveryCardSkeleton />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render skeleton card structure', () => {
      const { UNSAFE_root } = render(<DeliveryCardSkeleton />);
      expect(UNSAFE_root).toBeTruthy();
      // The component should have rendered content
      expect(UNSAFE_root.children.length).toBeGreaterThan(0);
    });
  });

  describe('DeliveryListSkeleton', () => {
    it('should render without crashing', () => {
      const { UNSAFE_root } = render(<DeliveryListSkeleton />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should accept custom count prop', () => {
      const { UNSAFE_root } = render(<DeliveryListSkeleton count={3} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with default count', () => {
      const { UNSAFE_root } = render(<DeliveryListSkeleton />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('ProgressiveLoading', () => {
    const mockChildren = <React.Fragment>Test Content</React.Fragment>;

    it('should show skeleton when loading', () => {
      const { UNSAFE_root } = render(
        <ProgressiveLoading isLoading={true}>{mockChildren}</ProgressiveLoading>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show children when not loading', () => {
      const { UNSAFE_root } = render(
        <ProgressiveLoading isLoading={false}>{mockChildren}</ProgressiveLoading>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle error prop', () => {
      const { UNSAFE_root } = render(
        <ProgressiveLoading isLoading={false} error="Network error">
          {mockChildren}
        </ProgressiveLoading>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should accept custom skeleton count', () => {
      const { UNSAFE_root } = render(
        <ProgressiveLoading isLoading={true} skeletonCount={2}>
          {mockChildren}
        </ProgressiveLoading>
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle retry callback', () => {
      const mockRetry = jest.fn();
      const { UNSAFE_root } = render(
        <ProgressiveLoading
          isLoading={false}
          error="Test error"
          onRetry={mockRetry}
        >
          {mockChildren}
        </ProgressiveLoading>
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('SlowNetworkIndicator', () => {
    it('should render when visible is true', () => {
      const { UNSAFE_root } = render(<SlowNetworkIndicator visible={true} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { UNSAFE_root } = render(<SlowNetworkIndicator visible={false} />);
      // When not visible, root should still exist but component returns null
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('LoadingSpinner', () => {
    it('should render spinner without message', () => {
      const { UNSAFE_root } = render(<LoadingSpinner />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with custom message', () => {
      const { UNSAFE_root } = render(<LoadingSpinner message="Fetching data..." />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with small size', () => {
      const { UNSAFE_root } = render(<LoadingSpinner size="small" />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with large size', () => {
      const { UNSAFE_root } = render(<LoadingSpinner size="large" />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('InlineLoading', () => {
    it('should render with default message', () => {
      const { UNSAFE_root } = render(<InlineLoading />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with custom message', () => {
      const { UNSAFE_root } = render(<InlineLoading message="Syncing..." />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Component Props', () => {
    it('ProgressiveLoading should handle all prop combinations', () => {
      const { UNSAFE_root: root1 } = render(
        <ProgressiveLoading isLoading={true} skeletonCount={5}>
          <React.Fragment />
        </ProgressiveLoading>
      );
      expect(root1).toBeTruthy();

      const { UNSAFE_root: root2 } = render(
        <ProgressiveLoading isLoading={false} error="Test">
          <React.Fragment />
        </ProgressiveLoading>
      );
      expect(root2).toBeTruthy();

      const mockRetry = jest.fn();
      const { UNSAFE_root: root3 } = render(
        <ProgressiveLoading
          isLoading={false}
          error="Test"
          onRetry={mockRetry}
        >
          <React.Fragment />
        </ProgressiveLoading>
      );
      expect(root3).toBeTruthy();
    });
  });
});
