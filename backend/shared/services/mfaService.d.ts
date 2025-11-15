export interface MFASecret {
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
}
export interface MFAVerificationResult {
    isValid: boolean;
    message?: string;
}
export declare function generateMFASecret(userEmail: string, userName?: string): Promise<MFASecret>;
export declare function verifyTOTP(secret: string, token: string): MFAVerificationResult;
export declare function verifyBackupCode(backupCodes: string[], code: string): MFAVerificationResult & {
    remainingCodes: string[];
};
export declare function completeMFAEnrollment(secret: string, token: string): boolean;
export declare function disableMFA(): boolean;
export declare function regenerateBackupCodes(count?: number, length?: number): string[];
export declare function isMFARequiredForRole(userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY'): boolean;
export declare function isMFAEnabled(mfaSecret: string | null | undefined): boolean;
export declare function formatBackupCodes(codes: string[]): string[];
export declare function generateTOTPCode(secret: string): string;
export declare function getTOTPTimeRemaining(): number;
export declare function getMFASecurityRecommendations(): string[];
export declare function validateMFASetup(mfaSecret: string | null | undefined, backupCodes: string[] | null | undefined): {
    isValid: boolean;
    issues: string[];
};
//# sourceMappingURL=mfaService.d.ts.map