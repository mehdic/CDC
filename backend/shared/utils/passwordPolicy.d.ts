/**
 * Enhanced Password Policy Utilities (T249)
 * Extends basic password utilities with advanced security features
 * Based on NIST SP 800-63B Digital Identity Guidelines
 *
 * Features:
 * - Common password prevention (10,000+ most common passwords)
 * - Password history tracking (prevent reuse of last 5 passwords)
 * - Password strength estimation using zxcvbn algorithm
 * - Breach detection (Have I Been Pwned API integration)
 * - Password expiration policies
 */
/**
 * Check if password is in common passwords list
 * Case-insensitive comparison
 *
 * @param password Password to check
 * @returns True if password is common
 */
export declare function isCommonPassword(password: string): boolean;
/**
 * Advanced password strength estimation
 * Based on zxcvbn algorithm by Dropbox
 *
 * Factors considered:
 * - Length
 * - Character diversity (lowercase, uppercase, digits, special)
 * - Common patterns (keyboard walks, repeats, sequences)
 * - Common words/passwords
 * - Entropy
 *
 * @param password Password to evaluate
 * @returns Strength score (0-4) and detailed feedback
 */
export declare function estimatePasswordStrengthAdvanced(password: string): {
    score: number;
    crackTimeSeconds: number;
    feedback: string[];
    suggestions: string[];
};
/**
 * Check if password was used before
 * Compares against array of previous password hashes
 *
 * @param newPassword New password to check
 * @param previousPasswordHashes Array of previous password hashes (bcrypt)
 * @returns True if password was used before
 */
export declare function isPasswordReused(newPassword: string, previousPasswordHashes: string[]): Promise<boolean>;
/**
 * Add password to history
 * Maintains only the last N passwords
 *
 * @param newPasswordHash New password hash to add
 * @param currentHistory Current password history
 * @param maxHistory Maximum number of passwords to keep (default: 5)
 * @returns Updated password history
 */
export declare function addToPasswordHistory(newPasswordHash: string, currentHistory: string[], maxHistory?: number): string[];
/**
 * Check if password has expired
 *
 * @param lastPasswordChange Date when password was last changed
 * @param expirationDays Number of days until password expires (default: 90)
 * @returns Object with expiration status
 */
export declare function checkPasswordExpiration(lastPasswordChange: Date, expirationDays?: number): {
    isExpired: boolean;
    daysRemaining: number;
    shouldWarn: boolean;
};
/**
 * Comprehensive password validation
 * Combines all password policy checks
 *
 * @param password Password to validate
 * @param options Validation options
 * @returns Validation result with detailed feedback
 */
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
/**
 * Generate a password that complies with password policy
 *
 * @param length Password length (default: 16)
 * @returns Generated password
 */
export declare function generateCompliantPassword(length?: number): string;
//# sourceMappingURL=passwordPolicy.d.ts.map