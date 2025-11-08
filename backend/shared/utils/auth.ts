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

import * as bcrypt from 'bcrypt';

// ============================================================================
// Configuration
// ============================================================================

const BCRYPT_SALT_ROUNDS = 10; // As specified in plan.md
const MIN_PASSWORD_LENGTH = 12; // HIPAA recommendation for PHI access
const MAX_PASSWORD_LENGTH = 128; // Prevent DoS from extremely long passwords

// Password complexity requirements (HIPAA/GDPR)
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireDigits: true,
  requireSpecialChars: true,
};

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Validate password against security requirements
 * Requirements based on HIPAA/GDPR compliance for healthcare systems
 *
 * @param password - The password to validate
 * @returns Object with validation result and error messages
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check length
  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (password && password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }

  if (!password) {
    return { isValid: false, errors };
  }

  // Check uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check digits
  if (PASSWORD_REQUIREMENTS.requireDigits && !/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  // Check special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords (basic check)
  const commonWeakPasswords = [
    'password123',
    'admin123456',
    'welcome12345',
    'changeme123',
  ];

  if (commonWeakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
    errors.push('Password is too common or weak');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Password Hashing (T039)
// ============================================================================

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
export async function hashPassword(password: string): Promise<string> {
  // Validate password first
  const validation = validatePassword(password);
  if (!validation.isValid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
  }

  try {
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

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
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}

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
export function needsRehash(hash: string): boolean {
  try {
    // bcrypt hash format: $2b$<rounds>$<salt><hash>
    const rounds = parseInt(hash.split('$')[2], 10);
    return rounds < BCRYPT_SALT_ROUNDS;
  } catch (error) {
    // Invalid hash format
    return true;
  }
}

// ============================================================================
// Password Strength Estimation
// ============================================================================

/**
 * Estimate password strength
 * Returns a score from 0 (very weak) to 4 (very strong)
 *
 * @param password - The password to evaluate
 * @returns Strength score and description
 */
export function estimatePasswordStrength(password: string): {
  score: number;
  description: string;
} {
  let score = 0;

  if (!password) {
    return { score: 0, description: 'No password' };
  }

  // Length score (0-2 points)
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Complexity score (0-3 points)
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/\d/.test(password)) score += 0.5;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 0.5;

  // Diversity score (0-1 point)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.6) score += 1;

  // Cap at 4
  score = Math.min(4, Math.floor(score));

  const descriptions = [
    'Very weak',
    'Weak',
    'Fair',
    'Strong',
    'Very strong',
  ];

  return {
    score,
    description: descriptions[score],
  };
}

// ============================================================================
// Password Generation (for temporary passwords)
// ============================================================================

/**
 * Generate a secure random password
 * Useful for temporary passwords sent to users
 *
 * @param length - Length of password (default: 16)
 * @returns A random password meeting all complexity requirements
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';
  const all = lowercase + uppercase + digits + special;

  let password = '';

  // Ensure at least one of each required character type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sanitize password for logging
 * NEVER log actual passwords - use this for debug purposes
 *
 * @param password - Password to sanitize
 * @returns Masked password string
 */
export function sanitizePasswordForLogging(password: string): string {
  if (!password) return '[empty]';
  return `[${password.length} chars]`;
}

/**
 * Get password requirements for display to users
 *
 * @returns Human-readable password requirements
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one digit (0-9)',
    'At least one special character (!@#$%^&*...)',
  ];
}
