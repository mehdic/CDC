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
    isDeleted(): boolean;
    isActive(): boolean;
    isTrial(): boolean;
    isEnterprise(): boolean;
    isOpenOnDay(day: keyof OperatingHours): boolean;
    getHoursForDay(day: keyof OperatingHours): {
        open: string;
        close: string;
    } | null;
    hasLocation(): boolean;
    softDelete(): void;
    suspend(): void;
    activate(): void;
}
//# sourceMappingURL=Pharmacy.d.ts.map