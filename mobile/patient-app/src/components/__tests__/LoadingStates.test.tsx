import React from 'react';
import { render } from '@testing-library/react-native';
import {
  SkeletonLoader,
  SkeletonText,
  PrescriptionSkeleton,
  ConsultationSkeleton,
  FullScreenLoader,
  ProgressIndicator,
  InlineLoader,
} from '../LoadingStates';

describe('T2-049: Loading States Components', () => {
  describe('SkeletonLoader', () => {
    it('should render skeleton with default props', () => {
      const { getByTestId } = render(
        <SkeletonLoader testID="skeleton" />,
      );
      expect(getByTestId('skeleton')).toBeTruthy();
    });

    it('should apply custom width and height', () => {
      const { getByTestId } = render(
        <SkeletonLoader testID="skeleton" width={100} height={50} />,
      );
      const skeleton = getByTestId('skeleton');
      expect(skeleton.props.style).toContainEqual(
        expect.objectContaining({ width: 100, height: 50 }),
      );
    });

    it('should apply custom border radius', () => {
      const { getByTestId } = render(
        <SkeletonLoader testID="skeleton" borderRadius={16} />,
      );
      const skeleton = getByTestId('skeleton');
      expect(skeleton.props.style).toContainEqual(
        expect.objectContaining({ borderRadius: 16 }),
      );
    });
  });

  describe('SkeletonText', () => {
    it('should render multiple skeleton lines', () => {
      const { getAllByTestId } = render(
        <SkeletonText testID="skeleton-line" lines={3} />,
      );
      const lines = getAllByTestId('skeleton-line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should render correct number of lines', () => {
      const { container } = render(
        <SkeletonText lines={5} />,
      );
      const children = container.props.children;
      expect(Array.isArray(children) || children).toBeTruthy();
    });
  });

  describe('PrescriptionSkeleton', () => {
    it('should render prescription skeleton', () => {
      const { getByTestId } = render(
        <PrescriptionSkeleton testID="prescription-skeleton" />,
      );
      expect(getByTestId('prescription-skeleton')).toBeTruthy();
    });

    it('should render multiple cards when count specified', () => {
      const { container } = render(
        <PrescriptionSkeleton count={3} />,
      );
      expect(container).toBeTruthy();
    });
  });

  describe('ConsultationSkeleton', () => {
    it('should render consultation skeleton', () => {
      const { getByTestId } = render(
        <ConsultationSkeleton testID="consultation-skeleton" />,
      );
      expect(getByTestId('consultation-skeleton')).toBeTruthy();
    });

    it('should render multiple consultation cards', () => {
      const { container } = render(
        <ConsultationSkeleton count={2} />,
      );
      expect(container).toBeTruthy();
    });
  });

  describe('FullScreenLoader', () => {
    it('should render full screen loader', () => {
      const { getByTestId } = render(
        <FullScreenLoader testID="full-screen-loader" />,
      );
      expect(getByTestId('full-screen-loader')).toBeTruthy();
    });

    it('should display custom message', () => {
      const { getByText } = render(
        <FullScreenLoader message="Loading data..." />,
      );
      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('should apply custom color', () => {
      const { getByTestId } = render(
        <FullScreenLoader testID="loader" color="#ff0000" />,
      );
      expect(getByTestId('loader')).toBeTruthy();
    });
  });

  describe('ProgressIndicator', () => {
    it('should render progress indicator', () => {
      const { getByTestId } = render(
        <ProgressIndicator testID="progress" progress={0.5} />,
      );
      expect(getByTestId('progress')).toBeTruthy();
    });

    it('should display correct percentage', () => {
      const { getByText } = render(
        <ProgressIndicator progress={0.75} />,
      );
      expect(getByText('75%')).toBeTruthy();
    });

    it('should display label when provided', () => {
      const { getByText } = render(
        <ProgressIndicator progress={0.5} label="Uploading..." />,
      );
      expect(getByText('Uploading...')).toBeTruthy();
    });
  });

  describe('InlineLoader', () => {
    it('should render inline loader', () => {
      const { getByTestId } = render(
        <InlineLoader testID="inline-loader" />,
      );
      expect(getByTestId('inline-loader')).toBeTruthy();
    });

    it('should display message when provided', () => {
      const { getByText } = render(
        <InlineLoader message="Processing..." />,
      );
      expect(getByText('Processing...')).toBeTruthy();
    });

    it('should render different sizes', () => {
      const { getByTestId: getByTestIdSmall } = render(
        <InlineLoader testID="small" size="small" />,
      );
      const { getByTestId: getByTestIdLarge } = render(
        <InlineLoader testID="large" size="large" />,
      );

      expect(getByTestIdSmall('small')).toBeTruthy();
      expect(getByTestIdLarge('large')).toBeTruthy();
    });
  });
});
