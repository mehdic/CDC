/**
 * Behavioral Tracking Service Unit Tests
 * T5-031: Test behavioral tracking functionality
 */

import { BehaviorTrackingService } from '../src/services/behaviorTracking.service';
import { EventType } from '../../../shared/models/UserBehaviorEvent';

describe('BehaviorTrackingService', () => {
  let service: BehaviorTrackingService;

  beforeEach(() => {
    service = new BehaviorTrackingService();
  });

  describe('trackEvent', () => {
    it('should track a valid event with consent', async () => {
      const request = {
        userId: 'user-123',
        eventType: EventType.PRODUCT_VIEW,
        productId: 'product-456',
        sessionId: 'session-789',
        consentGiven: true,
        eventData: { category: 'medications' },
      };

      const event = await service.trackEvent(request);

      expect(event).toBeDefined();
      expect(event.user_id).toBe('user-123');
      expect(event.event_type).toBe(EventType.PRODUCT_VIEW);
      expect(event.product_id).toBe('product-456');
      expect(event.consent_given).toBe(true);
    });

    it('should reject tracking without consent (GDPR)', async () => {
      const request = {
        userId: 'user-123',
        eventType: EventType.PRODUCT_VIEW,
        sessionId: 'session-789',
        consentGiven: false,
      };

      await expect(service.trackEvent(request)).rejects.toThrow(
        'User consent required for behavioral tracking (GDPR compliance)'
      );
    });

    it('should track events across multiple sessions', async () => {
      const request1 = {
        userId: 'user-123',
        eventType: EventType.PRODUCT_VIEW,
        sessionId: 'session-1',
        consentGiven: true,
      };

      const request2 = {
        userId: 'user-123',
        eventType: EventType.ADD_TO_CART,
        sessionId: 'session-2',
        consentGiven: true,
      };

      await service.trackEvent(request1);
      await service.trackEvent(request2);

      const pattern = await service.getUserBehaviorPattern('user-123');
      expect(pattern).toBeDefined();
    });
  });

  describe('getUserBehaviorPattern', () => {
    it('should return null for users with no events', async () => {
      const pattern = await service.getUserBehaviorPattern('unknown-user');
      expect(pattern).toBeNull();
    });

    it('should analyze behavior patterns', async () => {
      // Track multiple events
      const events = [
        {
          userId: 'user-123',
          eventType: EventType.PRODUCT_VIEW,
          productId: 'product-1',
          sessionId: 'session-1',
          consentGiven: true,
          eventData: { category: 'vitamins' },
        },
        {
          userId: 'user-123',
          eventType: EventType.PRODUCT_VIEW,
          productId: 'product-1',
          sessionId: 'session-1',
          consentGiven: true,
          eventData: { category: 'vitamins' },
        },
        {
          userId: 'user-123',
          eventType: EventType.CHECKOUT_COMPLETE,
          sessionId: 'session-1',
          consentGiven: true,
        },
      ];

      for (const event of events) {
        await service.trackEvent(event);
      }

      const pattern = await service.getUserBehaviorPattern('user-123');

      expect(pattern).toBeDefined();
      expect(pattern?.userId).toBe('user-123');
      expect(pattern?.mostViewedCategories).toContain('vitamins');
      expect(pattern?.frequentProducts).toContain('product-1');
    });
  });

  describe('getUserJourney', () => {
    it('should return journey for valid session', async () => {
      const requests = [
        {
          userId: 'user-123',
          eventType: EventType.PAGE_VIEW,
          sessionId: 'session-1',
          consentGiven: true,
        },
        {
          userId: 'user-123',
          eventType: EventType.PRODUCT_VIEW,
          sessionId: 'session-1',
          consentGiven: true,
        },
        {
          userId: 'user-123',
          eventType: EventType.ADD_TO_CART,
          sessionId: 'session-1',
          consentGiven: true,
        },
      ];

      for (const request of requests) {
        await service.trackEvent(request);
      }

      const journey = await service.getUserJourney('user-123', 'session-1');

      expect(journey).toBeDefined();
      expect(journey?.events.length).toBe(3);
      expect(journey?.converted).toBe(false);
    });

    it('should detect conversion in journey', async () => {
      const requests = [
        {
          userId: 'user-123',
          eventType: EventType.PRODUCT_VIEW,
          sessionId: 'session-2',
          consentGiven: true,
        },
        {
          userId: 'user-123',
          eventType: EventType.CHECKOUT_COMPLETE,
          sessionId: 'session-2',
          consentGiven: true,
        },
      ];

      for (const request of requests) {
        await service.trackEvent(request);
      }

      const journey = await service.getUserJourney('user-123', 'session-2');

      expect(journey?.converted).toBe(true);
    });
  });

  describe('GDPR Compliance', () => {
    beforeEach(async () => {
      // Setup test data
      await service.trackEvent({
        userId: 'user-gdpr',
        eventType: EventType.PRODUCT_VIEW,
        sessionId: 'session-1',
        consentGiven: true,
      });
    });

    it('should delete user data (right to be forgotten)', async () => {
      const deleted = await service.deleteUserData('user-gdpr');
      expect(deleted).toBe(true);

      const pattern = await service.getUserBehaviorPattern('user-gdpr');
      expect(pattern).toBeNull();
    });

    it('should anonymize user data', async () => {
      const anonymized = await service.anonymizeUserData('user-gdpr');
      expect(anonymized).toBe(true);

      const pattern = await service.getUserBehaviorPattern('user-gdpr');
      expect(pattern).toBeNull(); // Original user ID should be gone
    });
  });

  describe('getActiveSessions', () => {
    it('should count active sessions within time window', async () => {
      await service.trackEvent({
        userId: 'user-123',
        eventType: EventType.PRODUCT_VIEW,
        sessionId: 'session-1',
        consentGiven: true,
      });

      await service.trackEvent({
        userId: 'user-123',
        eventType: EventType.PRODUCT_VIEW,
        sessionId: 'session-2',
        consentGiven: true,
      });

      const count = await service.getActiveSessions('user-123', 30);
      expect(count).toBe(2);
    });
  });
});
