/**
 * User Behavior Event Entity
 * Tracks user interactions and patterns for AI recommendations
 * T5-031: Behavioral Tracking Service
 * Privacy-first: GDPR compliant with user consent tracking
 */
import { User } from './User';
import { Product } from './Product';
export declare enum EventType {
    PAGE_VIEW = "page_view",
    PRODUCT_VIEW = "product_view",
    PRODUCT_SEARCH = "product_search",
    ADD_TO_CART = "add_to_cart",
    REMOVE_FROM_CART = "remove_from_cart",
    CHECKOUT_START = "checkout_start",
    CHECKOUT_COMPLETE = "checkout_complete",
    PRESCRIPTION_UPLOAD = "prescription_upload",
    TELECONSULTATION_REQUEST = "teleconsultation_request",
    APPOINTMENT_BOOK = "appointment_book",
    REVIEW_SUBMIT = "review_submit"
}
export declare class UserBehaviorEvent {
    id: string;
    user_id: string;
    user: User;
    event_type: EventType;
    product_id: string | null;
    product: Product | null;
    event_data: Record<string, any> | null;
    page_url: string | null;
    referrer: string | null;
    device_type: string | null;
    browser: string | null;
    session_id: string;
    consent_given: boolean;
    created_at: Date;
    /**
     * Check if event involves a product
     */
    hasProduct(): boolean;
    /**
     * Check if tracking consent was given
     */
    hasConsent(): boolean;
    /**
     * Get days since event
     */
    getDaysSinceEvent(): number;
}
//# sourceMappingURL=UserBehaviorEvent.d.ts.map