/**
 * User Entity
 * All platform users across 5 roles: Pharmacist, Doctor, Nurse, Delivery Personnel, Patient
 * Based on: /specs/002-metapharm-platform/data-model.md
 */
import { Pharmacy } from './Pharmacy';
import { AuditTrailEntry } from './AuditTrailEntry';
import { Cart } from './Cart';
export declare enum UserRole {
    PHARMACIST = "pharmacist",
    DOCTOR = "doctor",
    NURSE = "nurse",
    DELIVERY = "delivery",
    PATIENT = "patient"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User {
    id: string;
    email: string;
    email_verified: boolean;
    password_hash: string | null;
    hin_id: string | null;
    role: UserRole;
    status: UserStatus;
    first_name_encrypted: Buffer;
    last_name_encrypted: Buffer;
    phone_encrypted: Buffer | null;
    mfa_enabled: boolean;
    mfa_secret: string | null;
    mfa_secret_encrypted: Buffer | null;
    primary_pharmacy_id: string | null;
    primary_pharmacy: Pharmacy | null;
    master_account_id: string | null;
    master_account: User | null;
    permissions_override: Record<string, any> | null;
    sub_accounts: User[];
    audit_trail_entries: AuditTrailEntry[];
    carts: Cart[];
    created_at: Date;
    updated_at: Date;
    last_login_at: Date | null;
    deleted_at: Date | null;
    /**
     * Check if user is soft deleted
     */
    isDeleted(): boolean;
    /**
     * Check if user is active
     */
    isActive(): boolean;
    /**
     * Check if user has MFA enabled
     */
    hasMFA(): boolean;
    /**
     * Check if user is a healthcare professional (requires MFA)
     */
    isHealthcareProfessional(): boolean;
    /**
     * Check if user has HIN e-ID authentication
     */
    hasHINAuth(): boolean;
    /**
     * Soft delete user
     */
    softDelete(): void;
    /**
     * Update last login timestamp
     */
    updateLastLogin(): void;
}
//# sourceMappingURL=User.d.ts.map