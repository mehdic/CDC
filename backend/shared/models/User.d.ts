import { Pharmacy } from './Pharmacy';
import { AuditTrailEntry } from './AuditTrailEntry';
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
    audit_trail_entries: AuditTrailEntry[];
    created_at: Date;
    updated_at: Date;
    last_login_at: Date | null;
    deleted_at: Date | null;
    isDeleted(): boolean;
    isActive(): boolean;
    hasMFA(): boolean;
    isHealthcareProfessional(): boolean;
    hasHINAuth(): boolean;
    softDelete(): void;
    updateLastLogin(): void;
}
//# sourceMappingURL=User.d.ts.map