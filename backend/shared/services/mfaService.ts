/**
 * Multi-Factor Authentication (MFA) Service (T243)
 * Implements TOTP-based MFA for healthcare professionals
 * Based on RFC 6238 (TOTP) and NIST SP 800-63B
 *
 * Features:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - QR code generation for authenticator apps (Google Authenticator, Authy, etc.)
 * - Backup recovery codes (10 single-use codes)
 * - MFA enrollment flow
 * - MFA verification with rate limiting
 *
 * Requirements:
 * - MFA required for pharmacists, doctors, nurses (NOT patients or delivery)
 * - 6-digit TOTP codes, 30-second window
 * - QR code for easy setup
 * - 10 backup codes for account recovery
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { getMFAConfig } from '../config/security';
import { hashPassword } from '../utils/auth';

// ============================================================================
// Types
// ============================================================================

export interface MFASecret {
  secret: string; // Base32-encoded secret
  qrCodeDataUrl: string; // Data URL for QR code image
  backupCodes: string[]; // Array of backup codes
}

export interface MFAVerificationResult {
  isValid: boolean;
  message?: string;
}

// ============================================================================
// MFA Secret Generation (T243)
// ============================================================================

/**
 * Generate MFA secret and QR code for user enrollment
 *
 * This should be called when a user enables MFA for the first time.
 * The secret and backup codes should be stored securely in the database.
 *
 * @param userEmail User's email address (displayed in authenticator app)
 * @param userName User's name (optional, displayed in authenticator app)
 * @returns MFA secret, QR code, and backup codes
 *
 * @example
 * ```typescript
 * const mfa = await generateMFASecret('user@example.com', 'John Doe');
 *
 * // Store in database:
 * await db.users.update({
 *   where: { id: userId },
 *   data: {
 *     mfa_secret: mfa.secret,
 *     mfa_backup_codes: JSON.stringify(mfa.backupCodes), // Encrypted!
 *     mfa_enabled: true
 *   }
 * });
 *
 * // Send QR code to user
 * res.json({
 *   qrCode: mfa.qrCodeDataUrl,
 *   backupCodes: mfa.backupCodes, // Show once, user must save
 *   secret: mfa.secret // Optionally show for manual entry
 * });
 * ```
 */
export async function generateMFASecret(
  userEmail: string,
  userName?: string
): Promise<MFASecret> {
  const config = getMFAConfig();

  // Generate secret using speakeasy
  const secret = speakeasy.generateSecret({
    name: `${config.issuer} (${userEmail})`,
    issuer: config.issuer,
    length: 32, // 32-byte secret (recommended by RFC 6238)
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP auth URL');
  }

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Generate backup codes
  const backupCodes = generateBackupCodes(config.backupCodesCount, config.backupCodeLength);

  return {
    secret: secret.base32, // Base32-encoded secret
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Generate backup recovery codes
 * Each code is single-use only
 *
 * @param count Number of codes to generate
 * @param length Length of each code
 * @returns Array of backup codes
 */
function generateBackupCodes(count: number = 10, length: number = 8): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random alphanumeric code
    // Generate more bytes than needed to ensure we have enough alphanumeric chars after filtering
    let code = '';
    while (code.length < length) {
      const bytes = crypto.randomBytes(length);
      const chunk = bytes
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      code += chunk;
    }

    codes.push(code.substring(0, length));
  }

  return codes;
}

// ============================================================================
// MFA Verification (T243)
// ============================================================================

/**
 * Verify TOTP code
 *
 * @param secret User's MFA secret (base32-encoded)
 * @param token 6-digit code from authenticator app
 * @returns Verification result
 *
 * @example
 * ```typescript
 * // During login after password verification
 * const user = await db.users.findOne({ email });
 *
 * if (user.mfa_enabled) {
 *   const result = verifyTOTP(user.mfa_secret, req.body.mfaCode);
 *
 *   if (!result.isValid) {
 *     return res.status(401).json({
 *       error: 'Invalid MFA code',
 *       message: result.message
 *     });
 *   }
 *
 *   // MFA verified, issue session token
 *   const token = generateJWT(user, { mfaVerified: true });
 *   res.json({ token });
 * }
 * ```
 */
export function verifyTOTP(secret: string, token: string): MFAVerificationResult {
  if (!secret || !token) {
    return {
      isValid: false,
      message: 'Secret and token are required',
    };
  }

  const config = getMFAConfig();

  // Verify token using speakeasy
  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: config.totpWindow, // Allow 1 time step drift (±30 seconds)
    digits: config.totpDigits, // 6-digit codes
  });

  return {
    isValid,
    message: isValid ? 'Code verified successfully' : 'Invalid or expired code',
  };
}

/**
 * Verify backup recovery code
 *
 * IMPORTANT: Backup codes are single-use only. After verification, the code
 * must be removed from the user's backup codes list.
 *
 * @param backupCodes Array of user's backup codes (from database)
 * @param code Code provided by user
 * @returns Verification result with remaining codes
 *
 * @example
 * ```typescript
 * const user = await db.users.findOne({ email });
 * const backupCodes = JSON.parse(user.mfa_backup_codes);
 *
 * const result = verifyBackupCode(backupCodes, req.body.backupCode);
 *
 * if (result.isValid) {
 *   // Update database with remaining codes
 *   await db.users.update({
 *     where: { id: user.id },
 *     data: {
 *       mfa_backup_codes: JSON.stringify(result.remainingCodes)
 *     }
 *   });
 *
 *   // Issue session token
 *   const token = generateJWT(user, { mfaVerified: true });
 *   res.json({
 *     token,
 *     message: `Backup code accepted. ${result.remainingCodes.length} codes remaining.`
 *   });
 * }
 * ```
 */
export function verifyBackupCode(
  backupCodes: string[],
  code: string
): MFAVerificationResult & { remainingCodes: string[] } {
  if (!backupCodes || backupCodes.length === 0) {
    return {
      isValid: false,
      message: 'No backup codes available',
      remainingCodes: [],
    };
  }

  if (!code) {
    return {
      isValid: false,
      message: 'Backup code is required',
      remainingCodes: backupCodes,
    };
  }

  // Normalize code (remove spaces, uppercase)
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();

  // Check if code exists
  const codeIndex = backupCodes.findIndex(
    (bc) => bc.replace(/\s/g, '').toUpperCase() === normalizedCode
  );

  if (codeIndex === -1) {
    return {
      isValid: false,
      message: 'Invalid backup code',
      remainingCodes: backupCodes,
    };
  }

  // Remove used code
  const remainingCodes = [...backupCodes];
  remainingCodes.splice(codeIndex, 1);

  return {
    isValid: true,
    message: `Backup code accepted. ${remainingCodes.length} codes remaining.`,
    remainingCodes,
  };
}

// ============================================================================
// MFA Enrollment Flow
// ============================================================================

/**
 * Complete MFA enrollment
 *
 * This verifies the user's first TOTP code to ensure they've correctly
 * set up their authenticator app before enabling MFA.
 *
 * @param secret MFA secret (base32)
 * @param token TOTP code from user's authenticator app
 * @returns True if enrollment is successful
 *
 * @example
 * ```typescript
 * // Step 1: Generate secret and QR code
 * const mfa = await generateMFASecret(user.email);
 *
 * // Store temporarily (session or temp table)
 * req.session.mfaSetup = {
 *   secret: mfa.secret,
 *   backupCodes: mfa.backupCodes
 * };
 *
 * // Send QR code to user
 * res.json({ qrCode: mfa.qrCodeDataUrl });
 *
 * // Step 2: User scans QR code and enters first code
 * const isEnrolled = completeMFAEnrollment(
 *   req.session.mfaSetup.secret,
 *   req.body.code
 * );
 *
 * if (isEnrolled) {
 *   // Save to database
 *   await db.users.update({
 *     where: { id: user.id },
 *     data: {
 *       mfa_secret: req.session.mfaSetup.secret,
 *       mfa_backup_codes: JSON.stringify(req.session.mfaSetup.backupCodes),
 *       mfa_enabled: true
 *     }
 *   });
 *
 *   // Clear temp data
 *   delete req.session.mfaSetup;
 *
 *   res.json({
 *     success: true,
 *     backupCodes: req.session.mfaSetup.backupCodes
 *   });
 * }
 * ```
 */
export function completeMFAEnrollment(secret: string, token: string): boolean {
  const result = verifyTOTP(secret, token);
  return result.isValid;
}

// ============================================================================
// MFA Disable/Reset
// ============================================================================

/**
 * Disable MFA for a user
 *
 * This should require additional authentication (password confirmation)
 * before disabling MFA for security.
 *
 * @param userId User ID
 * @param password User's current password (for confirmation)
 * @returns True if MFA was disabled successfully
 *
 * @example
 * ```typescript
 * router.post('/mfa/disable', authenticateJWT, async (req, res) => {
 *   const user = await db.users.findOne({ id: req.user.userId });
 *
 *   // Verify password
 *   const isValidPassword = await comparePassword(
 *     req.body.password,
 *     user.password_hash
 *   );
 *
 *   if (!isValidPassword) {
 *     return res.status(401).json({
 *       error: 'Invalid password'
 *     });
 *   }
 *
 *   // Disable MFA
 *   await db.users.update({
 *     where: { id: user.id },
 *     data: {
 *       mfa_enabled: false,
 *       mfa_secret: null,
 *       mfa_backup_codes: null
 *     }
 *   });
 *
 *   res.json({
 *     success: true,
 *     message: 'MFA has been disabled'
 *   });
 * });
 * ```
 */
export function disableMFA(): boolean {
  // This is a placeholder - actual implementation would update database
  // The real logic should be in the route handler with database access
  return true;
}

/**
 * Regenerate backup codes
 *
 * Users can regenerate backup codes if they've lost them or used most of them.
 * This invalidates all previous backup codes.
 *
 * @param count Number of codes to generate
 * @param length Length of each code
 * @returns New backup codes
 *
 * @example
 * ```typescript
 * router.post('/mfa/regenerate-backup-codes', authenticateJWT, async (req, res) => {
 *   const config = getMFAConfig();
 *   const newBackupCodes = regenerateBackupCodes(
 *     config.backupCodesCount,
 *     config.backupCodeLength
 *   );
 *
 *   // Update database
 *   await db.users.update({
 *     where: { id: req.user.userId },
 *     data: {
 *       mfa_backup_codes: JSON.stringify(newBackupCodes)
 *     }
 *   });
 *
 *   res.json({
 *     success: true,
 *     backupCodes: newBackupCodes,
 *     message: 'Backup codes have been regenerated. Save them securely.'
 *   });
 * });
 * ```
 */
export function regenerateBackupCodes(count: number = 10, length: number = 8): string[] {
  return generateBackupCodes(count, length);
}

// ============================================================================
// MFA Status Check
// ============================================================================

/**
 * Check if MFA is required for a user role
 *
 * MFA is required for healthcare professionals (pharmacist, doctor, nurse)
 * NOT required for patients or delivery personnel
 *
 * @param userRole User's role
 * @returns True if MFA should be enforced
 */
export function isMFARequiredForRole(
  userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY'
): boolean {
  const mfaRequiredRoles = ['PHARMACIST', 'DOCTOR', 'NURSE'];
  return mfaRequiredRoles.includes(userRole);
}

/**
 * Check if user has MFA enabled
 *
 * @param mfaSecret User's MFA secret (from database)
 * @returns True if MFA is enabled
 */
export function isMFAEnabled(mfaSecret: string | null | undefined): boolean {
  return mfaSecret !== null && mfaSecret !== undefined && mfaSecret.length > 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format backup codes for display
 * Groups codes for better readability
 *
 * @param codes Array of backup codes
 * @returns Formatted codes (e.g., "ABCD-EFGH")
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map((code) => {
    // Insert dash in middle for readability
    const mid = Math.floor(code.length / 2);
    return `${code.substring(0, mid)}-${code.substring(mid)}`;
  });
}

/**
 * Generate TOTP code (for testing purposes only)
 * DO NOT expose this in production API
 *
 * @param secret MFA secret (base32)
 * @returns Current TOTP code
 */
export function generateTOTPCode(secret: string): string {
  const config = getMFAConfig();

  return speakeasy.totp({
    secret,
    encoding: 'base32',
    digits: config.totpDigits,
  });
}

/**
 * Get time remaining until TOTP code expires
 *
 * @returns Seconds remaining
 */
export function getTOTPTimeRemaining(): number {
  const period = 30; // TOTP period in seconds
  const currentTime = Math.floor(Date.now() / 1000);
  return period - (currentTime % period);
}

// ============================================================================
// Security Recommendations
// ============================================================================

/**
 * Get MFA security recommendations for users
 *
 * @returns Array of security tips
 */
export function getMFASecurityRecommendations(): string[] {
  return [
    'Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)',
    'Save your backup codes in a secure location (password manager, encrypted file)',
    'Never share your backup codes or QR code with anyone',
    'If you lose access to your authenticator app, use a backup code to log in',
    'Regenerate backup codes if you suspect they have been compromised',
    'Enable MFA on all your accounts for maximum security',
    'Use a strong, unique password in combination with MFA',
  ];
}

/**
 * Validate MFA setup completeness
 *
 * @param mfaSecret User's MFA secret
 * @param backupCodes User's backup codes
 * @returns Validation result
 */
export function validateMFASetup(
  mfaSecret: string | null | undefined,
  backupCodes: string[] | null | undefined
): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!mfaSecret || mfaSecret.length === 0) {
    issues.push('MFA secret is missing');
  }

  if (!backupCodes || backupCodes.length === 0) {
    issues.push('Backup codes are missing');
  } else if (backupCodes.length < 5) {
    issues.push(
      'Low backup code count. Regenerate backup codes to ensure account recovery.'
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
