/**
 * Marketing Service Type Definitions
 */

import { CampaignType, CampaignStatus, TargetAudience } from '../entities/Campaign';
import { PromotionType, PromotionStatus } from '../entities/Promotion';
import { TemplateChannel } from '../entities/CampaignTemplate';

// Campaign API Requests and Responses
export interface CampaignRequest {
  name: string;
  description?: string;
  type: CampaignType;
  subject: string;
  content: string;
  templateId?: string;
  targetAudience: string[];
  targetingRules?: TargetingRules;
  scheduledAt?: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  promotionId?: string;
  aBTestConfig?: ABTestConfig;
  metadata?: Record<string, any>;
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
  targetingRules?: TargetingRules;
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

export interface TargetingRules {
  locations?: string[];
  minAge?: number;
  maxAge?: number;
  gender?: string[];
  productCategories?: string[];
  minPurchaseAmount?: number;
  maxPurchaseAmount?: number;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject?: string;
  content: string;
  percentage: number;
}

// Promotion API Requests and Responses
export interface PromotionRequest {
  name: string;
  description?: string;
  code: string;
  type: PromotionType;
  startDate: string;
  expiryDate: string;
  discountValue?: number;
  discountUnit?: string;
  minimumPurchaseAmount?: number;
  minimumQuantity?: number;
  applicableProductIds?: string[];
  applicableCategories?: string[];
  applicableLocations?: string[];
  maxUsageCount?: number;
  maxUsagePerCustomer?: number;
  isStackable?: boolean;
  eligibleCustomerTypes?: string[];
  metadata?: Record<string, any>;
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

export interface ValidatePromoCodeRequest {
  code: string;
  customerId?: string;
  purchaseAmount?: number;
  productIds?: string[];
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

// Template API Requests and Responses
export interface TemplateRequest {
  name: string;
  description?: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  htmlContent?: string;
  variables: string[];
  metadata?: Record<string, any>;
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

export interface RenderTemplateRequest {
  variables: Record<string, any>;
}

export interface RenderTemplateResponse {
  subject?: string;
  body: string;
}

// Analytics API Responses
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

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
