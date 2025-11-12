/**
 * Authentication Utilities (T039)
 * Implements password hashing and validation using bcrypt
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - HIPAA/GDPR compliant password security (FR-002, FR-104)
 * - bcrypt with 10 salt rounds (industry standard)
 * - Constant-time comparison to prevent timing attacks
 * - Password validation rules enforcement
 */
/**
 * Validate password against security requirements
 * Requirements based on HIPAA/GDPR compliance for healthcare systems
 *
 * @param password - The password to validate
 * @returns Object with validation result and error messages
 */
export declare function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
};
/**
 * Hash a password using bcrypt
 * Uses 10 salt rounds as specified in plan.md
 *
 * This function should be used when:
 * - Creating a new user account
 * - User changes their password
 * - Password reset flow
 *
 * @param password - The plaintext password to hash
 * @returns Promise resolving to the bcrypt hash
 * @throws Error if password is invalid or hashing fails
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a plaintext password with a bcrypt hash
 * Uses constant-time comparison to prevent timing attacks
 *
 * This function should be used when:
 * - User login (email/password authentication)
 * - Password confirmation dialogs
 * - Re-authentication before sensitive operations
 *
 * @param password - The plaintext password to check
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Check if a password hash needs rehashing
 * Returns true if the hash was created with fewer salt rounds than current configuration
 *
 * Use this to upgrade password hashes when users log in:
 * if (needsRehash(user.password_hash)) {
 *   user.password_hash = await hashPassword(plainPassword);
 * }
 *
 * @param hash - The bcrypt hash to check
 * @returns True if hash should be regenerated with current salt rounds
 */
export declare function needsRehash(hash: string): boolean;
/**
 * Estimate password strength
 * Returns a score from 0 (very weak) to 4 (very strong)
 *
 * @param password - The password to evaluate
 * @returns Strength score and description
 */
export declare function estimatePasswordStrength(password: string): {
    score: number;
    description: string;
};
/**
 * Generate a secure random password
 * Useful for temporary passwords sent to users
 *
 * @param length - Length of password (default: 16)
 * @returns A random password meeting all complexity requirements
 */
export declare function generateSecurePassword(length?: number): string;
/**
 * Sanitize password for logging
 * NEVER log actual passwords - use this for debug purposes
 *
 * @param password - Password to sanitize
 * @returns Masked password string
 */
export declare function sanitizePasswordForLogging(password: string): string;
/**
 * Get password requirements for display to users
 *
 * @returns Human-readable password requirements
 */
export declare function getPasswordRequirements(): string[];
//# sourceMappingURL=auth.d.ts.map