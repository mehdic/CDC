/**
 * Base Cantonal Adapter
 * Abstract base class for cantonal EPD system implementations
 * Defines interface for different cantonal EPD providers
 */

import {
  ICantonalAdapter,
  SwissCanton,
  EPDDocument,
  EPDDocumentType,
  DocumentFilters,
  DocumentContent,
  DocumentUploadRequest,
  PatientConsent,
  HINCredential,
  ConsentStatus,
} from '../types/esante.types';

export abstract class BaseCantonalAdapter implements ICantonalAdapter {
  abstract canton: SwissCanton;
  protected apiUrl: string = '';
  protected clientId: string = '';
  protected clientSecret: string = '';

  constructor() {
    this.initializeConfig();
  }

  /**
   * Initialize adapter configuration from environment
   */
  protected abstract initializeConfig(): void;

  /**
   * Authenticate with HIN credential
   * Returns access token for API calls
   */
  async authenticateWithHIN(credential: HINCredential): Promise<string> {
    try {
      // Validate credential
      if (!credential.hinId || !credential.certificateThumbprint) {
        throw new Error('Invalid HIN credential');
      }

      // Implementation-specific authentication
      const accessToken = await this.performHINAuth(credential);
      return accessToken;
    } catch (error) {
      console.error(`HIN authentication failed for ${this.canton}:`, error);
      throw new Error(`HIN authentication failed: ${error}`);
    }
  }

  /**
   * List documents for a patient
   */
  async listDocuments(
    patientId: string,
    accessToken: string,
    filters?: DocumentFilters
  ): Promise<EPDDocument[]> {
    try {
      // Validate token
      if (!accessToken) {
        throw new Error('Invalid access token');
      }

      const documents = await this.queryDocuments(patientId, accessToken, filters);
      return documents;
    } catch (error) {
      console.error(`Error listing documents in ${this.canton}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId: string, accessToken: string): Promise<DocumentContent> {
    try {
      if (!accessToken) {
        throw new Error('Invalid access token');
      }

      const content = await this.retrieveDocument(documentId, accessToken);
      return content;
    } catch (error) {
      console.error(`Error retrieving document from ${this.canton}:`, error);
      throw error;
    }
  }

  /**
   * Upload a document to EPD
   */
  async uploadDocument(
    patientId: string,
    document: DocumentUploadRequest,
    accessToken: string
  ): Promise<EPDDocument> {
    try {
      if (!accessToken) {
        throw new Error('Invalid access token');
      }

      // Validate document
      this.validateDocumentUpload(document);

      const uploadedDoc = await this.pushDocument(patientId, document, accessToken);
      return uploadedDoc;
    } catch (error) {
      console.error(`Error uploading document to ${this.canton}:`, error);
      throw error;
    }
  }

  /**
   * Get patient consent for document access
   */
  async getPatientConsent(patientId: string, pharmacyId: string): Promise<PatientConsent | null> {
    try {
      const consent = await this.queryConsent(patientId, pharmacyId);
      return consent;
    } catch (error) {
      console.error(`Error fetching consent from ${this.canton}:`, error);
      throw error;
    }
  }

  /**
   * Update patient consent
   */
  async updatePatientConsent(consent: PatientConsent, accessToken: string): Promise<boolean> {
    try {
      if (!accessToken) {
        throw new Error('Invalid access token');
      }

      const success = await this.persistConsent(consent, accessToken);
      return success;
    } catch (error) {
      console.error(`Error updating consent in ${this.canton}:`, error);
      throw error;
    }
  }

  /**
   * Validate if consent exists and is valid for document access
   */
  async validateConsent(
    patientId: string,
    pharmacyId: string,
    documentType: EPDDocumentType
  ): Promise<boolean> {
    try {
      const consent = await this.queryConsent(patientId, pharmacyId);

      if (!consent || consent.consentStatus !== ConsentStatus.GRANTED) {
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
    } catch (error) {
      console.error(`Error validating consent in ${this.canton}:`, error);
      return false;
    }
  }

  /**
   * Abstract methods to be implemented by subclasses
   */

  /**
   * Perform HIN authentication (implementation-specific)
   */
  protected abstract performHINAuth(credential: HINCredential): Promise<string>;

  /**
   * Query documents from EPD system (implementation-specific)
   */
  protected abstract queryDocuments(
    patientId: string,
    accessToken: string,
    filters?: DocumentFilters
  ): Promise<EPDDocument[]>;

  /**
   * Retrieve a specific document (implementation-specific)
   */
  protected abstract retrieveDocument(documentId: string, accessToken: string): Promise<DocumentContent>;

  /**
   * Upload/push document to EPD (implementation-specific)
   */
  protected abstract pushDocument(
    patientId: string,
    document: DocumentUploadRequest,
    accessToken: string
  ): Promise<EPDDocument>;

  /**
   * Query consent from system (implementation-specific)
   */
  protected abstract queryConsent(
    patientId: string,
    pharmacyId: string
  ): Promise<PatientConsent | null>;

  /**
   * Persist/update consent (implementation-specific)
   */
  protected abstract persistConsent(consent: PatientConsent, accessToken: string): Promise<boolean>;

  /**
   * Validate document upload
   */
  protected validateDocumentUpload(document: DocumentUploadRequest): void {
    if (!document.title) {
      throw new Error('Document title is required');
    }

    if (!document.documentType || !Object.values(EPDDocumentType).includes(document.documentType)) {
      throw new Error('Invalid document type');
    }

    if (!document.formatCode) {
      throw new Error('Format code is required for XDS.b compliance');
    }

    if (!document.contentType) {
      throw new Error('Content type is required');
    }

    if (!document.data || document.data.length === 0) {
      throw new Error('Document content is required');
    }
  }

  /**
   * Generate XDS.b format code based on document type
   */
  protected getFormatCode(documentType: EPDDocumentType): string {
    const formatCodes: Record<EPDDocumentType, string> = {
      [EPDDocumentType.PRESCRIPTION]: 'urn:ihe:lab:xd-lab:2008',
      [EPDDocumentType.MEDICAL_REPORT]: 'urn:ihe:rad:PDF:2008',
      [EPDDocumentType.LAB_RESULT]: 'urn:ihe:lab:xd-lab:2008',
      [EPDDocumentType.IMAGING_REPORT]: 'urn:ihe:rad:TEXT:2008',
      [EPDDocumentType.MEDICATION_LIST]: 'urn:ihe:pharm:pml:2013',
      [EPDDocumentType.ALLERGY_LIST]: 'urn:ihe:pharm:aml:2013',
      [EPDDocumentType.CONDITION_LIST]: 'urn:ihe:pharm:cml:2013',
      [EPDDocumentType.VACCINE_RECORD]: 'urn:ihe:pharm:vml:2013',
      [EPDDocumentType.DISCHARGE_LETTER]: 'urn:ihe:text:CDA:Discharge:2010',
      [EPDDocumentType.CONSULTATION_NOTE]: 'urn:ihe:text:CDA:Consultation:2010',
      [EPDDocumentType.OTHER]: 'urn:ihe:text:CDA:ImagingReport:2010',
    };

    return formatCodes[documentType] || 'urn:ihe:text:CDA:Document:2010';
  }

  /**
   * Get MIME type for document
   */
  protected getMimeType(documentType: EPDDocumentType): string {
    // Most Swiss EPD documents are PDF or CDA XML
    if (
      [
        EPDDocumentType.PRESCRIPTION,
        EPDDocumentType.MEDICAL_REPORT,
        EPDDocumentType.IMAGING_REPORT,
      ].includes(documentType)
    ) {
      return 'application/pdf';
    }
    return 'application/xml';
  }
}
