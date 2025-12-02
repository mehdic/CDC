/**
 * HIN OAuth2 Provider
 *
 * Implements HIN (Health Info Net AG) OAuth2 authentication
 * Based on research: bazinga/artifacts/bazinga_20251202_234053/research_group_P1_R1_HIN.md
 *
 * Features:
 * - Authorization Code Grant flow
 * - Token refresh mechanism
 * - GLN (Global Location Number) extraction
 * - Healthcare professional role detection
 * - Session management
 */

import axios, { AxiosError } from 'axios';
import {
  getHINConfig,
  validateHINConfig,
  generateStateParameter,
  validateStateParameter,
  buildAuthorizationUrl,
  parseHINProfession,
  type HINConfig,
  type HINTokenResponse,
  type HINUserInfo,
} from './hin-config';

export interface AuthorizationResult {
  authorizationUrl: string;
  state: string;
}

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  userInfo: HINUserInfo;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class HINProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HINProviderError';
  }
}

/**
 * HIN OAuth2 Provider Class
 */
export class HINProvider {
  private config: HINConfig;

  constructor() {
    this.config = getHINConfig();
    const validation = validateHINConfig(this.config);
    if (!validation.valid) {
      throw new HINProviderError(
        validation.error || 'Invalid HIN configuration',
        'INVALID_CONFIG'
      );
    }
  }

  /**
   * Initiate HIN authorization flow
   * Returns authorization URL and state parameter
   */
  public initiateAuthorization(): AuthorizationResult {
    const state = generateStateParameter();
    const authorizationUrl = buildAuthorizationUrl(this.config, state);

    return {
      authorizationUrl,
      state,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<TokenExchangeResult> {
    // Validate state parameter (CSRF protection)
    if (!validateStateParameter(state)) {
      throw new HINProviderError(
        'Invalid or expired state parameter',
        'INVALID_STATE'
      );
    }

    try {
      // Step 1: Exchange authorization code for tokens
      const tokenResponse = await axios.post<HINTokenResponse>(
        this.config.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      if (!access_token) {
        throw new HINProviderError(
          'No access token received from HIN',
          'NO_ACCESS_TOKEN'
        );
      }

      // Step 2: Fetch user information
      const userInfo = await this.fetchUserInfo(access_token);

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        userInfo,
      };
    } catch (error) {
      if (error instanceof HINProviderError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      throw new HINProviderError(
        'Failed to exchange authorization code',
        'TOKEN_EXCHANGE_FAILED',
        axiosError.response?.data || axiosError.message
      );
    }
  }

  /**
   * Fetch user information from HIN
   */
  public async fetchUserInfo(accessToken: string): Promise<HINUserInfo> {
    try {
      const response = await axios.get<HINUserInfo>(
        this.config.userInfoEndpoint,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userInfo = response.data;

      // Validate required fields
      if (!userInfo.sub || !userInfo.email) {
        throw new HINProviderError(
          'Incomplete user information from HIN',
          'INCOMPLETE_USER_INFO',
          userInfo
        );
      }

      return userInfo;
    } catch (error) {
      if (error instanceof HINProviderError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      throw new HINProviderError(
        'Failed to fetch user information from HIN',
        'USERINFO_FETCH_FAILED',
        axiosError.response?.data || axiosError.message
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(
    refreshToken: string
  ): Promise<RefreshTokenResult> {
    try {
      const tokenResponse = await axios.post<HINTokenResponse>(
        this.config.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

      if (!access_token) {
        throw new HINProviderError(
          'No access token received from HIN',
          'NO_ACCESS_TOKEN'
        );
      }

      return {
        accessToken: access_token,
        refreshToken: new_refresh_token,
        expiresIn: expires_in,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new HINProviderError(
        'Failed to refresh access token',
        'TOKEN_REFRESH_FAILED',
        axiosError.response?.data || axiosError.message
      );
    }
  }

  /**
   * Validate HIN access token by fetching user info
   */
  public async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.fetchUserInfo(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract healthcare professional credentials from user info
   */
  public extractCredentials(userInfo: HINUserInfo): {
    hinId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'doctor' | 'pharmacist' | 'nurse';
    gln?: string;
  } {
    return {
      hinId: userInfo.sub,
      email: userInfo.email.toLowerCase(),
      firstName: userInfo.given_name || 'Unknown',
      lastName: userInfo.family_name || 'Unknown',
      role: parseHINProfession(userInfo.profession),
      gln: userInfo.gln,
    };
  }
}

// Export singleton instance
export const hinProvider = new HINProvider();
