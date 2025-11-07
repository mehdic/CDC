/**
 * HIN e-ID Integration (T048)
 * Swiss Healthcare e-ID OAuth 2.0 flow
 *
 * HIN (Health Info Net) is the Swiss healthcare e-ID provider
 * Required for doctors and pharmacists (FR-003)
 *
 * OAuth Flow:
 * 1. GET /auth/hin/authorize - Redirect to HIN authorization page
 * 2. User authorizes on HIN website
 * 3. HIN redirects to /auth/hin/callback with authorization code
 * 4. Exchange code for access token
 * 5. Fetch user profile from HIN
 * 6. Match/create user account
 * 7. Generate JWT tokens
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { AppDataSource } from '../index';
import { User, UserRole } from '../../../shared/models/User';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { generateTokenPair } from '../../../shared/utils/jwt';

const router = Router();

// ============================================================================
// Configuration
// ============================================================================

const HIN_CLIENT_ID = process.env.HIN_CLIENT_ID || '';
const HIN_CLIENT_SECRET = process.env.HIN_CLIENT_SECRET || '';
const HIN_REDIRECT_URI = process.env.HIN_REDIRECT_URI || 'http://localhost:4001/auth/hin/callback';
const HIN_AUTHORIZATION_ENDPOINT = process.env.HIN_AUTHORIZATION_ENDPOINT || 'https://oauth2.hin.ch/authorize';
const HIN_TOKEN_ENDPOINT = process.env.HIN_TOKEN_ENDPOINT || 'https://oauth2.hin.ch/token';
const HIN_USERINFO_ENDPOINT = process.env.HIN_USERINFO_ENDPOINT || 'https://oauth2.hin.ch/userinfo';

// ============================================================================
// GET /auth/hin/authorize
// Initiate HIN e-ID OAuth flow
// ============================================================================

router.get('/authorize', (req: Request, res: Response) => {
  try {
    // Validate configuration
    if (!HIN_CLIENT_ID || !HIN_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'HIN e-ID not configured. Please contact administrator.',
      });
    }

    // Build authorization URL
    const authUrl = new URL(HIN_AUTHORIZATION_ENDPOINT);
    authUrl.searchParams.append('client_id', HIN_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', HIN_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');

    // Optional: Add state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    })).toString('base64');
    authUrl.searchParams.append('state', state);

    console.log('Redirecting to HIN authorization:', authUrl.toString());

    // Redirect user to HIN authorization page
    res.redirect(authUrl.toString());

  } catch (error) {
    console.error('HIN authorization error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred initiating HIN e-ID authentication',
    });
  }
});

// ============================================================================
// GET /auth/hin/callback
// Handle HIN e-ID OAuth callback
// ============================================================================

router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('HIN OAuth error:', error, error_description);
      return res.status(400).json({
        success: false,
        error: `HIN authentication failed: ${error_description || error}`,
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not received from HIN',
      });
    }

    console.log('Received authorization code from HIN');

    // =========================================================================
    // Step 1: Exchange authorization code for access token
    // =========================================================================

    let tokenResponse;
    try {
      tokenResponse = await axios.post(HIN_TOKEN_ENDPOINT, {
        grant_type: 'authorization_code',
        code,
        client_id: HIN_CLIENT_ID,
        client_secret: HIN_CLIENT_SECRET,
        redirect_uri: HIN_REDIRECT_URI,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error: any) {
      console.error('HIN token exchange failed:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to exchange authorization code for token',
      });
    }

    const { access_token, id_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(500).json({
        success: false,
        error: 'No access token received from HIN',
      });
    }

    console.log('Successfully exchanged code for access token');

    // =========================================================================
    // Step 2: Fetch user profile from HIN
    // =========================================================================

    let hinUserInfo;
    try {
      const userInfoResponse = await axios.get(HIN_USERINFO_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      hinUserInfo = userInfoResponse.data;
    } catch (error: any) {
      console.error('HIN userinfo fetch failed:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user information from HIN',
      });
    }

    console.log('Fetched HIN user profile:', hinUserInfo);

    // =========================================================================
    // Step 3: Match or create user account
    // =========================================================================

    const userRepository = AppDataSource.getRepository(User);

    // HIN profile typically contains:
    // - sub (HIN ID)
    // - email
    // - given_name, family_name
    // - profession (e.g., "doctor", "pharmacist")

    const hinId = hinUserInfo.sub || hinUserInfo.hin_id;
    const email = hinUserInfo.email;
    const givenName = hinUserInfo.given_name || hinUserInfo.firstName;
    const familyName = hinUserInfo.family_name || hinUserInfo.lastName;
    const profession = hinUserInfo.profession;

    if (!hinId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete user information from HIN',
      });
    }

    // Find existing user by HIN ID
    let user = await userRepository.findOne({
      where: { hin_id: hinId },
    });

    // If not found by HIN ID, try email
    if (!user) {
      user = await userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      // If found by email, link HIN ID
      if (user) {
        user.hin_id = hinId;
        user.email_verified = true; // HIN e-ID verifies email
        await userRepository.save(user);
        console.log('Linked existing user to HIN ID');
      }
    }

    // If still not found, create new user
    if (!user) {
      // Determine role based on profession
      let role: UserRole = UserRole.DOCTOR; // Default for HIN users

      if (profession) {
        const profLower = profession.toLowerCase();
        if (profLower.includes('pharmacist') || profLower.includes('apotheker')) {
          role = UserRole.PHARMACIST;
        } else if (profLower.includes('doctor') || profLower.includes('arzt') || profLower.includes('médecin')) {
          role = UserRole.DOCTOR;
        } else if (profLower.includes('nurse') || profLower.includes('krankenschwester') || profLower.includes('infirmière')) {
          role = UserRole.NURSE;
        }
      }

      console.log(`Creating new user with role: ${role}`);

      // Note: In production, encrypted fields would be encrypted here
      // For now, we'll store placeholders since we need AWS KMS integration
      user = userRepository.create({
        email: email.toLowerCase(),
        email_verified: true,
        hin_id: hinId,
        role,
        status: 'active',
        first_name_encrypted: Buffer.from(givenName || 'Unknown'),
        last_name_encrypted: Buffer.from(familyName || 'Unknown'),
        phone_encrypted: null,
        password_hash: null, // HIN e-ID only (no password)
        mfa_enabled: false, // Will be prompted to enable MFA
        mfa_secret: null,
        primary_pharmacy_id: null,
      });

      await userRepository.save(user);
      console.log('Created new user from HIN e-ID');

      // Create audit entry for new user
      await createAuditEntry(user.id, 'user.created_via_hin', 'User created via HIN e-ID', req);
    }

    // Check if user is active
    if (!user.isActive()) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive or suspended',
      });
    }

    // =========================================================================
    // Step 4: Check MFA requirement
    // =========================================================================

    // Healthcare professionals MUST have MFA (FR-002)
    // If not enabled, prompt to enable
    if (user.isHealthcareProfessional() && !user.mfa_enabled) {
      // Generate token but require MFA setup
      const tokens = generateTokenPair(
        user.id,
        user.email,
        user.role,
        user.primary_pharmacy_id
      );

      // Create audit entry
      await createAuditEntry(user.id, 'login.hin_success_mfa_required', 'HIN login successful, MFA setup required', req);

      return res.status(200).json({
        success: true,
        requiresMFASetup: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          pharmacyId: user.primary_pharmacy_id,
        },
        message: 'MFA setup required for healthcare professionals',
      });
    }

    // If MFA enabled, require verification
    if (user.mfa_enabled && user.mfa_secret) {
      const tempToken = generateTokenPair(
        user.id,
        user.email,
        user.role,
        user.primary_pharmacy_id
      ).accessToken;

      await createAuditEntry(user.id, 'login.hin_success_mfa_verification_required', 'HIN login successful, MFA verification required', req);

      return res.status(200).json({
        success: true,
        requiresMFA: true,
        tempToken,
      });
    }

    // =========================================================================
    // Step 5: Generate JWT tokens
    // =========================================================================

    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.primary_pharmacy_id
    );

    // Update last login
    user.updateLastLogin();
    await userRepository.save(user);

    // Create audit entry
    await createAuditEntry(user.id, 'login.hin_success', 'HIN e-ID login successful', req);

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
      },
    });

  } catch (error) {
    console.error('HIN callback error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during HIN authentication',
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
      user_id: userId,
      event_type: eventType,
      action: 'create',
      resource_type: 'authentication',
      resource_id: userId,
      changes: { description },
      ip_address: req.ip || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      device_info: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    await auditRepository.save(auditEntry);
  } catch (error) {
    console.error('Failed to create audit entry:', error);
  }
}

export default router;
