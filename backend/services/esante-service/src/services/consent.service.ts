/**
 * Consent Management Service
 * Manages patient consent for EPD access by healthcare providers
 * Swiss healthcare data protection and patient privacy
 */

import {
  PatientConsent,
  ConsentStatus,
  EPDDocumentType,
  ICantonalAdapter,
} from '../types/esante.types';

export class ConsentService {
  private consents: Map<string, PatientConsent> = new Map();
  private adapters: Map<string, ICantonalAdapter> = new Map();

  /**
   * Register a cantonal adapter
   */
  registerAdapter(adapter: ICantonalAdapter): void {
    this.adapters.set(adapter.canton, adapter);
  }

  /**
   * Get adapter for a specific canton
   */
  private getAdapter(canton: string): ICantonalAdapter | null {
    return this.adapters.get(canton) || null;
  }

  /**
   * Get consent status for patient-pharmacy pair
   */
  async getConsent(
    patientId: string,
    pharmacyId: string,
    canton: string,
    accessToken: string
  ): Promise<PatientConsent | null> {
    const cacheKey = this.generateCacheKey(patientId, pharmacyId);

    // Check memory cache first
    const cached = this.consents.get(cacheKey);
    if (cached && this.isConsentValid(cached)) {
      return cached;
    }

    // Fetch from adapter
    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    try {
      const consent = await adapter.getPatientConsent(patientId, pharmacyId);
      if (consent) {
        // Cache the consent
        this.consents.set(cacheKey, consent);
      }
      return consent;
    } catch (error) {
      console.error(`Error fetching consent from ${canton}:`, error);
      throw new Error(`Failed to retrieve consent: ${error}`);
    }
  }

  /**
   * Request consent from patient for pharmacy access
   */
  async requestConsent(
    patientId: string,
    pharmacyId: string,
    pharmacyName: string,
    documentTypes: EPDDocumentType[],
    canton: string
  ): Promise<PatientConsent> {
    const consentId = this.generateConsentId();

    const consent: PatientConsent = {
      id: consentId,
      patientId,
      pharmacyId,
      pharmacyName,
      consentStatus: ConsentStatus.REQUESTED,
      documentTypes,
      lastModified: new Date(),
      scopeDetails: {
        allowAllDocuments: false,
        allowedDocumentTypes: documentTypes,
        allowHistoricalData: true,
        dateSince: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year back
      },
    };

    // Store consent
    const cacheKey = this.generateCacheKey(patientId, pharmacyId);
    this.consents.set(cacheKey, consent);

    return consent;
  }

  /**
   * Grant consent from patient
   */
  async grantConsent(
    patientId: string,
    pharmacyId: string,
    documentTypes: EPDDocumentType[],
    canton: string,
    accessToken: string,
    expiresIn?: number
  ): Promise<PatientConsent> {
    // Get existing consent or create new one
    const existing = await this.getConsent(patientId, pharmacyId, canton, accessToken);

    const consent: PatientConsent = existing || {
      id: this.generateConsentId(),
      patientId,
      pharmacyId,
      pharmacyName: 'Unknown Pharmacy',
      consentStatus: ConsentStatus.GRANTED,
      documentTypes,
      lastModified: new Date(),
      scopeDetails: {
        allowAllDocuments: false,
        allowedDocumentTypes: documentTypes,
        allowHistoricalData: true,
      },
    };

    if (existing?.pharmacyName) {
      consent.pharmacyName = existing.pharmacyName;
    }

    consent.consentStatus = ConsentStatus.GRANTED;
    consent.grantedAt = new Date();
    consent.lastModified = new Date();

    // Set expiry (default 1 year if not specified)
    if (expiresIn) {
      consent.expiresAt = new Date(Date.now() + expiresIn * 1000);
    } else {
      consent.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Update scope
    consent.scopeDetails.allowedDocumentTypes = documentTypes;

    // Update in adapter
    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    try {
      await adapter.updatePatientConsent(consent, accessToken);
    } catch (error) {
      console.error(`Error updating consent in ${canton}:`, error);
      throw new Error(`Failed to update consent: ${error}`);
    }

    // Cache the consent
    const cacheKey = this.generateCacheKey(patientId, pharmacyId);
    this.consents.set(cacheKey, consent);

    return consent;
  }

  /**
   * Revoke consent
   */
  async revokeConsent(
    patientId: string,
    pharmacyId: string,
    canton: string,
    accessToken: string
  ): Promise<boolean> {
    const consent = await this.getConsent(patientId, pharmacyId, canton, accessToken);
    if (!consent) {
      throw new Error('Consent not found');
    }

    consent.consentStatus = ConsentStatus.REVOKED;
    consent.revokedAt = new Date();
    consent.lastModified = new Date();

    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    try {
      const success = await adapter.updatePatientConsent(consent, accessToken);

      if (success) {
        // Update cache
        const cacheKey = this.generateCacheKey(patientId, pharmacyId);
        this.consents.set(cacheKey, consent);
      }

      return success;
    } catch (error) {
      console.error(`Error revoking consent in ${canton}:`, error);
      throw new Error(`Failed to revoke consent: ${error}`);
    }
  }

  /**
   * Validate if consent exists and is still valid for a specific document type
   */
  async validateConsent(
    patientId: string,
    pharmacyId: string,
    documentType: EPDDocumentType,
    canton: string,
    accessToken: string
  ): Promise<boolean> {
    const consent = await this.getConsent(patientId, pharmacyId, canton, accessToken);

    if (!consent) {
      return false;
    }

    // Check consent status
    if (consent.consentStatus !== ConsentStatus.GRANTED) {
      return false;
    }

    // Check if expired
    if (!this.isConsentValid(consent)) {
      return false;
    }

    // Check if document type is allowed
    if (
      consent.scopeDetails.allowAllDocuments ||
      consent.scopeDetails.allowedDocumentTypes.includes(documentType)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get all consents for a patient
   */
  async getPatientConsents(patientId: string): Promise<PatientConsent[]> {
    const consents: PatientConsent[] = [];

    this.consents.forEach((consent) => {
      if (consent.patientId === patientId && this.isConsentValid(consent)) {
        consents.push(consent);
      }
    });

    return consents;
  }

  /**
   * Get all consents given by patient to a pharmacy
   */
  async getPharmacyConsents(pharmacyId: string): Promise<PatientConsent[]> {
    const consents: PatientConsent[] = [];

    this.consents.forEach((consent) => {
      if (consent.pharmacyId === pharmacyId && this.isConsentValid(consent)) {
        consents.push(consent);
      }
    });

    return consents;
  }

  /**
   * Check if consent is still valid (not expired or revoked)
   */
  private isConsentValid(consent: PatientConsent): boolean {
    // Check if revoked
    if (consent.consentStatus === ConsentStatus.REVOKED) {
      return false;
    }

    // Check if expired
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      return false;
    }

    // Check if not yet granted
    if (consent.consentStatus !== ConsentStatus.GRANTED) {
      return false;
    }

    return true;
  }

  /**
   * Generate unique consent ID
   */
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(patientId: string, pharmacyId: string): string {
    return `${patientId}:${pharmacyId}`;
  }

  /**
   * Clean up expired consents
   */
  cleanupExpiredConsents(): number {
    let cleaned = 0;
    const keysToDelete: string[] = [];

    this.consents.forEach((consent, key) => {
      if (!this.isConsentValid(consent)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.consents.delete(key);
      cleaned++;
    });

    return cleaned;
  }

  /**
   * Get consent statistics
   */
  getStats(): {
    totalConsents: number;
    activeConsents: number;
    grantedConsents: number;
    requestedConsents: number;
    revokedConsents: number;
  } {
    let activeConsents = 0;
    let grantedConsents = 0;
    let requestedConsents = 0;
    let revokedConsents = 0;

    this.consents.forEach((consent) => {
      if (this.isConsentValid(consent)) {
        activeConsents++;
      }
      if (consent.consentStatus === ConsentStatus.GRANTED) {
        grantedConsents++;
      }
      if (consent.consentStatus === ConsentStatus.REQUESTED) {
        requestedConsents++;
      }
      if (consent.consentStatus === ConsentStatus.REVOKED) {
        revokedConsents++;
      }
    });

    return {
      totalConsents: this.consents.size,
      activeConsents,
      grantedConsents,
      requestedConsents,
      revokedConsents,
    };
  }
}
