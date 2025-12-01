/**
 * Pharmacy Entity
 * Pharmacy locations serving as multi-tenant root entities
 * Based on: /specs/002-metapharm-platform/data-model.md
 */
import { User } from './User';
export declare enum SubscriptionTier {
    BASIC = "basic",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise"
}
export declare enum SubscriptionStatus {
    TRIAL = "trial",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    CANCELLED = "cancelled"
}
export interface OperatingHours {
    monday?: {
        open: string | null;
        close: string | null;
    };
    tuesday?: {
        open: string | null;
        close: string | null;
    };
    wednesday?: {
        open: string | null;
        close: string | null;
    };
    thursday?: {
        open: string | null;
        close: string | null;
    };
    friday?: {
        open: string | null;
        close: string | null;
    };
    saturday?: {
        open: string | null;
        close: string | null;
    };
    sunday?: {
        open: string | null;
        close: string | null;
    };
}
export declare class Pharmacy {
    id: string;
    name: string;
    license_number: string;
    address_encrypted: Buffer;
    city: string;
    canton: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    email: string | null;
    operating_hours: OperatingHours | null;
    subscription_tier: SubscriptionTier;
    subscription_status: SubscriptionStatus;
    users: User[];
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    /**
     * Check if pharmacy is soft deleted
     */
    isDeleted(): boolean;
    /**
     * Check if pharmacy subscription is active
     */
    isActive(): boolean;
    /**
     * Check if pharmacy is in trial period
     */
    isTrial(): boolean;
    /**
     * Check if pharmacy has enterprise subscription
     */
    isEnterprise(): boolean;
    /**
     * Check if pharmacy is open on a given day
     */
    isOpenOnDay(day: keyof OperatingHours): boolean;
    /**
     * Get operating hours for a specific day
     */
    getHoursForDay(day: keyof OperatingHours): {
        open: string;
        close: string;
    } | null;
    /**
     * Check if pharmacy has GPS coordinates for delivery routing
     */
    hasLocation(): boolean;
    /**
     * Soft delete pharmacy
     */
    softDelete(): void;
    /**
     * Suspend pharmacy subscription
     */
    suspend(): void;
    /**
     * Activate pharmacy subscription
     */
    activate(): void;
}
//# sourceMappingURL=Pharmacy.d.ts.map