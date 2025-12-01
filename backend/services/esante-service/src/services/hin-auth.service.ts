/**
 * HIN Authentication Service
 * Healthcare provider authentication via HIN (Health Info Net)
 * Swiss standard for healthcare professional authentication
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { HINAuthRequest, HINAuthResponse, HINCredential } from '../types/esante.types';

export class HINAuthService {
  private _hinApiUrl: string;
  private _clientId: string;
  private _clientSecret: string;
  private jwtSecret: string;
  private hinCache: Map<string, HINCredential> = new Map();

  constructor() {
    this._hinApiUrl = process.env.HIN_API_URL || 'https://hin.api.example.com';
    this._clientId = process.env.HIN_CLIENT_ID || 'default-client';
    this._clientSecret = process.env.HIN_CLIENT_SECRET || 'default-secret';
    this.jwtSecret = process.env.JWT_SECRET || 'jwt-secret-key';
  }

  /**
   * Authenticate healthcare professional with HIN credentials
   * Validates HIN ID and password against HIN system
   */
  async authenticate(request: HINAuthRequest): Promise<HINAuthResponse> {
    try {
      // Validate input
      if (!request.hinId || !request.password) {
        return {
          success: false,
          error: 'Missing HIN ID or password',
        };
      }

      // Check cache first (valid for 5 minutes)
      const cached = this.hinCache.get(request.hinId);
      if (cached && this.isCredentialValid(cached)) {
        const token = this.generateToken(cached);
        return {
          success: true,
          credential: cached,
          token,
          expiresIn: 3600,
        };
      }

      // In production, would call actual HIN API
      // For now, simulate HIN authentication
      const credential = await this.validateWithHINSystem(request);

      if (!credential) {
        return {
          success: false,
          error: 'Invalid HIN credentials',
        };
      }

      // Cache the credential
      this.hinCache.set(request.hinId, credential);

      // Generate JWT token
      const token = this.generateToken(credential);

      return {
        success: true,
        credential,
        token,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      console.error('HIN authentication error:', error);
      return {
        success: false,
        error: 'Authentication service error',
      };
    }
  }

  /**
   * Validate credential against HIN system
   * In production, would call actual HIN API endpoint
   */
  private async validateWithHINSystem(request: HINAuthRequest): Promise<HINCredential | null> {
    try {
      // Simulate HIN API call with mock data
      // In production: POST https://hin.api.example.com/authenticate
      // with client certificate and credentials

      // For demo purposes, generate mock credential
      // Real implementation would validate against HIN LDAP/API
      if (request.hinId.startsWith('HIN') && request.password.length >= 8) {
        return {
          hinId: request.hinId,
          email: `${request.hinId}@hin.example.com`,
          organizationName: 'Mock Organization',
          organizationOid: '2.16.756.5.30.1.123.100.1.1.1',
          role: this.parseRoleFromHIN(request.hinId),
          canton: request.canton,
          certificateThumbprint: this.generateThumbprint(request.hinId),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        };
      }

      return null;
    } catch (error) {
      console.error('HIN system validation error:', error);
      return null;
    }
  }

  /**
   * Parse role from HIN ID format
   */
  private parseRoleFromHIN(hinId: string): 'pharmacist' | 'doctor' | 'nurse' | 'healthcare_professional' {
    const roles = ['pharmacist', 'doctor', 'nurse', 'healthcare_professional'] as const;
    const roleIndex = hinId.charCodeAt(3) % roles.length;
    return roles[roleIndex];
  }

  /**
   * Generate certificate thumbprint (SHA-256)
   */
  private generateThumbprint(hinId: string): string {
    return crypto.createHash('sha256').update(hinId).digest('hex');
  }

  /**
   * Check if credential is still valid (not expired)
   */
  private isCredentialValid(credential: HINCredential): boolean {
    return credential.expiresAt > new Date();
  }

  /**
   * Generate JWT token for authenticated credential
   */
  private generateToken(credential: HINCredential): string {
    const payload = {
      hinId: credential.hinId,
      email: credential.email,
      organization: credential.organizationName,
      role: credential.role,
      canton: credential.canton,
      certificateThumbprint: credential.certificateThumbprint,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h',
      issuer: 'esante-service',
      subject: credential.hinId,
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'esante-service',
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Clear expired credentials from cache
   */
  clearExpiredCache(): void {
    const now = new Date();
    const entriesToDelete: string[] = [];

    this.hinCache.forEach((credential, hinId) => {
      if (!this.isCredentialValid(credential)) {
        entriesToDelete.push(hinId);
      }
    });

    entriesToDelete.forEach((hinId) => {
      this.hinCache.delete(hinId);
    });
  }

  /**
   * Get cached credential
   */
  getCredential(hinId: string): HINCredential | undefined {
    const credential = this.hinCache.get(hinId);
    if (credential && this.isCredentialValid(credential)) {
      return credential;
    }
    return undefined;
  }
}
