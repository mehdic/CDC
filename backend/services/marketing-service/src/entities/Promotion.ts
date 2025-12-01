/**
 * Promotion Entity
 * Represents discounts, coupons, and special offers
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum PromotionType {
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  FREE_SHIPPING = 'free_shipping',
  LOYALTY_POINTS = 'loyalty_points',
}

export enum PromotionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

@Entity('promotions')
@Index(['pharmacyId', 'code'], { unique: true })
@Index(['status'])
@Index(['expiryDate'])
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  pharmacyId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('varchar', { length: 50, unique: true })
  code!: string;

  @Column('enum', { enum: PromotionType })
  type!: PromotionType;

  @Column('enum', { enum: PromotionStatus, default: PromotionStatus.ACTIVE })
  status: PromotionStatus = PromotionStatus.ACTIVE;

  @Column('timestamp')
  startDate!: Date;

  @Column('timestamp')
  expiryDate!: Date;

  // Discount value
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountValue?: number; // percentage or fixed amount

  @Column('varchar', { length: 10, nullable: true })
  discountUnit?: string; // '%' or 'CHF'

  // Buy X Get Y configuration
  @Column('jsonb', { nullable: true })
  buyXGetY?: {
    buyQuantity: number;
    buyProductId: string;
    getQuantity: number;
    getProductId: string;
    discountPercentage: number;
  };

  // Loyalty points bonus
  @Column('integer', { nullable: true })
  loyaltyPointsBonus?: number;

  // Minimum purchase requirements
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minimumPurchaseAmount?: number;

  @Column('integer', { nullable: true })
  minimumQuantity?: number;

  // Applicable categories and products
  @Column('uuid', { array: true, nullable: true })
  applicableProductIds?: string[];

  @Column('varchar', { array: true, nullable: true })
  applicableCategories?: string[];

  // Geographic restrictions
  @Column('varchar', { array: true, nullable: true })
  applicableLocations?: string[];

  // Usage limits
  @Column('integer', { nullable: true })
  maxUsageCount?: number;

  @Column('integer', { default: 0 })
  usedCount = 0;

  @Column('integer', { nullable: true })
  maxUsagePerCustomer?: number;

  @Column('boolean', { default: false })
  isStackable = false;

  // Customer eligibility
  @Column('varchar', { array: true, nullable: true })
  eligibleCustomerTypes?: string[]; // ['new', 'loyal', 'vip', 'all']

  @Column('jsonb', { nullable: true })
  eligibilityRules?: {
    minCustomerAge?: number;
    maxCustomerAge?: number;
    membershipRequired?: boolean;
    minPurchaseHistory?: number;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
