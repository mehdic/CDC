/**
 * HIN OAuth2 Configuration
 *
 * Configuration for HIN (Health Info Net) OAuth2 integration
 * Based on research: bazinga/artifacts/bazinga_20251202_234053/research_group_P1_R1_HIN.md
 *
 * HIN is Switzerland's trusted identity provider for healthcare professionals
 * Provides OAuth2-based authentication with MFA support
 */

export interface HINConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
}

export interface HINTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface HINUserInfo {
  sub: string; // HIN ID
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  profession?: string; // doctor, pharmacist, nurse
  gln?: string; // Global Location Number (Swiss healthcare professional ID)
}

/**
 * Get HIN OAuth2 configuration from environment variables
 */
export function getHINConfig(): HINConfig {
  const config: HINConfig = {
    clientId: process.env.HIN_CLIENT_ID || '',
    clientSecret: process.env.HIN_CLIENT_SECRET || '',
    redirectUri: process.env.HIN_REDIRECT_URI || 'http://localhost:4001/auth/hin/callback',
    authorizationEndpoint: process.env.HIN_AUTHORIZATION_ENDPOINT || 'https://oauth2.hin.ch/authorize',
    tokenEndpoint: process.env.HIN_TOKEN_ENDPOINT || 'https://oauth2.hin.ch/REST/v1/getoAuthToken',
    userInfoEndpoint: process.env.HIN_USERINFO_ENDPOINT || 'https://oauth2.hin.ch/userinfo',
    scopes: (process.env.HIN_SCOPES || 'openid profile email').split(' '),
  };

  return config;
}

/**
 * Validate HIN configuration
 */
export function validateHINConfig(config: HINConfig): { valid: boolean; error?: string } {
  if (!config.clientId || !config.clientSecret) {
    return {
      valid: false,
      error: 'HIN_CLIENT_ID and HIN_CLIENT_SECRET must be configured',
    };
  }

  if (!config.redirectUri) {
    return {
      valid: false,
      error: 'HIN_REDIRECT_URI must be configured',
    };
  }

  return { valid: true };
}

/**
 * Generate CSRF state parameter
 */
export function generateStateParameter(): string {
  return Buffer.from(
    JSON.stringify({
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15),
    })
  ).toString('base64url');
}

/**
 * Validate state parameter
 */
export function validateStateParameter(state: string, maxAge: number = 600000): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    const age = Date.now() - decoded.timestamp;
    return age > 0 && age < maxAge;
  } catch {
    return false;
  }
}

/**
 * Build HIN authorization URL
 */
export function buildAuthorizationUrl(config: HINConfig, state: string): string {
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.append('client_id', config.clientId);
  url.searchParams.append('redirect_uri', config.redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', config.scopes.join(' '));
  url.searchParams.append('state', state);
  return url.toString();
}

/**
 * Parse HIN profession to user role
 */
export function parseHINProfession(profession?: string): 'doctor' | 'pharmacist' | 'nurse' | 'doctor' {
  if (!profession) return 'doctor'; // Default for HIN users

  const profLower = profession.toLowerCase();

  if (
    profLower.includes('pharmacist') ||
    profLower.includes('apotheker') ||
    profLower.includes('pharmacien')
  ) {
    return 'pharmacist';
  }

  if (
    profLower.includes('nurse') ||
    profLower.includes('krankenschwester') ||
    profLower.includes('infirmière') ||
    profLower.includes('pflegefachperson')
  ) {
    return 'nurse';
  }

  return 'doctor'; // Default
}
