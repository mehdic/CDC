/**
 * HIN e-ID Integration (T8-035)
 * Swiss Healthcare e-ID OAuth 2.0 flow with GLN verification
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
 * 6. Verify GLN (Global Location Number)
 * 7. Match/create user account
 * 8. Generate JWT tokens
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { HINAuthService } from '../services/hinAuthService';

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

// Initialize HIN Auth Service
const hinAuthService = new HINAuthService(AppDataSource, {
  clientId: HIN_CLIENT_ID,
  clientSecret: HIN_CLIENT_SECRET,
  redirectUri: HIN_REDIRECT_URI,
  authorizationEndpoint: HIN_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: HIN_TOKEN_ENDPOINT,
  userInfoEndpoint: HIN_USERINFO_ENDPOINT,
});

// ============================================================================
// GET /auth/hin/authorize
// Initiate HIN e-ID OAuth flow
// ============================================================================

router.get('/authorize', (req: Request, res: Response) => {
  try {
    // Validate configuration
    const config = hinAuthService.validateConfiguration();
    if (!config.valid) {
      console.error('HIN configuration errors:', config.errors);
      return res.status(500).json({
        success: false,
        error: 'HIN e-ID not configured. Please contact administrator.',
        details: config.errors,
      });
    }

    // Initiate OAuth flow
    const { url } = hinAuthService.initiateHINAuth();

    console.log('Redirecting to HIN authorization');

    // Redirect user to HIN authorization page
    res.redirect(url);

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
// Handle HIN e-ID OAuth callback with GLN verification
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

    // Validate state parameter (CSRF protection)
    if (!state || typeof state !== 'string') {
      console.error('State parameter missing or invalid from HIN callback');
      return res.status(400).json({
        success: false,
        error: 'State parameter missing from callback - possible CSRF attack',
      });
    }

    console.log('Received authorization code and state from HIN');

    // Get IP and User-Agent for audit logging
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // =========================================================================
    // Handle HIN callback using HINAuthService
    // =========================================================================

    const result = await hinAuthService.handleCallback(
      code as string,
      state as string,
      ipAddress,
      userAgent
    );

    const { user, tokens, requiresMFA, requiresMFASetup, gln } = result;

    // =========================================================================
    // Handle MFA requirements
    // =========================================================================

    if (requiresMFASetup) {
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
        gln: gln?.valid ? {
          number: gln.gln,
          verifiedAt: gln.verifiedAt,
        } : undefined,
        message: 'MFA setup required for healthcare professionals',
      });
    }

    if (requiresMFA) {
      return res.status(200).json({
        success: true,
        requiresMFA: true,
        tempToken: tokens.accessToken,
        gln: gln?.valid ? {
          number: gln.gln,
          verifiedAt: gln.verifiedAt,
        } : undefined,
      });
    }

    // =========================================================================
    // Successful authentication response
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
      gln: gln?.valid ? {
        number: gln.gln,
        verifiedAt: gln.verifiedAt,
      } : undefined,
    });

  } catch (error: any) {
    console.error('HIN callback error:', error);

    // Return appropriate error messages
    const errorMessage =
      error.message || 'An error occurred during HIN authentication';

    return res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
