/**
 * HIN Authentication Service (T8-035)
 * Handles HIN e-ID OAuth 2.0 flow and credential verification
 *
 * Features:
 * - OAuth 2.0 Authorization Code Flow with CSRF protection (state validation)
 * - GLN (Global Location Number) extraction and validation
 * - Healthcare professional credential verification
 * - User account linking and creation
 */

import axios, { AxiosError } from 'axios';
import { DataSource, Repository } from 'typeorm';
import { generateTokenPair } from '@utils/jwt';

// Use lazy imports to avoid TypeORM reflection issues
let User: any;
let UserRole: any;
let UserStatus: any;
let AuditTrailEntry: any;
let AuditAction: any;

function initializeModels() {
  if (!User) {
    const userModule = require('@models/User');
    User = userModule.User;
    UserRole = userModule.UserRole;
    UserStatus = userModule.UserStatus;
  }
  if (!AuditTrailEntry) {
    const auditModule = require('@models/AuditTrailEntry');
    AuditTrailEntry = auditModule.AuditTrailEntry;
    AuditAction = auditModule.AuditAction;
  }
}

/**
 * HIN Profile data from OAuth userinfo endpoint
 */
export interface HINProfile {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  profession?: string;
  gln?: string;
  role?: string;
  name?: string;
  hin_id?: string;
}

/**
 * Token response from HIN OAuth endpoint
 */
export interface HINTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

/**
 * GLN Verification Result
 */
export interface GLNVerification {
  valid: boolean;
  gln: string;
  verifiedAt: Date;
  error?: string;
}

/**
 * OAuth State Storage Entry
 * Stores state parameter with TTL for CSRF protection
 */
interface StateStorageEntry {
  state: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * HIN Authentication Service
 */
export class HINAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authorizationEndpoint: string;
  private tokenEndpoint: string;
  private userInfoEndpoint: string;
  private userRepository: Repository<any>;
  private auditRepository: Repository<any>;
  private stateStore: Map<string, StateStorageEntry> = new Map(); // In-memory state storage
  private readonly STATE_EXPIRY_SECONDS = 600; // 10 minutes

  constructor(
    dataSource: DataSource,
    config: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      authorizationEndpoint: string;
      tokenEndpoint: string;
      userInfoEndpoint: string;
    }
  ) {
    // Initialize models
    initializeModels();

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
    this.userInfoEndpoint = config.userInfoEndpoint;
    this.userRepository = dataSource.getRepository(User);
    this.auditRepository = dataSource.getRepository(AuditTrailEntry);
  }

  /**
   * Initiate HIN OAuth flow
   * Returns authorization URL to redirect user to HIN
   * Stores state parameter in memory for CSRF validation in callback
   */
  public initiateHINAuth(): { url: string; state: string } {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('HIN e-ID not configured. Please contact administrator.');
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    // Store state with expiry time for validation on callback
    const now = Date.now();
    this.stateStore.set(state, {
      state,
      createdAt: now,
      expiresAt: now + this.STATE_EXPIRY_SECONDS * 1000,
    });

    console.log('Generated authorization URL for HIN with state parameter');

    // Build authorization URL
    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile gln');
    authUrl.searchParams.append('state', state);

    return {
      url: authUrl.toString(),
      state,
    };
  }

  /**
   * Validate state parameter for CSRF protection
   * @throws Error if state is missing, invalid, or expired
   */
  public validateStateParameter(state: string | undefined): void {
    if (!state) {
      throw new Error('State parameter missing from callback - possible CSRF attack');
    }

    const storedState = this.stateStore.get(state);

    if (!storedState) {
      throw new Error('Invalid state parameter - state not found or tampered with');
    }

    const now = Date.now();
    if (now > storedState.expiresAt) {
      // Clean up expired state
      this.stateStore.delete(state);
      throw new Error('State parameter expired - request took too long to complete');
    }

    // State is valid - remove it from store (one-time use)
    this.stateStore.delete(state);

    console.log('State parameter validated successfully');
  }

  /**
   * Handle OAuth callback from HIN
   * Exchanges authorization code for token and retrieves user profile
   * Validates state parameter for CSRF protection
   */
  public async handleCallback(
    authorizationCode: string,
    state: string | undefined,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    user: any;
    tokens: ReturnType<typeof generateTokenPair>;
    requiresMFA: boolean;
    requiresMFASetup: boolean;
    gln?: GLNVerification;
  }> {
    if (!authorizationCode) {
      throw new Error('Authorization code not received from HIN');
    }

    // Step 0: Validate state parameter for CSRF protection
    this.validateStateParameter(state);

    // Step 1: Exchange authorization code for access token
    const tokenResponse = await this.exchangeCodeForToken(authorizationCode);

    // Step 2: Fetch user profile from HIN
    const hinProfile = await this.fetchUserInfo(tokenResponse.access_token);

    // Step 3: Verify GLN if present
    let glnVerification: GLNVerification | undefined;
    if (hinProfile.gln) {
      glnVerification = this.verifyGLN(hinProfile.gln);
    }

    // Step 4: Match or create user account
    const user = await this.matchOrCreateUser(hinProfile);

    // Step 5: Check if account is active
    if (!user.isActive()) {
      throw new Error('Account is inactive or suspended');
    }

    // Step 6: Handle MFA requirements
    const requiresMFA = user.mfa_enabled && !!user.mfa_secret;
    const requiresMFASetup =
      user.isHealthcareProfessional() && !user.mfa_enabled;

    // Step 7: Generate tokens
    const tokens = generateTokenPair(
      user.id,
      user.email,
      user.role,
      user.primary_pharmacy_id
    );

    // Step 8: Update user last login
    if (!requiresMFA && !requiresMFASetup) {
      user.updateLastLogin();
      await this.userRepository.save(user);
    }

    // Step 9: Create audit entries
    await this.createAuditEntry(
      user.id,
      'login.hin_success',
      'HIN e-ID login successful',
      ipAddress,
      userAgent
    );

    if (glnVerification?.valid) {
      await this.createAuditEntry(
        user.id,
        'auth.gln_verified',
        `GLN verified: ${glnVerification.gln}`,
        ipAddress,
        userAgent
      );
    }

    return {
      user,
      tokens,
      requiresMFA,
      requiresMFASetup,
      gln: glnVerification,
    };
  }

  /**
   * Exchange authorization code for access token
   * @throws Error if token exchange fails
   */
  private async exchangeCodeForToken(code: string): Promise<HINTokenResponse> {
    try {
      const response = await axios.post(
        this.tokenEndpoint,
        {
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, id_token, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access token received from HIN');
      }

      console.log('Successfully exchanged code for access token');

      return {
        access_token,
        refresh_token,
        id_token,
        expires_in,
        token_type: 'Bearer',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        console.error('HIN token exchange failed:', errorData || error.message);

        if (errorData?.error === 'invalid_grant') {
          throw new Error('Authorization code has expired or is invalid');
        }
        if (errorData?.error === 'access_denied') {
          throw new Error('User denied access to HIN');
        }

        throw new Error(
          errorData?.error_description || 'Failed to exchange authorization code for token'
        );
      }

      throw error;
    }
  }

  /**
   * Fetch user information from HIN userinfo endpoint
   * @throws Error if userinfo fetch fails
   */
  private async fetchUserInfo(accessToken: string): Promise<HINProfile> {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const hinProfile = response.data as HINProfile;

      console.log('Fetched HIN user profile');

      // Validate required fields
      if (!hinProfile.sub || !hinProfile.email) {
        throw new Error('Incomplete user information from HIN');
      }

      return hinProfile;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('HIN userinfo fetch failed:', error.response?.data || error.message);
        throw new Error('Failed to fetch user information from HIN');
      }

      throw error;
    }
  }

  /**
   * Verify GLN (Global Location Number) format and validity
   * GLN format: Swiss healthcare professional identifier
   * Typically 13 digits starting with 7
   */
  public verifyGLN(gln: string): GLNVerification {
    const cleanGLN = gln.trim();

    // Check format: should be 13 digits, starting with 7
    if (!/^\d{13}$/.test(cleanGLN) || !cleanGLN.startsWith('7')) {
      return {
        valid: false,
        gln: cleanGLN,
        verifiedAt: new Date(),
        error: 'Invalid GLN format. Expected 13 digits starting with 7.',
      };
    }

    // Verify using mod-10 checksum (ISO/IEC 7064, mod 10-1)
    const isValidChecksum = this.validateGLNChecksum(cleanGLN);

    if (!isValidChecksum) {
      return {
        valid: false,
        gln: cleanGLN,
        verifiedAt: new Date(),
        error: 'GLN failed checksum validation.',
      };
    }

    return {
      valid: true,
      gln: cleanGLN,
      verifiedAt: new Date(),
    };
  }

  /**
   * Validate GLN checksum using mod-10 algorithm
   */
  private validateGLNChecksum(gln: string): boolean {
    const digits = gln.substring(0, 12);
    const checkDigit = parseInt(gln.charAt(12), 10);

    let sum = 0;
    let even = true;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);

      if (even) {
        digit *= 3;
      }

      sum += digit;
      even = !even;
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  /**
   * Match existing user or create new user from HIN profile
   */
  private async matchOrCreateUser(hinProfile: HINProfile): Promise<any> {
    const hinId = hinProfile.sub || hinProfile.hin_id;
    const email = hinProfile.email.toLowerCase();
    const givenName = hinProfile.given_name;
    const familyName = hinProfile.family_name;
    const profession = hinProfile.profession || hinProfile.role;

    // Try to find existing user by HIN ID
    let user = await this.userRepository.findOne({
      where: { hin_id: hinId },
    });

    if (user) {
      console.log('Found existing user by HIN ID');
      return user;
    }

    // Try to find by email
    user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      // Link HIN ID to existing user
      user.hin_id = hinId;
      user.email_verified = true;
      await this.userRepository.save(user);
      console.log('Linked existing user to HIN ID');

      await this.createAuditEntry(
        user.id,
        'user.hin_id_linked',
        'HIN ID linked to existing account',
        '',
        ''
      );

      return user;
    }

    // Create new user
    const role = this.determineRole(profession);

    console.log(`Creating new user with role: ${role}`);

    user = this.userRepository.create({
      email,
      email_verified: true,
      hin_id: hinId,
      role,
      status: UserStatus.ACTIVE,
      first_name_encrypted: givenName ? Buffer.from(givenName) : Buffer.from('Unknown'),
      last_name_encrypted: familyName ? Buffer.from(familyName) : Buffer.from('Unknown'),
      phone_encrypted: null,
      password_hash: null,
      mfa_enabled: false,
      mfa_secret: null,
      primary_pharmacy_id: null,
    });

    await this.userRepository.save(user);
    console.log('Created new user from HIN e-ID');

    await this.createAuditEntry(
      user.id,
      'user.created_via_hin',
      'User created via HIN e-ID',
      '',
      ''
    );

    return user;
  }

  /**
   * Determine user role based on profession
   */
  private determineRole(profession?: string): any {
    if (!profession) {
      return UserRole.DOCTOR; // Default for HIN users
    }

    const profLower = profession.toLowerCase();

    if (profLower.includes('pharmacist') || profLower.includes('apotheker')) {
      return UserRole.PHARMACIST;
    }

    if (
      profLower.includes('nurse') ||
      profLower.includes('krankenschwester') ||
      profLower.includes('infirmière')
    ) {
      return UserRole.NURSE;
    }

    if (
      profLower.includes('doctor') ||
      profLower.includes('arzt') ||
      profLower.includes('médecin')
    ) {
      return UserRole.DOCTOR;
    }

    return UserRole.DOCTOR; // Default
  }

  /**
   * Create audit entry for authentication event
   */
  private async createAuditEntry(
    userId: string,
    eventType: string,
    description: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const auditEntry = this.auditRepository.create({
        pharmacy_id: null,
        user_id: userId,
        event_type: eventType,
        action: AuditAction.CREATE,
        resource_type: 'authentication',
        resource_id: userId,
        changes: { description } as any,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent || 'unknown',
        device_info: {
          ip: ipAddress,
          userAgent: userAgent,
        } as any,
      });

      await this.auditRepository.save(auditEntry);
      console.log(`Audit entry created: ${eventType}`);
    } catch (error) {
      console.error('Failed to create audit entry:', error);
      // Don't throw - audit failure shouldn't block authentication
    }
  }

  /**
   * Validate HIN configuration
   */
  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.clientId) {
      errors.push('HIN_CLIENT_ID not configured');
    }

    if (!this.clientSecret) {
      errors.push('HIN_CLIENT_SECRET not configured');
    }

    if (!this.redirectUri) {
      errors.push('HIN_REDIRECT_URI not configured');
    }

    if (!this.authorizationEndpoint) {
      errors.push('HIN_AUTHORIZATION_ENDPOINT not configured');
    }

    if (!this.tokenEndpoint) {
      errors.push('HIN_TOKEN_ENDPOINT not configured');
    }

    if (!this.userInfoEndpoint) {
      errors.push('HIN_USERINFO_ENDPOINT not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
