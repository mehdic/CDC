/**
 * User Segmentation Model
 * Defines user segments based on behavior patterns
 */

export enum UserSegment {
  POWER_USER = 'POWER_USER',           // High engagement, frequent orders
  REGULAR_USER = 'REGULAR_USER',       // Consistent engagement, regular orders
  OCCASIONAL_USER = 'OCCASIONAL_USER', // Low engagement, infrequent orders
  AT_RISK = 'AT_RISK',                 // Declining engagement
  CHURNED = 'CHURNED'                  // No recent activity
}

/**
 * User behavior metrics for segmentation
 */
export interface UserBehaviorMetrics {
  userId: string;
  totalSessions: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastActivityDate: Date;
  daysSinceLastActivity: number;
  sessionFrequency: number; // sessions per month
  orderFrequency: number;   // orders per month
  engagementScore: number;  // 0-100
  churnRisk: number;        // 0-1 (probability)
}

/**
 * Segment thresholds configuration
 */
export interface SegmentThresholds {
  powerUser: {
    minSessionsPerMonth: number;
    minOrdersPerMonth: number;
    minEngagementScore: number;
  };
  regularUser: {
    minSessionsPerMonth: number;
    minOrdersPerMonth: number;
    minEngagementScore: number;
  };
  atRisk: {
    maxDaysSinceLastActivity: number;
    maxEngagementScore: number;
  };
  churned: {
    minDaysSinceLastActivity: number;
  };
}

/**
 * Default segment thresholds
 */
export const DEFAULT_THRESHOLDS: SegmentThresholds = {
  powerUser: {
    minSessionsPerMonth: 20,
    minOrdersPerMonth: 4,
    minEngagementScore: 80
  },
  regularUser: {
    minSessionsPerMonth: 8,
    minOrdersPerMonth: 2,
    minEngagementScore: 50
  },
  atRisk: {
    maxDaysSinceLastActivity: 45,
    maxEngagementScore: 40
  },
  churned: {
    minDaysSinceLastActivity: 90
  }
};

/**
 * User segment assignment logic
 */
export class UserSegmentClassifier {
  private thresholds: SegmentThresholds;

  constructor(thresholds: SegmentThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Classify user into segment based on behavior metrics
   */
  classifyUser(metrics: UserBehaviorMetrics): UserSegment {
    // Churned users (no activity for 90+ days)
    if (metrics.daysSinceLastActivity >= this.thresholds.churned.minDaysSinceLastActivity) {
      return UserSegment.CHURNED;
    }

    // At-risk users (declining engagement)
    if (
      metrics.daysSinceLastActivity > this.thresholds.atRisk.maxDaysSinceLastActivity ||
      (metrics.engagementScore < this.thresholds.atRisk.maxEngagementScore &&
       metrics.daysSinceLastActivity > 30)
    ) {
      return UserSegment.AT_RISK;
    }

    // Power users (high engagement and orders)
    if (
      metrics.sessionFrequency >= this.thresholds.powerUser.minSessionsPerMonth &&
      metrics.orderFrequency >= this.thresholds.powerUser.minOrdersPerMonth &&
      metrics.engagementScore >= this.thresholds.powerUser.minEngagementScore
    ) {
      return UserSegment.POWER_USER;
    }

    // Regular users (consistent engagement)
    if (
      metrics.sessionFrequency >= this.thresholds.regularUser.minSessionsPerMonth &&
      metrics.orderFrequency >= this.thresholds.regularUser.minOrdersPerMonth &&
      metrics.engagementScore >= this.thresholds.regularUser.minEngagementScore
    ) {
      return UserSegment.REGULAR_USER;
    }

    // Default: occasional user
    return UserSegment.OCCASIONAL_USER;
  }

  /**
   * Calculate engagement score (0-100)
   * Based on multiple factors: sessions, orders, recency
   */
  calculateEngagementScore(metrics: UserBehaviorMetrics): number {
    let score = 0;

    // Session frequency component (max 30 points)
    const sessionScore = Math.min(30, (metrics.sessionFrequency / 20) * 30);
    score += sessionScore;

    // Order frequency component (max 30 points)
    const orderScore = Math.min(30, (metrics.orderFrequency / 4) * 30);
    score += orderScore;

    // Recency component (max 25 points)
    const recencyScore = Math.max(0, 25 - (metrics.daysSinceLastActivity / 90) * 25);
    score += recencyScore;

    // Revenue component (max 15 points)
    const revenueScore = Math.min(15, (metrics.totalRevenue / 1000) * 15);
    score += revenueScore;

    return Math.round(Math.min(100, score));
  }

  /**
   * Calculate churn risk (0-1 probability)
   * Higher values indicate higher risk of churning
   */
  calculateChurnRisk(metrics: UserBehaviorMetrics): number {
    let risk = 0;

    // Days since last activity (max 0.4)
    const daysFactor = Math.min(0.4, (metrics.daysSinceLastActivity / 90) * 0.4);
    risk += daysFactor;

    // Low engagement score (max 0.3)
    const engagementFactor = Math.max(0, 0.3 - (metrics.engagementScore / 100) * 0.3);
    risk += engagementFactor;

    // Declining order frequency (max 0.2)
    const orderFactor = Math.max(0, 0.2 - (metrics.orderFrequency / 4) * 0.2);
    risk += orderFactor;

    // Declining session frequency (max 0.1)
    const sessionFactor = Math.max(0, 0.1 - (metrics.sessionFrequency / 20) * 0.1);
    risk += sessionFactor;

    return Math.min(1, Math.round(risk * 100) / 100);
  }

  /**
   * Get segment description
   */
  getSegmentDescription(segment: UserSegment): string {
    const descriptions: Record<UserSegment, string> = {
      [UserSegment.POWER_USER]: 'Highly engaged user with frequent purchases and high activity',
      [UserSegment.REGULAR_USER]: 'Consistent user with regular purchases and good engagement',
      [UserSegment.OCCASIONAL_USER]: 'Low engagement user with infrequent purchases',
      [UserSegment.AT_RISK]: 'User showing signs of declining engagement, needs attention',
      [UserSegment.CHURNED]: 'Inactive user with no recent activity, likely churned'
    };
    return descriptions[segment];
  }

  /**
   * Get recommended actions for segment
   */
  getRecommendedActions(segment: UserSegment): string[] {
    const actions: Record<UserSegment, string[]> = {
      [UserSegment.POWER_USER]: [
        'Offer VIP rewards and exclusive access',
        'Invite to beta features',
        'Request feedback and testimonials',
        'Provide priority support'
      ],
      [UserSegment.REGULAR_USER]: [
        'Send regular newsletters with personalized offers',
        'Encourage loyalty program enrollment',
        'Highlight new features',
        'Provide seasonal promotions'
      ],
      [UserSegment.OCCASIONAL_USER]: [
        'Send re-engagement campaigns',
        'Offer incentives for next purchase',
        'Provide educational content',
        'Simplify purchase process'
      ],
      [UserSegment.AT_RISK]: [
        'Send win-back campaign immediately',
        'Offer significant discount or incentive',
        'Request feedback on issues',
        'Highlight missed benefits',
        'Personal outreach from support team'
      ],
      [UserSegment.CHURNED]: [
        'Send reactivation campaign',
        'Offer substantial comeback incentive',
        'Ask for feedback on why they left',
        'Highlight platform improvements',
        'Consider removal from active marketing'
      ]
    };
    return actions[segment];
  }

  /**
   * Get segment priority level (for marketing/support)
   */
  getSegmentPriority(segment: UserSegment): 'critical' | 'high' | 'medium' | 'low' {
    const priorities: Record<UserSegment, 'critical' | 'high' | 'medium' | 'low'> = {
      [UserSegment.POWER_USER]: 'critical',
      [UserSegment.AT_RISK]: 'high',
      [UserSegment.REGULAR_USER]: 'medium',
      [UserSegment.OCCASIONAL_USER]: 'medium',
      [UserSegment.CHURNED]: 'low'
    };
    return priorities[segment];
  }
}

/**
 * User segment data with metadata
 */
export interface UserSegmentData {
  userId: string;
  segment: UserSegment;
  metrics: UserBehaviorMetrics;
  description: string;
  recommendedActions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  calculatedAt: Date;
}
