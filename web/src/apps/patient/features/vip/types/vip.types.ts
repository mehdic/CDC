/**
 * VIP Portal Types
 * Type definitions for VIP program, membership, points, and rewards
 * Task: T8-044 - Patient VIP Program Portal
 */

export enum VIPTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum RewardStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

export enum OfferType {
  DISCOUNT = 'discount',
  FREEBIE = 'freebie',
  BONUS_POINTS = 'bonus_points',
  FREE_DELIVERY = 'free_delivery',
  EXCLUSIVE_ACCESS = 'exclusive_access',
}

export interface VIPTierBenefit {
  id: string;
  benefit: string;
  description: string;
  icon?: string;
}

export interface VIPTierInfo {
  tier: VIPTier;
  name: string;
  description: string;
  minPoints: number;
  maxPoints?: number;
  benefits: VIPTierBenefit[];
  discountPercentage: number;
  pointsMultiplier: number;
  color: string;
}

export interface VIPMembership {
  id: string;
  userId: string;
  currentTier: VIPTier;
  totalPoints: number;
  pointsToNextTier: number;
  currentTierPoints: number;
  joinedAt: Date;
  lastActivityAt: Date;
  nextTierAt?: Date;
  isActive: boolean;
  membershipStatus: 'active' | 'inactive' | 'suspended';
}

export interface VIPReward {
  id: string;
  memberId: string;
  title: string;
  description: string;
  pointsValue: number;
  bonusPoints?: number;
  expiresAt: Date;
  status: RewardStatus;
  redeemedAt?: Date;
  code?: string;
  category?: string;
}

export interface VIPOffer {
  id: string;
  title: string;
  description: string;
  type: OfferType;
  discountPercentage?: number;
  pointsBonus?: number;
  validFrom: Date;
  validUntil: Date;
  applicableTiers: VIPTier[];
  usageLimit?: number;
  usageCount: number;
  termsAndConditions: string;
  featured: boolean;
  imageUrl?: string;
}

export interface PointsHistory {
  id: string;
  memberId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'adjusted' | 'expired' | 'bonus';
  description: string;
  transactionId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface VIPDashboardData {
  membership: VIPMembership;
  tierInfo: VIPTierInfo;
  rewards: VIPReward[];
  offers: VIPOffer[];
  pointsHistory: PointsHistory[];
  nextTierInfo?: VIPTierInfo;
}

export interface RedeemRewardRequest {
  rewardId: string;
  orderId?: string;
  quantity?: number;
}

export interface RedeemRewardResponse {
  message: string;
  reward: VIPReward;
  remainingPoints: number;
}

export interface UpgradeDowngradeRequest {
  newTier: VIPTier;
  reason?: string;
}

export interface UpgradeDowngradeResponse {
  message: string;
  previousTier: VIPTier;
  newTier: VIPTier;
  membership: VIPMembership;
}

export interface VIPDashboardResponse {
  message: string;
  data: VIPDashboardData;
}

export interface PointsHistoryResponse {
  message: string;
  data: PointsHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VIPOffersResponse {
  message: string;
  data: VIPOffer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VIPSignupResponse {
  success: boolean;
  memberId: string;
  patientId: string;
  signupDate: string;
  currentTier: VIPTier;
  initialBonus: number;
}
