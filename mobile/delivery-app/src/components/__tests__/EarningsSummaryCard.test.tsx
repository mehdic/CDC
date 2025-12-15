/**
 * EarningsSummaryCard Component Unit Tests
 * Comprehensive tests for earnings breakdown card
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { EarningsSummaryCard, EarningsSummaryData } from '../EarningsSummaryCard';

describe('EarningsSummaryCard Component', () => {
  const mockData: EarningsSummaryData = {
    gross: 100,
    fees: 15,
    net: 85,
    previousPeriod: {
      gross: 92,
      net: 78.2,
    },
  };

  describe('Rendering', () => {
    it('should render earnings summary card', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card')).toBeTruthy();
    });

    it('should render card title', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const title = getByTestId('earnings-summary-card-title');
      expect(title.props.children).toBe('Earnings Breakdown');
    });

    it('should render gross earnings section', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card-gross-row')).toBeTruthy();
      expect(getByTestId('earnings-summary-card-gross-label')).toBeTruthy();
    });

    it('should render fees section', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card-fees-row')).toBeTruthy();
      expect(getByTestId('earnings-summary-card-fees-label')).toBeTruthy();
    });

    it('should render net earnings section', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card-net-row')).toBeTruthy();
      expect(getByTestId('earnings-summary-card-net-label')).toBeTruthy();
    });

    it('should render divider', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card-divider')).toBeTruthy();
    });
  });

  describe('Values Display', () => {
    it('should display gross earnings value', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const grossValue = getByTestId('earnings-summary-card-gross-value');
      const children = grossValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('100.00');
    });

    it('should display fees value', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const feesValue = getByTestId('earnings-summary-card-fees-value');
      const children = feesValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('15.00');
    });

    it('should display net earnings value', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const netValue = getByTestId('earnings-summary-card-net-value');
      const children = netValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('85.00');
    });

    it('should display fee percentage in description', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const feesDesc = getByTestId('earnings-summary-card-fees-description');
      const children = feesDesc.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('15.0%');
    });

    it('should handle zero earnings', () => {
      const zeroData: EarningsSummaryData = {
        gross: 0,
        fees: 0,
        net: 0,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={zeroData} period="month" />
      );

      const netValue = getByTestId('earnings-summary-card-net-value');
      const children = netValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('0.00');
    });

    it('should format currency correctly', () => {
      const currencyData: EarningsSummaryData = {
        gross: 123.456,
        fees: 18.518,
        net: 104.938,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={currencyData} period="month" />
      );

      const grossValue = getByTestId('earnings-summary-card-gross-value');
      const children = grossValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('123.46');
    });
  });

  describe('Comparison Functionality', () => {
    it('should display comparison when previous period data exists', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card-comparison')).toBeTruthy();
    });

    it('should show positive change percentage', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const changePercentage = getByTestId('earnings-summary-card-change-percentage');
      const children = changePercentage.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('↑');
      expect(childrenText).toMatch(/\d+\.\d+%/); // Contains a percentage
    });

    it('should show negative change percentage', () => {
      const negativeData: EarningsSummaryData = {
        gross: 100,
        fees: 15,
        net: 85,
        previousPeriod: {
          gross: 120,
          net: 102,
        },
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={negativeData} period="month" />
      );

      const changePercentage = getByTestId('earnings-summary-card-change-percentage');
      expect(changePercentage.props.children).toContain('↓');
    });

    it('should not show comparison when no previous period', () => {
      const noPrevData: EarningsSummaryData = {
        gross: 100,
        fees: 15,
        net: 85,
      };

      const { queryByTestId } = render(
        <EarningsSummaryCard data={noPrevData} period="month" />
      );

      expect(queryByTestId('earnings-summary-card-comparison')).toBeFalsy();
    });

    it('should display comparison message', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="week" />
      );

      const comparison = getByTestId('earnings-summary-card-comparison');
      const textChild = comparison.props.children;
      const text = textChild.props?.children || '';
      expect(text).toContain('last week');
    });
  });

  describe('Period Display', () => {
    it('should display day period in comparison message', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="day" />
      );

      const comparison = getByTestId('earnings-summary-card-comparison');
      const textChild = comparison.props.children;
      const text = textChild.props?.children || '';
      expect(text).toContain('last day');
    });

    it('should display week period in comparison message', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="week" />
      );

      const comparison = getByTestId('earnings-summary-card-comparison');
      const textChild = comparison.props.children;
      const text = textChild.props?.children || '';
      expect(text).toContain('last week');
    });

    it('should display month period in comparison message', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      const comparison = getByTestId('earnings-summary-card-comparison');
      const textChild = comparison.props.children;
      const text = textChild.props?.children || '';
      expect(text).toContain('last month');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero fees', () => {
      const zeroFeesData: EarningsSummaryData = {
        gross: 100,
        fees: 0,
        net: 100,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={zeroFeesData} period="month" />
      );

      const feesDesc = getByTestId('earnings-summary-card-fees-description');
      const children = feesDesc.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('0.0%');
    });

    it('should handle high fee percentage', () => {
      const highFeeData: EarningsSummaryData = {
        gross: 100,
        fees: 50,
        net: 50,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={highFeeData} period="month" />
      );

      const feesDesc = getByTestId('earnings-summary-card-fees-description');
      const children = feesDesc.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('50.0%');
    });

    it('should handle very small earnings', () => {
      const smallData: EarningsSummaryData = {
        gross: 0.01,
        fees: 0.0015,
        net: 0.0085,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={smallData} period="month" />
      );

      const netValue = getByTestId('earnings-summary-card-net-value');
      const children = netValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('0.01');
    });

    it('should handle large earnings', () => {
      const largeData: EarningsSummaryData = {
        gross: 9999.99,
        fees: 1499.9985,
        net: 8499.9915,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={largeData} period="month" />
      );

      const netValue = getByTestId('earnings-summary-card-net-value');
      const children = netValue.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('8499.99');
    });

    it('should handle equal gross and net (no fees)', () => {
      const noFeesData: EarningsSummaryData = {
        gross: 100,
        fees: 0,
        net: 100,
      };

      const { getByTestId } = render(
        <EarningsSummaryCard data={noFeesData} period="month" />
      );

      const grossValue = getByTestId('earnings-summary-card-gross-value');
      const netValue = getByTestId('earnings-summary-card-net-value');
      const grossChildren = grossValue.props.children;
      const netChildren = netValue.props.children;
      const grossText = Array.isArray(grossChildren) ? grossChildren.join('') : grossChildren;
      const netText = Array.isArray(netChildren) ? netChildren.join('') : netChildren;
      expect(grossText).toContain('100.00');
      expect(netText).toContain('100.00');
    });
  });

  describe('Style and Accessibility', () => {
    it('should accept custom testID', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" testID="custom-earnings" />
      );

      expect(getByTestId('custom-earnings')).toBeTruthy();
    });

    it('should apply default testID when not provided', () => {
      const { getByTestId } = render(
        <EarningsSummaryCard data={mockData} period="month" />
      );

      expect(getByTestId('earnings-summary-card')).toBeTruthy();
    });
  });
});
