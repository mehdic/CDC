/**
 * Geneva Cantonal Adapter
 * Integration with Geneva's MonDossierMedical platform
 * Cantonal EPD implementation for Geneva (GE)
 */

import { BaseCantonalAdapter } from './base-cantonal.adapter';
import {
  SwissCanton,
  EPDDocument,
  EPDDocumentType,
  DocumentFilters,
  DocumentContent,
  DocumentUploadRequest,
  PatientConsent,
  HINCredential,
  ConfidentialityLevel,
  ConsentStatus,
} from '../types/esante.types';

export class GenevaAdapter extends BaseCantonalAdapter {
  canton: SwissCanton = 'GE';
  private mdmApiUrl: string = '';

  protected initializeConfig(): void {
    this.mdmApiUrl = process.env.GENEVA_MDM_API_URL || 'https://mondossiermédical.ge.ch/api';
    this.clientId = process.env.GENEVA_CLIENT_ID || 'geneva-client';
    this.clientSecret = process.env.GENEVA_CLIENT_SECRET || 'geneva-secret';
  }

  /**
   * Geneva-specific HIN authentication
   * MonDossierMedical uses OAuth2 with HIN certificate
   */
  protected async performHINAuth(credential: HINCredential): Promise<string> {
    try {
      // In production: OAuth2 flow with HIN certificate
      // POST to ${this.mdmApiUrl}/oauth/authorize
      // with client credentials and HIN certificate

      if (credential.hinId.startsWith('HIN')) {
        const token = `geneva_token_${credential.hinId}_${Date.now()}`;
        return token;
      }

      throw new Error('Invalid HIN credential for Geneva');
    } catch (error) {
      console.error('Geneva HIN authentication failed:', error);
      throw error;
    }
  }

  /**
   * Query documents from Geneva MonDossierMedical
   */
  protected async queryDocuments(
    patientId: string,
    accessToken: string,
    filters?: DocumentFilters
  ): Promise<EPDDocument[]> {
    try {
      // In production: GET ${this.mdmApiUrl}/documents
      // with patientId and filters

      const documents: EPDDocument[] = [];

      if (patientId) {
        documents.push({
          id: `geneva_${patientId}_1`,
          documentId: `doc_${patientId}_1`,
          patientId,
          title: 'Consultation médicale',
          description: 'Medical consultation notes from Geneva clinic',
          documentType: EPDDocumentType.CONSULTATION_NOTE,
          createdAt: new Date('2024-01-20'),
          createdBy: 'HIN11111',
          createdByOrganization: 'Clinique Genève',
          lastModified: new Date('2024-01-20'),
          contentType: 'application/xml',
          contentSize: 125000,
          xdsId: 'urn:uuid:geneva-1',
          formatCode: this.getFormatCode(EPDDocumentType.CONSULTATION_NOTE),
          statusCode: 'approved',
          confidentialityLevel: ConfidentialityLevel.NORMAL,
          source: 'MonDossierMedical-GE',
          isSharedWithPharmacy: false,
          consentRequired: true,
        });

        documents.push({
          id: `geneva_${patientId}_2`,
          documentId: `doc_${patientId}_2`,
          patientId,
          title: 'Liste des allergies',
          description: 'Allergy information from Geneva medical records',
          documentType: EPDDocumentType.ALLERGY_LIST,
          createdAt: new Date('2024-01-05'),
          createdBy: 'HIN22222',
          createdByOrganization: 'Hôpital Genève',
          lastModified: new Date('2024-01-05'),
          contentType: 'application/xml',
          contentSize: 45000,
          xdsId: 'urn:uuid:geneva-2',
          formatCode: this.getFormatCode(EPDDocumentType.ALLERGY_LIST),
          statusCode: 'approved',
          confidentialityLevel: ConfidentialityLevel.NORMAL,
          source: 'MonDossierMedical-GE',
          isSharedWithPharmacy: true,
          consentRequired: true,
        });

        documents.push({
          id: `geneva_${patientId}_3`,
          documentId: `doc_${patientId}_3`,
          patientId,
          title: 'Vaccinations',
          description: 'Vaccine records from Geneva',
          documentType: EPDDocumentType.VACCINE_RECORD,
          createdAt: new Date('2023-12-15'),
          createdBy: 'HIN33333',
          createdByOrganization: 'Centre de Vaccination Genève',
          lastModified: new Date('2023-12-15'),
          contentType: 'application/xml',
          contentSize: 65000,
          xdsId: 'urn:uuid:geneva-3',
          formatCode: this.getFormatCode(EPDDocumentType.VACCINE_RECORD),
          statusCode: 'approved',
          confidentialityLevel: ConfidentialityLevel.NORMAL,
          source: 'MonDossierMedical-GE',
          isSharedWithPharmacy: true,
          consentRequired: false,
        });
      }

      if (filters) {
        return this.applyFilters(documents, filters);
      }

      return documents;
    } catch (error) {
      console.error('Error querying Geneva MonDossierMedical documents:', error);
      throw error;
    }
  }

  /**
   * Retrieve a specific document from Geneva MonDossierMedical
   */
  protected async retrieveDocument(
    documentId: string,
    accessToken: string
  ): Promise<DocumentContent> {
    try {
      // In production: GET ${this.mdmApiUrl}/documents/{documentId}
      // with accessToken

      const mockContent = Buffer.from(
        `Geneva MonDossierMedical Document: ${documentId}`,
        'utf-8'
      );

      return {
        id: documentId,
        documentId,
        title: 'Sample Geneva Document',
        contentType: 'application/xml',
        data: mockContent,
        metadata: {
          id: documentId,
          documentId,
          patientId: 'patient123',
          title: 'Sample Geneva Document',
          documentType: EPDDocumentType.CONSULTATION_NOTE,
          createdAt: new Date(),
          createdBy: 'HIN11111',
          createdByOrganization: 'Clinique Genève',
          lastModified: new Date(),
          contentType: 'application/xml',
          contentSize: mockContent.length,
          xdsId: `urn:uuid:${documentId}`,
          formatCode: this.getFormatCode(EPDDocumentType.CONSULTATION_NOTE),
          statusCode: 'approved',
          confidentialityLevel: ConfidentialityLevel.NORMAL,
          source: 'MonDossierMedical-GE',
          isSharedWithPharmacy: false,
          consentRequired: true,
        },
      };
    } catch (error) {
      console.error('Error retrieving document from Geneva MonDossierMedical:', error);
      throw error;
    }
  }

  /**
   * Upload document to Geneva MonDossierMedical
   */
  protected async pushDocument(
    patientId: string,
    document: DocumentUploadRequest,
    accessToken: string
  ): Promise<EPDDocument> {
    try {
      // In production: POST ${this.mdmApiUrl}/documents
      // with document content and metadata

      const newDocument: EPDDocument = {
        id: `geneva_${patientId}_${Date.now()}`,
        documentId: `doc_${Date.now()}`,
        patientId,
        title: document.title,
        description: document.description,
        documentType: document.documentType,
        createdAt: new Date(),
        createdBy: document.createdBy,
        createdByOrganization: document.createdByOrganization,
        lastModified: new Date(),
        contentType: document.contentType,
        contentSize: document.data.length,
        xdsId: `urn:uuid:geneva-${Date.now()}`,
        formatCode: document.formatCode,
        statusCode: 'submitted',
        confidentialityLevel: document.confidentialityLevel || ConfidentialityLevel.NORMAL,
        source: 'MonDossierMedical-GE',
        isSharedWithPharmacy: false,
        consentRequired: true,
      };

      return newDocument;
    } catch (error) {
      console.error('Error uploading document to Geneva MonDossierMedical:', error);
      throw error;
    }
  }

  /**
   * Query consent from Geneva system
   */
  protected async queryConsent(
    patientId: string,
    pharmacyId: string
  ): Promise<PatientConsent | null> {
    try {
      // Mock: return pending consent
      return {
        id: `consent_${patientId}_${pharmacyId}`,
        patientId,
        pharmacyId,
        pharmacyName: 'Pharmacy Geneva',
        consentStatus: ConsentStatus.REQUESTED,
        documentTypes: [EPDDocumentType.PRESCRIPTION, EPDDocumentType.MEDICATION_LIST],
        lastModified: new Date(),
        scopeDetails: {
          allowAllDocuments: false,
          allowedDocumentTypes: [EPDDocumentType.PRESCRIPTION, EPDDocumentType.MEDICATION_LIST],
          allowHistoricalData: true,
        },
      };
    } catch (error) {
      console.error('Error querying Geneva consent:', error);
      return null;
    }
  }

  /**
   * Persist consent in Geneva system
   */
  protected async persistConsent(consent: PatientConsent, accessToken: string): Promise<boolean> {
    try {
      // In production: POST/PUT to Geneva consent management API

      return true;
    } catch (error) {
      console.error('Error persisting consent in Geneva:', error);
      return false;
    }
  }

  /**
   * Apply filters to documents
   */
  private applyFilters(documents: EPDDocument[], filters: DocumentFilters): EPDDocument[] {
    let filtered = [...documents];

    if (filters.documentTypes && filters.documentTypes.length > 0) {
      filtered = filtered.filter((doc) => filters.documentTypes!.includes(doc.documentType));
    }

    if (filters.createdSince) {
      filtered = filtered.filter((doc) => doc.createdAt >= filters.createdSince!);
    }

    if (filters.createdUntil) {
      filtered = filtered.filter((doc) => doc.createdAt <= filters.createdUntil!);
    }

    if (filters.confidentialityLevel) {
      filtered = filtered.filter((doc) => doc.confidentialityLevel === filters.confidentialityLevel);
    }

    return filtered;
  }
}
