export declare function isCommonPassword(password: string): boolean;
export declare function estimatePasswordStrengthAdvanced(password: string): {
    score: number;
    crackTimeSeconds: number;
    feedback: string[];
    suggestions: string[];
};
export declare function isPasswordReused(newPassword: string, previousPasswordHashes: string[]): Promise<boolean>;
export declare function addToPasswordHistory(newPasswordHash: string, currentHistory: string[], maxHistory?: number): string[];
export declare function checkPasswordExpiration(lastPasswordChange: Date, expirationDays?: number): {
    isExpired: boolean;
    daysRemaining: number;
    shouldWarn: boolean;
};
export declare function validatePasswordComprehensive(password: string, options?: {
    previousPasswordHashes?: string[];
    userEmail?: string;
    userName?: string;
}): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    strength: {
        score: number;
        feedback: string[];
        suggestions: string[];
    };
}>;
export declare function generateCompliantPassword(length?: number): string;
//# sourceMappingURL=passwordPolicy.d.ts.map