/**
 * Behavior Tracking Service
 * Handles user behavior event tracking with GDPR compliance
 */

import { EventType, UserEvent, isValidEvent } from '../events/userEvents';
import {
  UserSegment,
  UserBehaviorMetrics,
  UserSegmentClassifier,
  UserSegmentData,
  DEFAULT_THRESHOLDS
} from '../models/userSegment';

/**
 * In-memory storage for behavior data
 * In production, this would be a database
 */
interface BehaviorStorage {
  events: Map<string, UserEvent[]>; // userId -> events
  consents: Map<string, boolean>;   // userId -> has consent
  metrics: Map<string, UserBehaviorMetrics>; // userId -> metrics
}

/**
 * GDPR consent status
 */
export interface ConsentStatus {
  hasConsent: boolean;
  consentDate?: Date;
  revokedDate?: Date;
}

/**
 * Behavior Service with GDPR compliance
 */
export class BehaviorService {
  private storage: BehaviorStorage;
  private segmentClassifier: UserSegmentClassifier;

  constructor() {
    this.storage = {
      events: new Map(),
      consents: new Map(),
      metrics: new Map()
    };
    this.segmentClassifier = new UserSegmentClassifier(DEFAULT_THRESHOLDS);
  }

  /**
   * GDPR Consent Management
   */

  /**
   * Check if user has given consent for tracking
   */
  async hasTrackingConsent(userId: string): Promise<boolean> {
    return this.storage.consents.get(userId) || false;
  }

  /**
   * Grant tracking consent for user
   */
  async grantConsent(userId: string): Promise<void> {
    this.storage.consents.set(userId, true);
    console.log(`[BehaviorService] Consent granted for user: ${this.maskUserId(userId)}`);
  }

  /**
   * Revoke tracking consent for user (GDPR Right to Object)
   */
  async revokeConsent(userId: string): Promise<void> {
    this.storage.consents.set(userId, false);
    console.log(`[BehaviorService] Consent revoked for user: ${this.maskUserId(userId)}`);
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteUserData(userId: string): Promise<void> {
    this.storage.events.delete(userId);
    this.storage.consents.delete(userId);
    this.storage.metrics.delete(userId);
    console.log(`[BehaviorService] All data deleted for user: ${this.maskUserId(userId)}`);
  }

  /**
   * Get consent status for user
   */
  async getConsentStatus(userId: string): Promise<ConsentStatus> {
    const hasConsent = this.storage.consents.get(userId) || false;
    return {
      hasConsent,
      consentDate: hasConsent ? new Date() : undefined
    };
  }

  /**
   * Event Tracking
   */

  /**
   * Track user event (with consent verification)
   */
  async trackEvent(event: UserEvent): Promise<void> {
    // CRITICAL: Verify consent before tracking
    const hasConsent = await this.hasTrackingConsent(event.userId);
    if (!hasConsent) {
      throw new Error('GDPR_CONSENT_REQUIRED: User has not consented to tracking');
    }

    // Validate event structure
    if (!isValidEvent(event)) {
      throw new Error('INVALID_EVENT: Event structure is invalid');
    }

    // Store event
    const userEvents = this.storage.events.get(event.userId) || [];
    userEvents.push(event);
    this.storage.events.set(event.userId, userEvents);

    // Update metrics
    await this.updateUserMetrics(event.userId);

    // PII-safe logging
    console.log(`[BehaviorService] Event tracked: ${event.eventType} for user: ${this.maskUserId(event.userId)}`);
  }

  /**
   * Get user events (with consent verification)
   */
  async getUserEvents(userId: string, limit?: number): Promise<UserEvent[]> {
    const hasConsent = await this.hasTrackingConsent(userId);
    if (!hasConsent) {
      return [];
    }

    const events = this.storage.events.get(userId) || [];

    // Sort by timestamp descending
    const sortedEvents = events.sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? sortedEvents.slice(0, limit) : sortedEvents;
  }

  /**
   * Get events by type
   */
  async getEventsByType(userId: string, eventType: EventType): Promise<UserEvent[]> {
    const hasConsent = await this.hasTrackingConsent(userId);
    if (!hasConsent) {
      return [];
    }

    const events = this.storage.events.get(userId) || [];
    return events.filter(e => e.eventType === eventType);
  }

  /**
   * User Segmentation
   */

  /**
   * Get user segment based on behavior
   */
  async getUserSegment(userId: string): Promise<UserSegmentData | null> {
    const hasConsent = await this.hasTrackingConsent(userId);
    if (!hasConsent) {
      return null;
    }

    const metrics = await this.getUserMetrics(userId);
    if (!metrics) {
      return null;
    }

    const segment = this.segmentClassifier.classifyUser(metrics);
    const description = this.segmentClassifier.getSegmentDescription(segment);
    const recommendedActions = this.segmentClassifier.getRecommendedActions(segment);
    const priority = this.segmentClassifier.getSegmentPriority(segment);

    return {
      userId,
      segment,
      metrics,
      description,
      recommendedActions,
      priority,
      calculatedAt: new Date()
    };
  }

  /**
   * Churn Prediction
   */

  /**
   * Calculate churn risk for user
   */
  async getChurnRisk(userId: string): Promise<{ churnRisk: number; riskLevel: string; factors: string[] } | null> {
    const hasConsent = await this.hasTrackingConsent(userId);
    if (!hasConsent) {
      return null;
    }

    const metrics = await this.getUserMetrics(userId);
    if (!metrics) {
      return null;
    }

    const churnRisk = this.segmentClassifier.calculateChurnRisk(metrics);

    // Determine risk level
    let riskLevel = 'low';
    if (churnRisk >= 0.7) riskLevel = 'critical';
    else if (churnRisk >= 0.5) riskLevel = 'high';
    else if (churnRisk >= 0.3) riskLevel = 'medium';

    // Identify contributing factors
    const factors: string[] = [];
    if (metrics.daysSinceLastActivity > 60) {
      factors.push('Long period since last activity');
    }
    if (metrics.engagementScore < 40) {
      factors.push('Low engagement score');
    }
    if (metrics.orderFrequency < 1) {
      factors.push('Very low order frequency');
    }
    if (metrics.sessionFrequency < 4) {
      factors.push('Low session frequency');
    }

    return {
      churnRisk,
      riskLevel,
      factors
    };
  }

  /**
   * Metrics Calculation
   */

  /**
   * Get user behavior metrics
   */
  private async getUserMetrics(userId: string): Promise<UserBehaviorMetrics | null> {
    // Return cached metrics if available
    if (this.storage.metrics.has(userId)) {
      return this.storage.metrics.get(userId)!;
    }

    // Calculate metrics from events
    const events = await this.getUserEvents(userId);
    if (events.length === 0) {
      return null;
    }

    const metrics = this.calculateMetrics(userId, events);
    this.storage.metrics.set(userId, metrics);
    return metrics;
  }

  /**
   * Update user metrics after new event
   */
  private async updateUserMetrics(userId: string): Promise<void> {
    const events = this.storage.events.get(userId) || [];
    const metrics = this.calculateMetrics(userId, events);
    this.storage.metrics.set(userId, metrics);
  }

  /**
   * Calculate behavior metrics from events
   */
  private calculateMetrics(userId: string, events: UserEvent[]): UserBehaviorMetrics {
    // Count sessions
    const uniqueSessions = new Set(events.map(e => e.sessionId));
    const totalSessions = uniqueSessions.size;

    // Count orders
    const orderEvents = events.filter(e => e.eventType === EventType.ORDER_PLACED);
    const totalOrders = orderEvents.length;

    // Calculate revenue
    const totalRevenue = orderEvents.reduce((sum, e: any) => {
      return sum + (e.orderValue || 0);
    }, 0);

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Last activity date
    const sortedEvents = [...events].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    const lastActivityDate = sortedEvents[0]?.timestamp || new Date();

    // Days since last activity
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate date range for frequency calculations
    const oldestEvent = sortedEvents[sortedEvents.length - 1];
    const daysSinceFirstActivity = Math.floor(
      (new Date().getTime() - oldestEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsSinceFirstActivity = Math.max(1, daysSinceFirstActivity / 30);

    // Session and order frequency (per month)
    const sessionFrequency = totalSessions / monthsSinceFirstActivity;
    const orderFrequency = totalOrders / monthsSinceFirstActivity;

    // Initial metrics object
    const metrics: UserBehaviorMetrics = {
      userId,
      totalSessions,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      lastActivityDate,
      daysSinceLastActivity,
      sessionFrequency,
      orderFrequency,
      engagementScore: 0,
      churnRisk: 0
    };

    // Calculate engagement score
    metrics.engagementScore = this.segmentClassifier.calculateEngagementScore(metrics);

    // Calculate churn risk
    metrics.churnRisk = this.segmentClassifier.calculateChurnRisk(metrics);

    return metrics;
  }

  /**
   * Analytics Queries
   */

  /**
   * Get all users in a specific segment
   */
  async getUsersBySegment(segment: UserSegment): Promise<string[]> {
    const userIds: string[] = [];

    for (const [userId] of this.storage.events) {
      const hasConsent = await this.hasTrackingConsent(userId);
      if (!hasConsent) continue;

      const segmentData = await this.getUserSegment(userId);
      if (segmentData && segmentData.segment === segment) {
        userIds.push(userId);
      }
    }

    return userIds;
  }

  /**
   * Get users at risk of churning
   */
  async getAtRiskUsers(minRisk: number = 0.5): Promise<Array<{ userId: string; churnRisk: number }>> {
    const atRiskUsers: Array<{ userId: string; churnRisk: number }> = [];

    for (const [userId] of this.storage.events) {
      const hasConsent = await this.hasTrackingConsent(userId);
      if (!hasConsent) continue;

      const churnData = await this.getChurnRisk(userId);
      if (churnData && churnData.churnRisk >= minRisk) {
        atRiskUsers.push({
          userId,
          churnRisk: churnData.churnRisk
        });
      }
    }

    return atRiskUsers.sort((a, b) => b.churnRisk - a.churnRisk);
  }

  /**
   * Utility Methods
   */

  /**
   * Mask user ID for PII-safe logging
   */
  private maskUserId(userId: string): string {
    if (userId.length <= 8) {
      return '***';
    }
    return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
  }

  /**
   * Get service statistics (aggregated, no PII)
   */
  async getStatistics(): Promise<{
    totalUsers: number;
    usersWithConsent: number;
    totalEvents: number;
    segmentDistribution: Record<UserSegment, number>;
  }> {
    let totalEvents = 0;
    const segmentDistribution: Record<UserSegment, number> = {
      [UserSegment.POWER_USER]: 0,
      [UserSegment.REGULAR_USER]: 0,
      [UserSegment.OCCASIONAL_USER]: 0,
      [UserSegment.AT_RISK]: 0,
      [UserSegment.CHURNED]: 0
    };

    for (const [userId, events] of this.storage.events) {
      const hasConsent = await this.hasTrackingConsent(userId);
      if (hasConsent) {
        totalEvents += events.length;

        const segmentData = await this.getUserSegment(userId);
        if (segmentData) {
          segmentDistribution[segmentData.segment]++;
        }
      }
    }

    return {
      totalUsers: this.storage.events.size,
      usersWithConsent: Array.from(this.storage.consents.values()).filter(c => c).length,
      totalEvents,
      segmentDistribution
    };
  }
}
