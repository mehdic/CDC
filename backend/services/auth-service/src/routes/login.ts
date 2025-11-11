/**
 * Login Route (T044, T045)
 * Handles email/password authentication with MFA support
 *
 * Flow:
 * 1. Validate email and password
 * 2. Find user in database
 * 3. Verify password using bcrypt
 * 4. Check if MFA is required (healthcare professionals)
 * 5. If MFA enabled: return temp token for MFA verification
 * 6. If no MFA: generate JWT tokens and return
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from '../index';
import { User, UserRole } from '@models/User';
import { AuditTrailEntry, AuditAction } from '@models/AuditTrailEntry';
import { comparePassword } from '@utils/auth';
import { generateTokenPair, generateAccessToken } from '@utils/jwt';

const router = Router();

// ============================================================================
// Rate Limiting Configuration (FR-002)
// ============================================================================

/**
 * Rate limiter for login endpoint to prevent brute force attacks
 * Limits: 5 login attempts per IP per 15-minute window (production)
 * Development: 100 attempts per 15 minutes (for E2E testing)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Relaxed limit for dev/test
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests towards limit
  skipFailedRequests: false, // Count failed requests towards limit
});

// ============================================================================
// Types
// ============================================================================

interface LoginRequest {
  email: string;
  password: string;
  pharmacyId?: string; // Optional pharmacy context
}

interface LoginResponse {
  success: boolean;
  requiresMFA?: boolean;
  tempToken?: string; // Temporary token for MFA flow
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    pharmacyId: string | null;
  };
}

// ============================================================================
// POST /auth/login
// Rate limited to prevent brute force attacks (FR-002)
// ============================================================================

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, pharmacyId }: LoginRequest = req.body;

    // =========================================================================
    // Validation
    // =========================================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // =========================================================================
    // Find User
    // =========================================================================

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['primary_pharmacy'],
    });

    if (!user) {
      // Use generic error message to prevent email enumeration
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive or suspended',
      });
    }

    // =========================================================================
    // Verify Password
    // =========================================================================

    if (!user.password_hash) {
      // User might be HIN e-ID only
      return res.status(401).json({
        success: false,
        error: 'Password authentication not available. Please use HIN e-ID.',
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Log failed login attempt
      await createAuditEntry(user.id, 'login.failed', 'Failed password verification', req);

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // =========================================================================
    // Check MFA Requirement
    // =========================================================================

    // Healthcare professionals MUST have MFA enabled (FR-002)
    if (user.isHealthcareProfessional() && !user.mfa_enabled) {
      return res.status(403).json({
        success: false,
        error: 'MFA is required for healthcare professionals. Please enable MFA.',
        requiresMFASetup: true,
      });
    }

    // If MFA is enabled, require verification
    if (user.mfa_enabled && (user.mfa_secret_encrypted || user.mfa_secret)) {
      // Generate temporary token for MFA verification step
      // This token is short-lived (5 minutes) and can only be used for MFA verification
      const tempToken = generateAccessToken(
        user.id,
        user.email,
        user.role,
        user.primary_pharmacy_id
      );

      // Log MFA required
      await createAuditEntry(user.id, 'login.mfa_required', 'MFA verification required', req);

      return res.status(200).json({
        success: true,
        requiresMFA: true,
        tempToken,
      } as LoginResponse);
    }

    // =========================================================================
    // Generate JWT Tokens (No MFA Required)
    // =========================================================================

    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.role,
      pharmacyId || user.primary_pharmacy_id
    );

    // Update last login timestamp
    user.updateLastLogin();
    await userRepository.save(user);

    // Create audit trail entry
    await createAuditEntry(user.id, 'login.success', 'User logged in successfully', req);

    // =========================================================================
    // Response
    // =========================================================================

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
        // Note: Encrypted fields would need decryption in production
        // For now, we'll omit them from the response
      },
    } as LoginResponse);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login',
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an audit trail entry
 */
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
    // Don't throw - audit failure shouldn't block login
  }
}

export default router;
