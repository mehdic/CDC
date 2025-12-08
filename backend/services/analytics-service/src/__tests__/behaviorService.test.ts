/**
 * Behavior Service Tests
 * Comprehensive tests for GDPR-compliant behavior tracking
 */

import { BehaviorService } from '../services/behaviorService';
import { EventFactory, EventType } from '../events/userEvents';
import { UserSegment } from '../models/userSegment';

describe('BehaviorService', () => {
  let service: BehaviorService;
  const testUserId = 'test-user-123';
  const testSessionId = 'session-abc-123';

  beforeEach(() => {
    service = new BehaviorService();
  });

  // ============================================================================
  // GDPR Consent Tests
  // ============================================================================

  describe('GDPR Consent Management', () => {
    test('should return false for consent by default', async () => {
      const hasConsent = await service.hasTrackingConsent(testUserId);
      expect(hasConsent).toBe(false);
    });

    test('should grant consent successfully', async () => {
      await service.grantConsent(testUserId);
      const hasConsent = await service.hasTrackingConsent(testUserId);
      expect(hasConsent).toBe(true);
    });

    test('should revoke consent successfully', async () => {
      await service.grantConsent(testUserId);
      await service.revokeConsent(testUserId);
      const hasConsent = await service.hasTrackingConsent(testUserId);
      expect(hasConsent).toBe(false);
    });

    test('should get consent status', async () => {
      const statusBefore = await service.getConsentStatus(testUserId);
      expect(statusBefore.hasConsent).toBe(false);

      await service.grantConsent(testUserId);

      const statusAfter = await service.getConsentStatus(testUserId);
      expect(statusAfter.hasConsent).toBe(true);
      expect(statusAfter.consentDate).toBeDefined();
    });

    test('should delete all user data', async () => {
      await service.grantConsent(testUserId);

      const event = EventFactory.createSessionStart(
        testUserId,
        testSessionId,
        'desktop',
        'Mozilla/5.0'
      );
      await service.trackEvent(event);

      await service.deleteUserData(testUserId);

      const hasConsent = await service.hasTrackingConsent(testUserId);
      const events = await service.getUserEvents(testUserId);

      expect(hasConsent).toBe(false);
      expect(events).toHaveLength(0);
    });
  });

  // ============================================================================
  // Event Tracking Tests
  // ============================================================================

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await service.grantConsent(testUserId);
    });

    test('should reject tracking without consent', async () => {
      const noConsentUserId = 'no-consent-user';
      const event = EventFactory.createSessionStart(
        noConsentUserId,
        testSessionId,
        'desktop',
        'Mozilla/5.0'
      );

      await expect(service.trackEvent(event)).rejects.toThrow('GDPR_CONSENT_REQUIRED');
    });

    test('should track session start event', async () => {
      const event = EventFactory.createSessionStart(
        testUserId,
        testSessionId,
        'desktop',
        'Mozilla/5.0'
      );

      await service.trackEvent(event);

      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EventType.SESSION_START);
      expect(events[0].userId).toBe(testUserId);
    });

    test('should track product view event', async () => {
      const event = EventFactory.createProductView(
        testUserId,
        testSessionId,
        'prod-123',
        'Aspirin 500mg',
        'Medication',
        9.99
      );

      await service.trackEvent(event);

      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EventType.PRODUCT_VIEW);
    });

    test('should track order placed event', async () => {
      const event = EventFactory.createOrderPlaced(
        testUserId,
        testSessionId,
        'order-789',
        99.99,
        3,
        'credit_card'
      );

      await service.trackEvent(event);

      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EventType.ORDER_PLACED);
    });

    test('should track multiple events', async () => {
      const events = [
        EventFactory.createSessionStart(testUserId, testSessionId, 'mobile', 'iOS App'),
        EventFactory.createProductView(testUserId, testSessionId, 'prod-1', 'Product 1', 'Cat A', 10),
        EventFactory.createProductView(testUserId, testSessionId, 'prod-2', 'Product 2', 'Cat B', 20),
        EventFactory.createOrderPlaced(testUserId, testSessionId, 'order-1', 30, 2)
      ];

      for (const event of events) {
        await service.trackEvent(event);
      }

      const trackedEvents = await service.getUserEvents(testUserId);
      expect(trackedEvents).toHaveLength(4);
    });

    test('should limit events returned', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        EventFactory.createPageView(
          testUserId,
          testSessionId,
          `/page-${i}`,
          `Page ${i}`
        )
      );

      for (const event of events) {
        await service.trackEvent(event);
      }

      const limitedEvents = await service.getUserEvents(testUserId, 5);
      expect(limitedEvents).toHaveLength(5);
    });

    test('should return events sorted by timestamp descending', async () => {
      const event1 = EventFactory.createPageView(testUserId, testSessionId, '/page-1', 'Page 1');
      await service.trackEvent(event1);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const event2 = EventFactory.createPageView(testUserId, testSessionId, '/page-2', 'Page 2');
      await service.trackEvent(event2);

      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(2);
      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(events[1].timestamp.getTime());
    });

    test('should filter events by type', async () => {
      await service.trackEvent(
        EventFactory.createSessionStart(testUserId, testSessionId, 'desktop', 'Chrome')
      );
      await service.trackEvent(
        EventFactory.createProductView(testUserId, testSessionId, 'prod-1', 'Prod 1', 'Cat A')
      );
      await service.trackEvent(
        EventFactory.createOrderPlaced(testUserId, testSessionId, 'order-1', 50, 1)
      );

      const orderEvents = await service.getEventsByType(testUserId, EventType.ORDER_PLACED);
      expect(orderEvents).toHaveLength(1);
      expect(orderEvents[0].eventType).toBe(EventType.ORDER_PLACED);
    });

    test('should return empty array for events without consent', async () => {
      await service.revokeConsent(testUserId);
      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(0);
    });
  });

  // ============================================================================
  // User Segmentation Tests
  // ============================================================================

  describe('User Segmentation', () => {
    beforeEach(async () => {
      await service.grantConsent(testUserId);
    });

    test('should return null segment without events', async () => {
      const segment = await service.getUserSegment(testUserId);
      expect(segment).toBeNull();
    });

    test('should classify user as OCCASIONAL_USER with minimal activity', async () => {
      // Create minimal activity
      await service.trackEvent(
        EventFactory.createSessionStart(testUserId, testSessionId, 'mobile', 'App')
      );
      await service.trackEvent(
        EventFactory.createSessionEnd(testUserId, testSessionId, 300)
      );

      const segmentData = await service.getUserSegment(testUserId);
      expect(segmentData).not.toBeNull();
      expect(segmentData!.segment).toBe(UserSegment.OCCASIONAL_USER);
    });

    test('should classify user as POWER_USER with high activity', async () => {
      // Create high activity (multiple sessions and orders)
      for (let i = 0; i < 25; i++) {
        const sessionId = `session-${i}`;
        await service.trackEvent(
          EventFactory.createSessionStart(testUserId, sessionId, 'desktop', 'Chrome')
        );
        await service.trackEvent(
          EventFactory.createProductView(testUserId, sessionId, `prod-${i}`, `Product ${i}`, 'Category A')
        );
      }

      // Add orders
      for (let i = 0; i < 5; i++) {
        await service.trackEvent(
          EventFactory.createOrderPlaced(testUserId, `session-${i}`, `order-${i}`, 100, 2)
        );
      }

      const segmentData = await service.getUserSegment(testUserId);
      expect(segmentData).not.toBeNull();
      expect(segmentData!.segment).toBe(UserSegment.POWER_USER);
      expect(segmentData!.priority).toBe('critical');
    });

    test('should include segment description and recommended actions', async () => {
      await service.trackEvent(
        EventFactory.createSessionStart(testUserId, testSessionId, 'mobile', 'App')
      );

      const segmentData = await service.getUserSegment(testUserId);
      expect(segmentData).not.toBeNull();
      expect(segmentData!.description).toBeDefined();
      expect(segmentData!.recommendedActions).toBeInstanceOf(Array);
      expect(segmentData!.recommendedActions.length).toBeGreaterThan(0);
    });

    test('should calculate engagement score', async () => {
      // Create moderate activity
      for (let i = 0; i < 10; i++) {
        await service.trackEvent(
          EventFactory.createSessionStart(testUserId, `session-${i}`, 'desktop', 'Chrome')
        );
      }

      const segmentData = await service.getUserSegment(testUserId);
      expect(segmentData).not.toBeNull();
      expect(segmentData!.metrics.engagementScore).toBeGreaterThanOrEqual(0);
      expect(segmentData!.metrics.engagementScore).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // Churn Prediction Tests
  // ============================================================================

  describe('Churn Prediction', () => {
    beforeEach(async () => {
      await service.grantConsent(testUserId);
    });

    test('should return null churn risk without events', async () => {
      const churnData = await service.getChurnRisk(testUserId);
      expect(churnData).toBeNull();
    });

    test('should calculate churn risk with low value for active users', async () => {
      // Create recent activity
      for (let i = 0; i < 15; i++) {
        await service.trackEvent(
          EventFactory.createSessionStart(testUserId, `session-${i}`, 'desktop', 'Chrome')
        );
      }

      await service.trackEvent(
        EventFactory.createOrderPlaced(testUserId, testSessionId, 'order-1', 100, 2)
      );

      const churnData = await service.getChurnRisk(testUserId);
      expect(churnData).not.toBeNull();
      expect(churnData!.churnRisk).toBeLessThan(0.5);
      expect(churnData!.riskLevel).toMatch(/low|medium/);
    });

    test('should identify contributing churn factors', async () => {
      await service.trackEvent(
        EventFactory.createSessionStart(testUserId, testSessionId, 'mobile', 'App')
      );

      const churnData = await service.getChurnRisk(testUserId);
      expect(churnData).not.toBeNull();
      expect(churnData!.factors).toBeInstanceOf(Array);
    });
  });

  // ============================================================================
  // Analytics Queries Tests
  // ============================================================================

  describe('Analytics Queries', () => {
    const user1 = 'user-1';
    const user2 = 'user-2';
    const user3 = 'user-3';

    beforeEach(async () => {
      await service.grantConsent(user1);
      await service.grantConsent(user2);
      await service.grantConsent(user3);
    });

    test('should get users by segment', async () => {
      // Create activity for user1 (OCCASIONAL)
      await service.trackEvent(
        EventFactory.createSessionStart(user1, 'session-1', 'mobile', 'App')
      );

      // Create high activity for user2 (POWER_USER)
      for (let i = 0; i < 25; i++) {
        await service.trackEvent(
          EventFactory.createSessionStart(user2, `session-${i}`, 'desktop', 'Chrome')
        );
      }
      for (let i = 0; i < 5; i++) {
        await service.trackEvent(
          EventFactory.createOrderPlaced(user2, `session-${i}`, `order-${i}`, 100, 2)
        );
      }

      const occasionalUsers = await service.getUsersBySegment(UserSegment.OCCASIONAL_USER);
      expect(occasionalUsers).toContain(user1);

      const powerUsers = await service.getUsersBySegment(UserSegment.POWER_USER);
      expect(powerUsers).toContain(user2);
    });

    test('should get at-risk users', async () => {
      // Create some activity for user1
      await service.trackEvent(
        EventFactory.createSessionStart(user1, 'session-1', 'mobile', 'App')
      );

      // Create high-risk scenario for user2 (minimal activity)
      await service.trackEvent(
        EventFactory.createSessionStart(user2, 'session-1', 'mobile', 'App')
      );

      const atRiskUsers = await service.getAtRiskUsers(0.3);
      expect(atRiskUsers.length).toBeGreaterThanOrEqual(0);
      expect(atRiskUsers.every(u => u.churnRisk >= 0.3)).toBe(true);
    });

    test('should get service statistics', async () => {
      await service.trackEvent(
        EventFactory.createSessionStart(user1, 'session-1', 'mobile', 'App')
      );
      await service.trackEvent(
        EventFactory.createSessionStart(user2, 'session-1', 'mobile', 'App')
      );

      const stats = await service.getStatistics();
      expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
      expect(stats.usersWithConsent).toBeGreaterThanOrEqual(2);
      expect(stats.totalEvents).toBeGreaterThanOrEqual(2);
      expect(stats.segmentDistribution).toBeDefined();
    });
  });

  // ============================================================================
  // GDPR Compliance Tests
  // ============================================================================

  describe('GDPR Compliance', () => {
    test('should not track events without consent', async () => {
      const event = EventFactory.createSessionStart(
        testUserId,
        testSessionId,
        'desktop',
        'Chrome'
      );

      await expect(service.trackEvent(event)).rejects.toThrow('GDPR_CONSENT_REQUIRED');
    });

    test('should not return segment data without consent', async () => {
      const segment = await service.getUserSegment(testUserId);
      expect(segment).toBeNull();
    });

    test('should not return churn data without consent', async () => {
      const churnData = await service.getChurnRisk(testUserId);
      expect(churnData).toBeNull();
    });

    test('should not return events without consent', async () => {
      const events = await service.getUserEvents(testUserId);
      expect(events).toHaveLength(0);
    });

    test('should stop tracking after consent revoked', async () => {
      await service.grantConsent(testUserId);

      const event1 = EventFactory.createSessionStart(testUserId, testSessionId, 'mobile', 'App');
      await service.trackEvent(event1);

      await service.revokeConsent(testUserId);

      const event2 = EventFactory.createSessionEnd(testUserId, testSessionId, 300);
      await expect(service.trackEvent(event2)).rejects.toThrow('GDPR_CONSENT_REQUIRED');
    });

    test('should completely erase user data on request', async () => {
      await service.grantConsent(testUserId);

      // Create events
      for (let i = 0; i < 5; i++) {
        await service.trackEvent(
          EventFactory.createPageView(testUserId, testSessionId, `/page-${i}`, `Page ${i}`)
        );
      }

      // Verify data exists
      let events = await service.getUserEvents(testUserId);
      expect(events.length).toBeGreaterThan(0);

      // Delete all data
      await service.deleteUserData(testUserId);

      // Verify complete erasure
      const hasConsent = await service.hasTrackingConsent(testUserId);
      events = await service.getUserEvents(testUserId);
      const segment = await service.getUserSegment(testUserId);

      expect(hasConsent).toBe(false);
      expect(events).toHaveLength(0);
      expect(segment).toBeNull();
    });
  });
});
