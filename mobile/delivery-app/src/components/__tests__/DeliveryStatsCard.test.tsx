/**
 * DeliveryStatsCard Component Unit Tests
 * Comprehensive tests for delivery statistics card
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { DeliveryStatsCard, DeliveryStatistics } from '../DeliveryStatsCard';

describe('DeliveryStatsCard Component', () => {
  const mockStats: DeliveryStatistics = {
    count: 8,
    totalDistance: 42.5,
    averageTime: 35,
    onTimeRate: 0.92,
  };

  describe('Rendering', () => {
    it('should render delivery stats card', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });

    it('should render card title', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const title = getByTestId('delivery-stats-card-title');
      expect(title.props.children).toBe('Delivery Statistics');
    });

    it('should render delivery count section', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card-count-container')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-count-value')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-count-label')).toBeTruthy();
    });

    it('should render distance section', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card-distance-value')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-distance-label')).toBeTruthy();
    });

    it('should render average time section', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card-time-value')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-time-label')).toBeTruthy();
    });

    it('should render on-time rate section', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card-ontime-container')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-ontime-progress')).toBeTruthy();
      expect(getByTestId('delivery-stats-card-ontime-value')).toBeTruthy();
    });

    it('should render average per delivery section', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card-average-container')).toBeTruthy();
    });
  });

  describe('Values Display', () => {
    it('should display delivery count', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const countValue = getByTestId('delivery-stats-card-count-value');
      expect(String(countValue.props.children)).toBe('8');
    });

    it('should display total distance with one decimal', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const distanceValue = getByTestId('delivery-stats-card-distance-value');
      expect(distanceValue.props.children).toContain('42.5');
    });

    it('should display average time in minutes', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const timeValue = getByTestId('delivery-stats-card-time-value');
      expect(timeValue.props.children).toBe('35min');
    });

    it('should display on-time rate as percentage', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const ontimeValue = getByTestId('delivery-stats-card-ontime-value');
      const children = ontimeValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('92%');
    });

    it('should format time in hours and minutes when >= 60 minutes', () => {
      const statsWithLongTime: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 95,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsWithLongTime} period="day" />
      );

      const timeValue = getByTestId('delivery-stats-card-time-value');
      expect(timeValue.props.children).toContain('h');
    });

    it('should display average distance per delivery', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const avgDistanceValue = getByTestId('delivery-stats-card-average-distance-value');
      // 42.5 / 8 = 5.3125 → formatted as 5.3
      const children = avgDistanceValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('5.3');
    });
  });

  describe('Time Formatting', () => {
    it('should format time under 60 minutes as minutes', () => {
      const statsMinutes: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 45,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsMinutes} period="day" />
      );

      const timeValue = getByTestId('delivery-stats-card-time-value');
      expect(timeValue.props.children).toBe('45min');
    });

    it('should format time as hours and minutes when >= 60', () => {
      const statsHours: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 125,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsHours} period="day" />
      );

      const timeValue = getByTestId('delivery-stats-card-time-value');
      expect(timeValue.props.children).toBe('2h 5m');
    });

    it('should format time exactly at 60 minutes', () => {
      const statsExactHour: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 60,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsExactHour} period="day" />
      );

      const timeValue = getByTestId('delivery-stats-card-time-value');
      expect(timeValue.props.children).toBe('1h 0m');
    });
  });

  describe('Progress Bar Display', () => {
    it('should show progress bar at correct percentage', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      const progressFill = getByTestId('delivery-stats-card-ontime-progress');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle).toBeDefined();
      expect(widthStyle.width).toBe('92%');
    });

    it('should cap progress bar at 100%', () => {
      const statsOver100: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 35,
        onTimeRate: 1.5,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsOver100} period="day" />
      );

      const progressFill = getByTestId('delivery-stats-card-ontime-progress');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('100%');
    });

    it('should show 0% progress for zero on-time rate', () => {
      const statsZeroRate: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 35,
        onTimeRate: 0,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={statsZeroRate} period="day" />
      );

      const progressFill = getByTestId('delivery-stats-card-ontime-progress');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('0%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero deliveries', () => {
      const zeroStats: DeliveryStatistics = {
        count: 0,
        totalDistance: 0,
        averageTime: 0,
      };

      const { getByTestId, queryByTestId } = render(
        <DeliveryStatsCard data={zeroStats} period="day" />
      );

      const countValue = getByTestId('delivery-stats-card-count-value');
      expect(String(countValue.props.children)).toBe('0');

      // Average container should not render when count is 0
      expect(queryByTestId('delivery-stats-card-average-container')).toBeFalsy();
    });

    it('should handle zero distance', () => {
      const zeroDistance: DeliveryStatistics = {
        count: 5,
        totalDistance: 0,
        averageTime: 35,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={zeroDistance} period="day" />
      );

      const distanceValue = getByTestId('delivery-stats-card-distance-value');
      expect(distanceValue.props.children).toBe('0.0');
    });

    it('should handle very large distance values', () => {
      const largeDistance: DeliveryStatistics = {
        count: 100,
        totalDistance: 5000.123,
        averageTime: 35,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={largeDistance} period="day" />
      );

      const distanceValue = getByTestId('delivery-stats-card-distance-value');
      expect(distanceValue.props.children).toBe('5000.1');
    });

    it('should handle decimal distances correctly', () => {
      const decimalDistance: DeliveryStatistics = {
        count: 8,
        totalDistance: 42.456,
        averageTime: 35,
      };

      const { getByTestId } = render(
        <DeliveryStatsCard data={decimalDistance} period="day" />
      );

      const distanceValue = getByTestId('delivery-stats-card-distance-value');
      expect(distanceValue.props.children).toBe('42.5');
    });

    it('should handle on-time rate without value', () => {
      const noRateStats: DeliveryStatistics = {
        count: 5,
        totalDistance: 30,
        averageTime: 35,
      };

      const { queryByTestId } = render(
        <DeliveryStatsCard data={noRateStats} period="day" />
      );

      expect(queryByTestId('delivery-stats-card-ontime-container')).toBeFalsy();
    });
  });

  describe('Period Display', () => {
    it('should render with day period', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });

    it('should render with week period', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="week" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });

    it('should render with month period', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="month" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });

    it('should render with custom period', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="custom" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });
  });

  describe('Style and Accessibility', () => {
    it('should accept custom testID', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" testID="custom-stats" />
      );

      expect(getByTestId('custom-stats')).toBeTruthy();
    });

    it('should apply default testID when not provided', () => {
      const { getByTestId } = render(
        <DeliveryStatsCard data={mockStats} period="day" />
      );

      expect(getByTestId('delivery-stats-card')).toBeTruthy();
    });
  });
});
