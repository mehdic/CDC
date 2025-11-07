export declare function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
};
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function needsRehash(hash: string): boolean;
export declare function estimatePasswordStrength(password: string): {
    score: number;
    description: string;
};
export declare function generateSecurePassword(length?: number): string;
export declare function sanitizePasswordForLogging(password: string): string;
export declare function getPasswordRequirements(): string[];
//# sourceMappingURL=auth.d.ts.map