/**
 * e-Santé Integration Types
 * Swiss healthcare system integration (EPD, HIN, XDS.b)
 */

// HIN Authentication Types
export interface HINCredential {
  hinId: string;
  email: string;
  organizationName: string;
  organizationOid: string;
  role: 'pharmacist' | 'doctor' | 'nurse' | 'healthcare_professional';
  canton: SwissCanton;
  certificateThumbprint: string;
  expiresAt: Date;
}

export interface HINAuthRequest {
  hinId: string;
  password: string;
  canton: SwissCanton;
}

export interface HINAuthResponse {
  success: boolean;
  credential?: HINCredential;
  token?: string;
  expiresIn?: number;
  error?: string;
}

// EPD Document Types
export enum EPDDocumentType {
  PRESCRIPTION = 'prescription',
  MEDICAL_REPORT = 'medical_report',
  LAB_RESULT = 'lab_result',
  IMAGING_REPORT = 'imaging_report',
  MEDICATION_LIST = 'medication_list',
  ALLERGY_LIST = 'allergy_list',
  CONDITION_LIST = 'condition_list',
  VACCINE_RECORD = 'vaccine_record',
  DISCHARGE_LETTER = 'discharge_letter',
  CONSULTATION_NOTE = 'consultation_note',
  OTHER = 'other',
}

export interface EPDDocument {
  id: string;
  documentId: string; // Unique ID in EPD system
  patientId: string;
  title: string;
  description?: string;
  documentType: EPDDocumentType;
  createdAt: Date;
  createdBy: string; // HIN ID of creator
  createdByOrganization: string;
  lastModified: Date;
  contentType: string; // MIME type
  contentSize: number;
  xdsId: string; // XDS.b registry ID
  formatCode: string; // XDS.b format code
  statusCode: 'approved' | 'submitted' | 'deprecated' | 'replaced';
  confidentialityLevel: ConfidentialityLevel;
  source: string; // Cantonal system source
  isSharedWithPharmacy: boolean;
  consentRequired: boolean;
  consentObtained?: Date;
}

// Patient Consent Types
export enum ConsentStatus {
  NOT_REQUESTED = 'not_requested',
  REQUESTED = 'requested',
  GRANTED = 'granted',
  DENIED = 'denied',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export interface PatientConsent {
  id: string;
  patientId: string;
  pharmacyId: string;
  pharmacyName: string;
  consentStatus: ConsentStatus;
  documentTypes: EPDDocumentType[];
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  lastModified: Date;
  scopeDetails: {
    allowAllDocuments: boolean;
    allowedDocumentTypes: EPDDocumentType[];
    allowHistoricalData: boolean;
    dateSince?: Date;
  };
}

// EPD Patient types
export interface EPDPatientInfo {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'O' | 'U';
  nationality: string;
  insuranceNumber: string;
  epdHomeCanton: SwissCanton;
}

// Cantonal system types
export type SwissCanton =
  | 'AG'
  | 'AI'
  | 'AR'
  | 'BE'
  | 'BL'
  | 'BS'
  | 'FR'
  | 'GE'
  | 'GL'
  | 'GR'
  | 'JU'
  | 'LU'
  | 'NE'
  | 'NW'
  | 'OW'
  | 'SG'
  | 'SH'
  | 'SO'
  | 'SZ'
  | 'TG'
  | 'TI'
  | 'UR'
  | 'VD'
  | 'VS'
  | 'ZG'
  | 'ZH';

export enum ConfidentialityLevel {
  NORMAL = 'normal',
  RESTRICTED = 'restricted',
  HIGHLY_RESTRICTED = 'highly_restricted',
}

// Adapter Interface
export interface ICantonalAdapter {
  canton: SwissCanton;
  authenticateWithHIN(credential: HINCredential): Promise<string>;
  listDocuments(
    patientId: string,
    accessToken: string,
    filters?: DocumentFilters
  ): Promise<EPDDocument[]>;
  getDocument(documentId: string, accessToken: string): Promise<DocumentContent>;
  uploadDocument(
    patientId: string,
    document: DocumentUploadRequest,
    accessToken: string
  ): Promise<EPDDocument>;
  getPatientConsent(patientId: string, pharmacyId: string): Promise<PatientConsent | null>;
  updatePatientConsent(consent: PatientConsent, accessToken: string): Promise<boolean>;
  validateConsent(patientId: string, pharmacyId: string, documentType: EPDDocumentType): Promise<boolean>;
}

// Query filters
export interface DocumentFilters {
  documentTypes?: EPDDocumentType[];
  createdSince?: Date;
  createdUntil?: Date;
  createdBy?: string;
  confidentialityLevel?: ConfidentialityLevel;
  statusCode?: 'approved' | 'submitted' | 'deprecated' | 'replaced';
}

// Document content response
export interface DocumentContent {
  id: string;
  documentId: string;
  title: string;
  contentType: string;
  data: Buffer;
  metadata: EPDDocument;
}

// Document upload request
export interface DocumentUploadRequest {
  title: string;
  description?: string;
  documentType: EPDDocumentType;
  formatCode: string;
  contentType: string;
  data: Buffer;
  confidentialityLevel?: ConfidentialityLevel;
  createdBy: string; // HIN ID
  createdByOrganization: string;
}

// XDS.b Registry Entry
export interface XDSRegistryEntry {
  id: string;
  documentId: string;
  patientId: string;
  repositoryId: string;
  registryOid: string;
  formatCode: string;
  creationTime: Date;
  lastModificationTime: Date;
}
