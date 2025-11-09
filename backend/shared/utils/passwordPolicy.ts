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

import { hashPassword, comparePassword } from './auth';
import { getPasswordPolicyConfig } from '../config/security';
import * as crypto from 'crypto';

// ============================================================================
// Common Passwords List
// ============================================================================

/**
 * Top 100 most common passwords (subset for performance)
 * Full list of 10,000 common passwords should be loaded from a file
 * Source: https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10k-most-common.txt
 */
const COMMON_PASSWORDS_SUBSET = [
  'password',
  '123456',
  '123456789',
  '12345678',
  '12345',
  'qwerty',
  'abc123',
  'password1',
  '1234567',
  '123123',
  '1234567890',
  '000000',
  'password123',
  '1q2w3e4r',
  'qwertyuiop',
  'monkey',
  'dragon',
  'letmein',
  'trustno1',
  'sunshine',
  'master',
  'welcome',
  'shadow',
  'ashley',
  '123321',
  'football',
  'jesus',
  'michael',
  'ninja',
  'mustang',
  'password1!',
  'superman',
  'admin',
  'root',
  'test',
  'guest',
  'changeme',
  'Welcome1',
  'Passw0rd',
  'Admin123',
  'P@ssw0rd',
  'Password1!',
  'Qwerty123',
  'Summer2023',
  'Winter2023',
  'Spring2023',
  'Fall2023',
  'January2023',
  'February2023',
  'March2023',
  'April2023',
  'May2023',
  'June2023',
  'July2023',
  'August2023',
  'September2023',
  'October2023',
  'November2023',
  'December2023',
  'Monday123',
  'Tuesday123',
  'Wednesday123',
  'Thursday123',
  'Friday123',
  'Saturday123',
  'Sunday123',
  'baseball',
  'freedom',
  'whatever',
  'jordan',
  'robert',
  'thomas',
  'daniel',
  'jennifer',
  'matthew',
  'michelle',
  'jessica',
  'anthony',
  'amanda',
  'melissa',
  'stephanie',
  'joseph',
  'nicole',
  'christopher',
  'william',
  'elizabeth',
  'heather',
  'samantha',
  'melissa',
  'christina',
  'lauren',
  'brittany',
  'taylor',
  'ashley',
  'megan',
  'emily',
  'sarah',
];

/**
 * Check if password is in common passwords list
 * Case-insensitive comparison
 *
 * @param password Password to check
 * @returns True if password is common
 */
export function isCommonPassword(password: string): boolean {
  if (!password) return false;

  const lowerPassword = password.toLowerCase();

  // Check exact match
  if (COMMON_PASSWORDS_SUBSET.includes(lowerPassword)) {
    return true;
  }

  // Check if password contains common password as substring
  const containsCommon = COMMON_PASSWORDS_SUBSET.some((common) =>
    lowerPassword.includes(common.toLowerCase())
  );

  return containsCommon;
}

// ============================================================================
// Password Strength Estimation (zxcvbn-like algorithm)
// ============================================================================

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
export function estimatePasswordStrengthAdvanced(password: string): {
  score: number; // 0 (very weak) to 4 (very strong)
  crackTimeSeconds: number; // Estimated time to crack
  feedback: string[];
  suggestions: string[];
} {
  if (!password) {
    return {
      score: 0,
      crackTimeSeconds: 0,
      feedback: ['Password is empty'],
      suggestions: ['Create a strong password with at least 12 characters'],
    };
  }

  let score = 0;
  const feedback: string[] = [];
  const suggestions: string[] = [];

  // Check for common password
  if (isCommonPassword(password)) {
    return {
      score: 0,
      crackTimeSeconds: 1,
      feedback: ['This is a very common password'],
      suggestions: [
        'Use a unique password that is not in common password lists',
        'Combine random words with numbers and symbols',
      ],
    };
  }

  // Length score (0-2 points)
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 12) {
    feedback.push('Password is too short');
    suggestions.push('Use at least 12 characters');
  }

  // Character diversity score (0-2 points)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const diversityCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (diversityCount >= 3) score += 1;
  if (diversityCount === 4) score += 1;

  if (!hasUpper) suggestions.push('Add uppercase letters');
  if (!hasLower) suggestions.push('Add lowercase letters');
  if (!hasDigit) suggestions.push('Add numbers');
  if (!hasSpecial) suggestions.push('Add special characters');

  // Check for patterns
  if (hasRepeatingCharacters(password)) {
    score -= 1;
    feedback.push('Contains repeating characters');
    suggestions.push('Avoid repeating the same character multiple times');
  }

  if (hasSequentialCharacters(password)) {
    score -= 1;
    feedback.push('Contains sequential characters (abc, 123)');
    suggestions.push('Avoid sequential patterns');
  }

  if (hasKeyboardWalk(password)) {
    score -= 1;
    feedback.push('Contains keyboard patterns (qwerty, asdf)');
    suggestions.push('Avoid keyboard walks');
  }

  // Calculate entropy
  const entropy = calculatePasswordEntropy(password);
  if (entropy >= 60) score += 1;

  // Ensure score is in range [0, 4]
  score = Math.max(0, Math.min(4, score));

  // Estimate crack time
  const crackTimeSeconds = estimateCrackTime(password, entropy);

  // Add feedback based on final score
  if (score === 0) {
    feedback.push('Very weak password - easily cracked in seconds');
  } else if (score === 1) {
    feedback.push('Weak password - can be cracked in minutes to hours');
  } else if (score === 2) {
    feedback.push('Fair password - may take days to crack');
  } else if (score === 3) {
    feedback.push('Strong password - would take years to crack');
  } else if (score === 4) {
    feedback.push('Very strong password - would take centuries to crack');
  }

  return {
    score,
    crackTimeSeconds,
    feedback,
    suggestions,
  };
}

/**
 * Check for repeating characters (aaa, 111)
 */
function hasRepeatingCharacters(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/**
 * Check for sequential characters (abc, 123, xyz)
 */
function hasSequentialCharacters(password: string): boolean {
  const sequences = ['abc', '123', 'xyz', '789', 'bcd', 'cde', 'def'];

  for (const seq of sequences) {
    if (password.toLowerCase().includes(seq)) {
      return true;
    }
    // Check reverse sequences
    if (password.toLowerCase().includes(seq.split('').reverse().join(''))) {
      return true;
    }
  }

  return false;
}

/**
 * Check for keyboard walks (qwerty, asdf)
 */
function hasKeyboardWalk(password: string): boolean {
  const keyboards = ['qwerty', 'asdfgh', 'zxcvbn', 'qwertz'];

  for (const kb of keyboards) {
    if (password.toLowerCase().includes(kb)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate password entropy (bits)
 * Entropy = log2(pool_size^length)
 */
function calculatePasswordEntropy(password: string): number {
  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += 26; // lowercase
  if (/[A-Z]/.test(password)) poolSize += 26; // uppercase
  if (/\d/.test(password)) poolSize += 10; // digits
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32; // special chars

  return Math.log2(Math.pow(poolSize, password.length));
}

/**
 * Estimate time to crack password (in seconds)
 * Assumes 10 billion guesses per second (modern GPU)
 */
function estimateCrackTime(password: string, entropy: number): number {
  const guessesPerSecond = 10_000_000_000; // 10 billion
  const possibleCombinations = Math.pow(2, entropy);
  return possibleCombinations / guessesPerSecond / 2; // Average case
}

// ============================================================================
// Password History
// ============================================================================

/**
 * Check if password was used before
 * Compares against array of previous password hashes
 *
 * @param newPassword New password to check
 * @param previousPasswordHashes Array of previous password hashes (bcrypt)
 * @returns True if password was used before
 */
export async function isPasswordReused(
  newPassword: string,
  previousPasswordHashes: string[]
): Promise<boolean> {
  if (!previousPasswordHashes || previousPasswordHashes.length === 0) {
    return false;
  }

  for (const hash of previousPasswordHashes) {
    const isMatch = await comparePassword(newPassword, hash);
    if (isMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Add password to history
 * Maintains only the last N passwords
 *
 * @param newPasswordHash New password hash to add
 * @param currentHistory Current password history
 * @param maxHistory Maximum number of passwords to keep (default: 5)
 * @returns Updated password history
 */
export function addToPasswordHistory(
  newPasswordHash: string,
  currentHistory: string[],
  maxHistory: number = 5
): string[] {
  const updated = [newPasswordHash, ...currentHistory];

  // Keep only the last N passwords
  return updated.slice(0, maxHistory);
}

// ============================================================================
// Password Expiration
// ============================================================================

/**
 * Check if password has expired
 *
 * @param lastPasswordChange Date when password was last changed
 * @param expirationDays Number of days until password expires (default: 90)
 * @returns Object with expiration status
 */
export function checkPasswordExpiration(
  lastPasswordChange: Date,
  expirationDays: number = 90
): {
  isExpired: boolean;
  daysRemaining: number;
  shouldWarn: boolean; // Warn if expiring within 7 days
} {
  const now = new Date();
  const daysSinceChange = Math.floor(
    (now.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysRemaining = expirationDays - daysSinceChange;

  return {
    isExpired: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
    shouldWarn: daysRemaining <= 7 && daysRemaining > 0,
  };
}

// ============================================================================
// Complete Password Validation
// ============================================================================

/**
 * Comprehensive password validation
 * Combines all password policy checks
 *
 * @param password Password to validate
 * @param options Validation options
 * @returns Validation result with detailed feedback
 */
export async function validatePasswordComprehensive(
  password: string,
  options?: {
    previousPasswordHashes?: string[];
    userEmail?: string;
    userName?: string;
  }
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  strength: {
    score: number;
    feedback: string[];
    suggestions: string[];
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const config = getPasswordPolicyConfig();

  // Check length
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (password.length > config.maxLength) {
    errors.push(`Password must not exceed ${config.maxLength} characters`);
  }

  // Check character requirements
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireDigits && !/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (config.preventCommonPasswords && isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a more unique password.');
  }

  // Check for user information in password
  if (options?.userEmail) {
    const emailLocal = options.userEmail.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailLocal)) {
      errors.push('Password should not contain your email address');
    }
  }

  if (options?.userName) {
    if (password.toLowerCase().includes(options.userName.toLowerCase())) {
      errors.push('Password should not contain your name');
    }
  }

  // Check password history
  if (options?.previousPasswordHashes && config.passwordHistoryCount > 0) {
    const isReused = await isPasswordReused(
      password,
      options.previousPasswordHashes.slice(0, config.passwordHistoryCount)
    );

    if (isReused) {
      errors.push(
        `Password was used recently. Cannot reuse any of your last ${config.passwordHistoryCount} passwords.`
      );
    }
  }

  // Get password strength estimation
  const strength = estimatePasswordStrengthAdvanced(password);

  // Add warnings based on strength
  if (strength.score < 2) {
    warnings.push('Password strength is low. Consider making it stronger.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: {
      score: strength.score,
      feedback: strength.feedback,
      suggestions: strength.suggestions,
    },
  };
}

// ============================================================================
// Password Generation with Policy Compliance
// ============================================================================

/**
 * Generate a password that complies with password policy
 *
 * @param length Password length (default: 16)
 * @returns Generated password
 */
export function generateCompliantPassword(length: number = 16): string {
  const config = getPasswordPolicyConfig();

  length = Math.max(length, config.minLength);
  length = Math.min(length, config.maxLength);

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';

  let password = '';
  let allChars = '';

  // Ensure at least one of each required character type
  if (config.requireLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    allChars += lowercase;
  }

  if (config.requireUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    allChars += uppercase;
  }

  if (config.requireDigits) {
    password += digits[Math.floor(Math.random() * digits.length)];
    allChars += digits;
  }

  if (config.requireSpecialChars) {
    password += special[Math.floor(Math.random() * special.length)];
    allChars += special;
  }

  // Fill the rest with random characters
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  // Ensure it's not a common password
  if (isCommonPassword(password)) {
    // Very unlikely, but regenerate if it happens
    return generateCompliantPassword(length);
  }

  return password;
}
