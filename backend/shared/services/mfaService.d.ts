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
export interface MFASecret {
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
}
export interface MFAVerificationResult {
    isValid: boolean;
    message?: string;
}
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
export declare function generateMFASecret(userEmail: string, userName?: string): Promise<MFASecret>;
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
export declare function verifyTOTP(secret: string, token: string): MFAVerificationResult;
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
export declare function verifyBackupCode(backupCodes: string[], code: string): MFAVerificationResult & {
    remainingCodes: string[];
};
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
export declare function completeMFAEnrollment(secret: string, token: string): boolean;
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
export declare function disableMFA(): boolean;
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
export declare function regenerateBackupCodes(count?: number, length?: number): string[];
/**
 * Check if MFA is required for a user role
 *
 * MFA is required for healthcare professionals (pharmacist, doctor, nurse)
 * NOT required for patients or delivery personnel
 *
 * @param userRole User's role
 * @returns True if MFA should be enforced
 */
export declare function isMFARequiredForRole(userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY'): boolean;
/**
 * Check if user has MFA enabled
 *
 * @param mfaSecret User's MFA secret (from database)
 * @returns True if MFA is enabled
 */
export declare function isMFAEnabled(mfaSecret: string | null | undefined): boolean;
/**
 * Format backup codes for display
 * Groups codes for better readability
 *
 * @param codes Array of backup codes
 * @returns Formatted codes (e.g., "ABCD-EFGH")
 */
export declare function formatBackupCodes(codes: string[]): string[];
/**
 * Generate TOTP code (for testing purposes only)
 * DO NOT expose this in production API
 *
 * @param secret MFA secret (base32)
 * @returns Current TOTP code
 */
export declare function generateTOTPCode(secret: string): string;
/**
 * Get time remaining until TOTP code expires
 *
 * @returns Seconds remaining
 */
export declare function getTOTPTimeRemaining(): number;
/**
 * Get MFA security recommendations for users
 *
 * @returns Array of security tips
 */
export declare function getMFASecurityRecommendations(): string[];
/**
 * Validate MFA setup completeness
 *
 * @param mfaSecret User's MFA secret
 * @param backupCodes User's backup codes
 * @returns Validation result
 */
export declare function validateMFASetup(mfaSecret: string | null | undefined, backupCodes: string[] | null | undefined): {
    isValid: boolean;
    issues: string[];
};
//# sourceMappingURL=mfaService.d.ts.map