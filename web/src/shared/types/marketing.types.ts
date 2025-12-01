/**
 * Shared Marketing Types
 * Types for campaigns, promotions, and templates
 */

// Campaign Types
export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TargetAudience {
  ALL_CUSTOMERS = 'all_customers',
  NEW_CUSTOMERS = 'new_customers',
  LOYAL_CUSTOMERS = 'loyal_customers',
  INACTIVE_CUSTOMERS = 'inactive_customers',
  GEOGRAPHIC = 'geographic',
  DEMOGRAPHIC = 'demographic',
  BEHAVIORAL = 'behavioral',
  VIP_MEMBERS = 'vip_members',
}

export interface CampaignResponse {
  id: string;
  pharmacyId: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  subject: string;
  content: string;
  targetAudience: TargetAudience[];
  targetingRules?: {
    locations?: string[];
    minAge?: number;
    maxAge?: number;
    gender?: string[];
    productCategories?: string[];
    minPurchaseAmount?: number;
    maxPurchaseAmount?: number;
  };
  scheduledAt?: string;
  startDate?: string;
  endDate?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

// Promotion Types
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

export interface PromotionResponse {
  id: string;
  pharmacyId: string;
  name: string;
  description?: string;
  code: string;
  type: PromotionType;
  status: PromotionStatus;
  startDate: string;
  expiryDate: string;
  discountValue?: number;
  discountUnit?: string;
  minimumPurchaseAmount?: number;
  usedCount: number;
  maxUsageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatePromoCodeResponse {
  valid: boolean;
  promotion?: PromotionResponse;
  error?: string;
}

export interface ApplyPromoResponse {
  success: boolean;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
}

// Template Types
export enum TemplateChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export interface TemplateResponse {
  id: string;
  pharmacyId: string;
  name: string;
  description?: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  htmlContent?: string;
  variables: string[];
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface CampaignAnalyticsResponse {
  campaignId: string;
  totalSent: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalComplaints: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
}

export interface EngagementTrendResponse {
  date: string;
  opens: number;
  clicks: number;
  conversions: number;
  bounces: number;
  unsubscribes: number;
}
