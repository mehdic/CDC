/**
 * Promotion Service
 * Manage promotions and validate promo codes
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Promotion, PromotionStatus, PromotionType } from '../entities/Promotion';

export interface CreatePromotionDTO {
  pharmacyId: string;
  name: string;
  description?: string;
  code: string;
  type: PromotionType;
  startDate: Date;
  expiryDate: Date;
  discountValue?: number;
  discountUnit?: string;
  buyXGetY?: any;
  loyaltyPointsBonus?: number;
  minimumPurchaseAmount?: number;
  minimumQuantity?: number;
  applicableProductIds?: string[];
  applicableCategories?: string[];
  applicableLocations?: string[];
  maxUsageCount?: number;
  maxUsagePerCustomer?: number;
  isStackable?: boolean;
  eligibleCustomerTypes?: string[];
  eligibilityRules?: any;
  metadata?: any;
}

export interface UpdatePromotionDTO {
  name?: string;
  description?: string;
  startDate?: Date;
  expiryDate?: Date;
  status?: PromotionStatus;
  discountValue?: number;
  minimumPurchaseAmount?: number;
  applicableProductIds?: string[];
  applicableCategories?: string[];
  maxUsageCount?: number;
  metadata?: any;
}

export interface ValidatePromotionResult {
  valid: boolean;
  promotion?: Promotion;
  error?: string;
}

export interface ApplyPromotionResult {
  success: boolean;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
}

export class PromotionService {
  private promotionRepository: Repository<Promotion>;

  constructor() {
    this.promotionRepository = AppDataSource.getRepository(Promotion);
  }

  async createPromotion(dto: CreatePromotionDTO): Promise<Promotion> {
    const promotion = this.promotionRepository.create({
      ...dto,
      status: PromotionStatus.ACTIVE,
      usedCount: 0,
    });

    return await this.promotionRepository.save(promotion);
  }

  async getPromotionById(id: string): Promise<Promotion | null> {
    return await this.promotionRepository.findOne({ where: { id } });
  }

  async getPromotionByCode(code: string): Promise<Promotion | null> {
    return await this.promotionRepository.findOne({ where: { code } });
  }

  async getPromotionsByPharmacy(pharmacyId: string): Promise<Promotion[]> {
    return await this.promotionRepository.find({
      where: { pharmacyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActivePromotions(pharmacyId: string): Promise<Promotion[]> {
    const now = new Date();
    return await this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.pharmacyId = :pharmacyId', { pharmacyId })
      .andWhere('promotion.status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('promotion.startDate <= :now', { now })
      .andWhere('promotion.expiryDate >= :now', { now })
      .orderBy('promotion.createdAt', 'DESC')
      .getMany();
  }

  async updatePromotion(id: string, dto: UpdatePromotionDTO): Promise<Promotion> {
    await this.promotionRepository.update(id, dto);

    const promotion = await this.getPromotionById(id);
    if (!promotion) {
      throw new Error('Promotion not found');
    }

    return promotion;
  }

  async deletePromotion(id: string): Promise<boolean> {
    const result = await this.promotionRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async validatePromotionCode(
    code: string,
    customerId?: string,
    purchaseAmount?: number,
    productIds?: string[],
  ): Promise<ValidatePromotionResult> {
    const promotion = await this.getPromotionByCode(code);

    if (!promotion) {
      return { valid: false, error: 'Promotion code not found' };
    }

    if (promotion.status !== PromotionStatus.ACTIVE) {
      return { valid: false, error: 'Promotion is not active' };
    }

    const now = new Date();
    if (promotion.startDate > now) {
      return { valid: false, error: 'Promotion has not started yet' };
    }

    if (promotion.expiryDate < now) {
      return { valid: false, error: 'Promotion has expired' };
    }

    if (promotion.maxUsageCount && promotion.usedCount >= promotion.maxUsageCount) {
      return { valid: false, error: 'Promotion usage limit reached' };
    }

    if (purchaseAmount && promotion.minimumPurchaseAmount) {
      if (purchaseAmount < promotion.minimumPurchaseAmount) {
        return {
          valid: false,
          error: `Minimum purchase amount of CHF ${promotion.minimumPurchaseAmount} required`,
        };
      }
    }

    if (promotion.applicableProductIds && promotion.applicableProductIds.length > 0 && productIds) {
      const hasApplicableProduct = productIds.some((id) =>
        promotion.applicableProductIds?.includes(id),
      );
      if (!hasApplicableProduct) {
        return { valid: false, error: 'Promotion not applicable to selected products' };
      }
    }

    return { valid: true, promotion };
  }

  async applyPromotion(
    promotion: Promotion,
    basePrice: number,
    quantity?: number,
  ): Promise<ApplyPromotionResult> {
    let discountAmount = 0;
    let finalPrice = basePrice;

    try {
      switch (promotion.type) {
        case PromotionType.PERCENTAGE_DISCOUNT:
          if (promotion.discountValue) {
            discountAmount = (basePrice * promotion.discountValue) / 100;
            finalPrice = basePrice - discountAmount;
          }
          break;

        case PromotionType.FIXED_AMOUNT:
          if (promotion.discountValue) {
            discountAmount = Math.min(promotion.discountValue, basePrice);
            finalPrice = basePrice - discountAmount;
          }
          break;

        case PromotionType.BUY_X_GET_Y:
          if (promotion.buyXGetY && quantity) {
            const cycles = Math.floor(quantity / promotion.buyXGetY.buyQuantity);
            const discountPerCycle = (basePrice / quantity) * promotion.buyXGetY.getQuantity * (promotion.buyXGetY.discountPercentage / 100);
            discountAmount = cycles * discountPerCycle;
            finalPrice = basePrice - discountAmount;
          }
          break;

        case PromotionType.FREE_SHIPPING:
          // Free shipping is handled separately, no price change
          discountAmount = 0;
          finalPrice = basePrice;
          break;

        case PromotionType.LOYALTY_POINTS:
          // Loyalty points are handled separately
          finalPrice = basePrice;
          break;

        default:
          return { success: false, error: 'Unknown promotion type' };
      }

      return {
        success: true,
        discountAmount,
        finalPrice: Math.max(finalPrice, 0),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply promotion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async usePromotion(promotionId: string): Promise<Promotion> {
    const promotion = await this.getPromotionById(promotionId);
    if (!promotion) {
      throw new Error('Promotion not found');
    }

    promotion.usedCount += 1;

    if (promotion.maxUsageCount && promotion.usedCount >= promotion.maxUsageCount) {
      promotion.status = PromotionStatus.INACTIVE;
    }

    return await this.promotionRepository.save(promotion);
  }

  async getExpiredPromotions(): Promise<Promotion[]> {
    const now = new Date();
    return await this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.expiryDate < :now', { now })
      .andWhere('promotion.status != :archived', { archived: PromotionStatus.ARCHIVED })
      .getMany();
  }

  async archiveExpiredPromotions(): Promise<number> {
    const expiredPromotions = await this.getExpiredPromotions();

    for (const promotion of expiredPromotions) {
      promotion.status = PromotionStatus.EXPIRED;
      await this.promotionRepository.save(promotion);
    }

    return expiredPromotions.length;
  }

  async searchPromotions(pharmacyId: string, searchTerm: string): Promise<Promotion[]> {
    return await this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.pharmacyId = :pharmacyId', { pharmacyId })
      .andWhere(
        '(promotion.name ILIKE :search OR promotion.code ILIKE :search OR promotion.description ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .orderBy('promotion.createdAt', 'DESC')
      .getMany();
  }
}
