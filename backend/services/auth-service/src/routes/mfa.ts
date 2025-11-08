/**
 * MFA Routes (T046, T047)
 * Handles TOTP-based Multi-Factor Authentication
 *
 * Endpoints:
 * - POST /auth/mfa/verify - Verify TOTP code during login
 * - POST /auth/mfa/setup - Generate new MFA secret and QR code
 * - POST /auth/mfa/enable - Enable MFA after verification
 * - DELETE /auth/mfa/disable - Disable MFA (requires password)
 */

import { Router, Request, Response } from 'express';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { AppDataSource } from '../index';
import { User } from '@models/User';
import { AuditTrailEntry, AuditAction } from '@models/AuditTrailEntry';
import { verifyAccessToken } from '@utils/jwt';
import { generateTokenPair } from '@utils/jwt';
import { comparePassword } from '@utils/auth';
import { encryptField, decryptField } from '@utils/encryption';

const router = Router();

const MFA_ISSUER = process.env.MFA_ISSUER || 'MetaPharm Connect';
const MFA_WINDOW = parseInt(process.env.MFA_WINDOW || '1', 10);

// ============================================================================
// Helper Functions for MFA Secret Encryption (FR-104)
// ============================================================================

/**
 * Get MFA secret for a user (handles both encrypted and legacy plaintext)
 * For backward compatibility, checks encrypted field first, then falls back to plaintext
 */
async function getMFASecret(user: User): Promise<string | null> {
  if (user.mfa_secret_encrypted) {
    try {
      return await decryptField(user.mfa_secret_encrypted);
    } catch (error) {
      console.error('Failed to decrypt MFA secret:', error);
      throw new Error('Failed to decrypt MFA secret');
    }
  }

  // Fall back to legacy plaintext (for existing users)
  return user.mfa_secret;
}

/**
 * Store MFA secret securely (encrypted)
 */
async function setMFASecret(user: User, secret: string): Promise<void> {
  try {
    user.mfa_secret_encrypted = await encryptField(secret);
    user.mfa_secret = null; // Clear legacy plaintext field
  } catch (error) {
    console.error('Failed to encrypt MFA secret:', error);
    throw new Error('Failed to encrypt MFA secret');
  }
}

// ============================================================================
// POST /auth/mfa/verify
// Verify TOTP code during login flow
// ============================================================================

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        error: 'Temporary token and TOTP code are required',
      });
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = verifyAccessToken(tempToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired temporary token',
      });
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    if (!user.mfa_enabled || (!user.mfa_secret_encrypted && !user.mfa_secret)) {
      return res.status(400).json({
        success: false,
        error: 'MFA is not enabled for this user',
      });
    }

    // Get decrypted MFA secret
    const mfaSecret = await getMFASecret(user);

    if (!mfaSecret) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve MFA secret',
      });
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token: code,
      window: MFA_WINDOW, // Allow 30s before/after
    });

    if (!isValid) {
      // Log failed MFA attempt
      await createAuditEntry(user.id, 'mfa.verification_failed', 'Invalid TOTP code', req);

      return res.status(401).json({
        success: false,
        error: 'Invalid verification code',
      });
    }

    // MFA verification successful - generate full tokens
    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.primary_pharmacy_id
    );

    // Update last login
    user.updateLastLogin();
    await userRepository.save(user);

    // Log successful MFA
    await createAuditEntry(user.id, 'mfa.verification_success', 'MFA verification successful', req);

    return res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        pharmacyId: user.primary_pharmacy_id,
      },
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during MFA verification',
    });
  }
});

// ============================================================================
// POST /auth/mfa/setup
// Generate new MFA secret and QR code
// ============================================================================

router.post('/setup', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Generate new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${MFA_ISSUER} (${user.email})`,
      issuer: MFA_ISSUER,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store secret securely (encrypted) - not enabled until verified
    await setMFASecret(user, secret.base32);
    user.mfa_enabled = false; // Don't enable until user verifies
    await userRepository.save(user);

    // Log MFA setup
    await createAuditEntry(user.id, 'mfa.setup', 'MFA secret generated', req);

    return res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during MFA setup',
    });
  }
});

// ============================================================================
// POST /auth/mfa/enable
// Enable MFA after verifying setup
// ============================================================================

router.post('/enable', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { code } = req.body;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    if (!user.mfa_secret_encrypted && !user.mfa_secret) {
      return res.status(400).json({
        success: false,
        error: 'MFA setup required first. Call /auth/mfa/setup',
      });
    }

    // Get decrypted MFA secret
    const mfaSecret = await getMFASecret(user);

    if (!mfaSecret) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve MFA secret',
      });
    }

    // Verify code with the stored secret
    const isValid = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token: code,
      window: MFA_WINDOW,
    });

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid verification code',
      });
    }

    // Enable MFA
    user.mfa_enabled = true;
    await userRepository.save(user);

    // Log MFA enabled
    await createAuditEntry(user.id, 'mfa.enabled', 'MFA enabled successfully', req);

    return res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
    });

  } catch (error) {
    console.error('MFA enable error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while enabling MFA',
    });
  }
});

// ============================================================================
// DELETE /auth/mfa/disable
// Disable MFA (requires password confirmation)
// ============================================================================

router.delete('/disable', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { password } = req.body;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password confirmation is required to disable MFA',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Healthcare professionals cannot disable MFA (FR-002)
    if (user.isHealthcareProfessional()) {
      return res.status(403).json({
        success: false,
        error: 'Healthcare professionals must have MFA enabled',
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Password authentication not available',
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      await createAuditEntry(user.id, 'mfa.disable_failed', 'Invalid password for MFA disable', req);

      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    // Disable MFA - clear both encrypted and legacy plaintext secrets
    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_secret_encrypted = null;
    await userRepository.save(user);

    // Log MFA disabled
    await createAuditEntry(user.id, 'mfa.disabled', 'MFA disabled', req);

    return res.status(200).json({
      success: true,
      message: 'MFA disabled successfully',
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while disabling MFA',
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function createAuditEntry(
  userId: string,
  eventType: string,
  description: string,
  req: Request
): Promise<void> {
  try {
    const auditRepository = AppDataSource.getRepository(AuditTrailEntry);

    const auditEntry = auditRepository.create({
      pharmacy_id: null,
      user_id: userId,
      event_type: eventType,
      action: AuditAction.CREATE,
      resource_type: 'authentication',
      resource_id: userId,
      changes: { description } as any,
      ip_address: req.ip || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      device_info: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      } as any,
    });

    await auditRepository.save(auditEntry);
  } catch (error) {
    console.error('Failed to create audit entry:', error);
  }
}

export default router;
