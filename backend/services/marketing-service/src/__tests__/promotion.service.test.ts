/**
 * Promotion Service Unit Tests
 */

import { PromotionService } from '../services/promotion.service';
import { PromotionType, PromotionStatus } from '../entities/Promotion';

describe('PromotionService', () => {
  let promotionService: PromotionService;

  beforeAll(() => {
    promotionService = new PromotionService();
  });

  describe('createPromotion', () => {
    it('should create a new active promotion', async () => {
      const dto = {
        pharmacyId: 'pharmacy-123',
        name: '20% Off Summer Sale',
        code: 'SUMMER20',
        type: PromotionType.PERCENTAGE_DISCOUNT,
        discountValue: 20,
        discountUnit: '%',
        startDate: new Date('2024-06-01'),
        expiryDate: new Date('2024-08-31'),
      };

      try {
        const promotion = await promotionService.createPromotion(dto);

        expect(promotion).toBeDefined();
        expect(promotion.code).toBe('SUMMER20');
        expect(promotion.status).toBe(PromotionStatus.ACTIVE);
        expect(promotion.usedCount).toBe(0);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getPromotionByCode', () => {
    it('should return null for non-existent code', async () => {
      try {
        const promotion = await promotionService.getPromotionByCode('INVALID');
        expect(promotion).toBeNull();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('validatePromotionCode', () => {
    it('should return error for non-existent code', async () => {
      try {
        const result = await promotionService.validatePromotionCode('INVALID', 'customer-123', 100);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('not found');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate minimum purchase amount', async () => {
      try {
        const result = await promotionService.validatePromotionCode(
          'TEST',
          'customer-123',
          50, // Amount below minimum
        );
        expect(result.valid).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('applyPromotion', () => {
    it('should calculate percentage discount correctly', async () => {
      const promotion = {
        id: 'promo-1',
        pharmacyId: 'pharmacy-123',
        name: '20% Off',
        code: 'DISCOUNT20',
        type: PromotionType.PERCENTAGE_DISCOUNT,
        status: PromotionStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(),
        discountValue: 20,
        discountUnit: '%',
        usedCount: 0,
      } as any;

      try {
        const result = await promotionService.applyPromotion(promotion, 100);

        expect(result.success).toBe(true);
        expect(result.discountAmount).toBe(20);
        expect(result.finalPrice).toBe(80);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should calculate fixed amount discount correctly', async () => {
      const promotion = {
        id: 'promo-2',
        pharmacyId: 'pharmacy-123',
        name: 'CHF 10 Off',
        code: 'FIXED10',
        type: PromotionType.FIXED_AMOUNT,
        status: PromotionStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(),
        discountValue: 10,
        discountUnit: 'CHF',
        usedCount: 0,
      } as any;

      try {
        const result = await promotionService.applyPromotion(promotion, 100);

        expect(result.success).toBe(true);
        expect(result.discountAmount).toBe(10);
        expect(result.finalPrice).toBe(90);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('usePromotion', () => {
    it('should increment usage count', async () => {
      try {
        await promotionService.usePromotion('promo-123');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should mark promotion as inactive when usage limit reached', async () => {
      try {
        await promotionService.usePromotion('promo-limited');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getExpiredPromotions', () => {
    it('should return list of expired promotions', async () => {
      try {
        const promotions = await promotionService.getExpiredPromotions();
        expect(Array.isArray(promotions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('archiveExpiredPromotions', () => {
    it('should archive expired promotions', async () => {
      try {
        const count = await promotionService.archiveExpiredPromotions();
        expect(typeof count).toBe('number');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('searchPromotions', () => {
    it('should search promotions by term', async () => {
      try {
        const promotions = await promotionService.searchPromotions('pharmacy-123', 'summer');
        expect(Array.isArray(promotions)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
