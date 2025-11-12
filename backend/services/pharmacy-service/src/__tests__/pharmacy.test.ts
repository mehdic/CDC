/**
 * Pharmacy Service Unit Tests
 */

import { Pharmacy, SubscriptionTier, SubscriptionStatus } from '@models/Pharmacy';

describe('Pharmacy Model', () => {
  let pharmacy: Pharmacy;

  beforeEach(() => {
    pharmacy = new Pharmacy();
    pharmacy.id = 'test-pharmacy-id';
    pharmacy.name = 'Test Pharmacy';
    pharmacy.license_number = 'TEST-123';
    pharmacy.subscription_status = SubscriptionStatus.ACTIVE;
    pharmacy.subscription_tier = SubscriptionTier.BASIC;
    pharmacy.deleted_at = null;
  });

  describe('isDeleted', () => {
    it('should return false when not deleted', () => {
      expect(pharmacy.isDeleted()).toBe(false);
    });

    it('should return true when soft deleted', () => {
      pharmacy.deleted_at = new Date();
      expect(pharmacy.isDeleted()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('should return true when status is active and not deleted', () => {
      expect(pharmacy.isActive()).toBe(true);
    });

    it('should return false when deleted', () => {
      pharmacy.deleted_at = new Date();
      expect(pharmacy.isActive()).toBe(false);
    });

    it('should return false when status is suspended', () => {
      pharmacy.subscription_status = SubscriptionStatus.SUSPENDED;
      expect(pharmacy.isActive()).toBe(false);
    });
  });

  describe('isTrial', () => {
    it('should return true when status is trial', () => {
      pharmacy.subscription_status = SubscriptionStatus.TRIAL;
      expect(pharmacy.isTrial()).toBe(true);
    });

    it('should return false when status is not trial', () => {
      pharmacy.subscription_status = SubscriptionStatus.ACTIVE;
      expect(pharmacy.isTrial()).toBe(false);
    });
  });

  describe('isEnterprise', () => {
    it('should return true when tier is enterprise', () => {
      pharmacy.subscription_tier = SubscriptionTier.ENTERPRISE;
      expect(pharmacy.isEnterprise()).toBe(true);
    });

    it('should return false when tier is not enterprise', () => {
      pharmacy.subscription_tier = SubscriptionTier.BASIC;
      expect(pharmacy.isEnterprise()).toBe(false);
    });
  });

  describe('hasLocation', () => {
    it('should return true when coordinates are set', () => {
      pharmacy.latitude = 46.2044;
      pharmacy.longitude = 6.1432;
      expect(pharmacy.hasLocation()).toBe(true);
    });

    it('should return false when coordinates are null', () => {
      pharmacy.latitude = null;
      pharmacy.longitude = null;
      expect(pharmacy.hasLocation()).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should set deleted_at and cancel subscription', () => {
      pharmacy.softDelete();
      expect(pharmacy.deleted_at).not.toBeNull();
      expect(pharmacy.subscription_status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('suspend', () => {
    it('should set status to suspended', () => {
      pharmacy.suspend();
      expect(pharmacy.subscription_status).toBe(SubscriptionStatus.SUSPENDED);
    });
  });

  describe('activate', () => {
    it('should set status to active', () => {
      pharmacy.subscription_status = SubscriptionStatus.SUSPENDED;
      pharmacy.activate();
      expect(pharmacy.subscription_status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
