/**
 * Product Recommendation Entity
 * AI-generated personalized product recommendations
 * T5-032: AI Recommendation Engine
 * Healthcare-appropriate recommendations with A/B testing support
 */
import { User } from './User';
import { Product } from './Product';
export declare enum RecommendationType {
    COLLABORATIVE_FILTERING = "collaborative_filtering",// Users who bought X also bought Y
    CONTENT_BASED = "content_based",// Similar products based on attributes
    HEALTH_PROFILE = "health_profile",// Based on user's health conditions
    PURCHASE_HISTORY = "purchase_history",// Reorder suggestions
    TRENDING = "trending",// Popular products
    PERSONALIZED = "personalized"
}
export declare enum RecommendationStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    DISMISSED = "dismissed",
    CONVERTED = "converted"
}
export declare class ProductRecommendation {
    id: string;
    user_id: string;
    user: User;
    product_id: string;
    product: Product;
    recommendation_type: RecommendationType;
    confidence_score: number;
    reason: string | null;
    features: Record<string, any> | null;
    status: RecommendationStatus;
    expires_at: Date | null;
    viewed_at: Date | null;
    clicked_at: Date | null;
    converted_at: Date | null;
    ab_test_variant: string | null;
    experiment_id: string | null;
    health_appropriate: boolean;
    health_warnings: string | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Check if recommendation is still active
     */
    isActive(): boolean;
    /**
     * Check if recommendation was viewed
     */
    wasViewed(): boolean;
    /**
     * Check if recommendation was clicked
     */
    wasClicked(): boolean;
    /**
     * Check if recommendation led to conversion
     */
    wasConverted(): boolean;
    /**
     * Get click-through rate (CTR) indicator
     */
    getEngagementLevel(): 'none' | 'viewed' | 'clicked' | 'converted';
    /**
     * Mark as viewed
     */
    markViewed(): void;
    /**
     * Mark as clicked
     */
    markClicked(): void;
    /**
     * Mark as converted (purchased)
     */
    markConverted(): void;
    /**
     * Mark as dismissed by user
     */
    markDismissed(): void;
    /**
     * Check if recommendation is part of A/B test
     */
    isABTest(): boolean;
}
//# sourceMappingURL=ProductRecommendation.d.ts.map