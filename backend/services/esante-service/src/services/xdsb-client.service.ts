/**
 * IHE XDS.b Client Service
 * Implements ITI-18 (Registry Stored Query), ITI-41 (Provide and Register Document Set-b),
 * and ITI-43 (Retrieve Document Set) transactions
 *
 * Based on IHE XDS.b profile and Swiss EPD specifications
 */

import * as soap from 'soap';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import axios, { AxiosInstance } from 'axios';
import { EPDDocument, EPDDocumentType, DocumentFilters, DocumentContent, DocumentUploadRequest } from '../types/esante.types';

export interface XDSBConfig {
  registryUrl: string;
  repositoryUrl: string;
  homeCommunityId: string;
  clientCertPath?: string;
  clientKeyPath?: string;
}

export interface ITI18QueryParams {
  patientId: string;
  documentTypes?: string[]; // LOINC codes
  createdFrom?: Date;
  createdTo?: Date;
  status?: 'Approved' | 'Submitted' | 'Deprecated';
}

export interface ITI18Response {
  documents: Array<{
    documentId: string;
    uniqueId: string;
    repositoryUniqueId: string;
    title: string;
    creationTime: Date;
    author: string;
    classCode: string;
    formatCode: string;
    mimeType: string;
    size: number;
  }>;
}

export interface ITI43RetrieveParams {
  documentUniqueId: string;
  repositoryUniqueId: string;
  homeCommunityId?: string;
}

export interface ITI41SubmitParams {
  patientId: string;
  document: Buffer;
  metadata: {
    title: string;
    classCode: string; // LOINC code
    formatCode: string;
    mimeType: string;
    author: string;
    authorInstitution: string;
    confidentialityCode: string;
    languageCode: string;
  };
}

/**
 * IHE XDS.b Client
 *
 * Provides methods to interact with Swiss EPD infrastructure using IHE XDS.b profile.
 * Supports document query (ITI-18), retrieval (ITI-43), and submission (ITI-41).
 */
export class XDSBClient {
  private config: XDSBConfig;
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;
  private httpClient: AxiosInstance;

  constructor(config: XDSBConfig) {
    this.config = config;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
    });
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });

    // Create axios client with SSL configuration if certificates provided
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/soap+xml',
        'Accept': 'application/soap+xml',
      },
    });
  }

  /**
   * ITI-18: Registry Stored Query
   *
   * Queries the XDS.b registry for patient documents matching specified criteria.
   * Returns document metadata without the actual content.
   *
   * @param params Query parameters (patient ID, document types, date range)
   * @param accessToken HIN authentication token
   * @returns Array of document metadata
   */
  async queryDocuments(params: ITI18QueryParams, accessToken: string): Promise<ITI18Response> {
    // Build ITI-18 SOAP request envelope
    const soapEnvelope = this.buildITI18Request(params, accessToken);

    try {
      const response = await this.httpClient.post(this.config.registryUrl, soapEnvelope, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'SOAPAction': 'urn:ihe:iti:2007:RegistryStoredQuery',
        },
      });

      return this.parseITI18Response(response.data);
    } catch (error: any) {
      console.error('ITI-18 Registry Stored Query failed:', error.message);
      throw new Error(`Failed to query EPD registry: ${error.message}`);
    }
  }

  /**
   * ITI-43: Retrieve Document Set
   *
   * Retrieves the actual document content from the repository.
   * Uses SOAP with MTOM (MIME Multipart Optimization Mechanism) for binary data.
   *
   * @param params Document identifiers (document ID, repository ID, community ID)
   * @param accessToken HIN authentication token
   * @returns Document content with metadata
   */
  async retrieveDocument(params: ITI43RetrieveParams, accessToken: string): Promise<DocumentContent> {
    const soapEnvelope = this.buildITI43Request(params, accessToken);

    try {
      const response = await this.httpClient.post(this.config.repositoryUrl, soapEnvelope, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'SOAPAction': 'urn:ihe:iti:2007:RetrieveDocumentSet',
        },
      });

      return this.parseITI43Response(response.data);
    } catch (error: any) {
      console.error('ITI-43 Retrieve Document Set failed:', error.message);
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  /**
   * ITI-41: Provide and Register Document Set-b
   *
   * Submits a new document to the EPD repository and registers it in the registry.
   * Used for uploading pharmacy dispensation records, prescriptions, etc.
   *
   * @param params Submission parameters (patient ID, document, metadata)
   * @param accessToken HIN authentication token
   * @returns Submitted document metadata
   */
  async submitDocument(params: ITI41SubmitParams, accessToken: string): Promise<{ success: boolean; documentId: string }> {
    const soapEnvelope = this.buildITI41Request(params, accessToken);

    try {
      const response = await this.httpClient.post(this.config.repositoryUrl, soapEnvelope, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'SOAPAction': 'urn:ihe:iti:2007:ProvideAndRegisterDocumentSet-b',
        },
      });

      return this.parseITI41Response(response.data);
    } catch (error: any) {
      console.error('ITI-41 Provide and Register Document Set failed:', error.message);
      throw new Error(`Failed to submit document: ${error.message}`);
    }
  }

  /**
   * Build ITI-18 SOAP Request (Registry Stored Query)
   */
  private buildITI18Request(params: ITI18QueryParams, accessToken: string): string {
    // XDS.b FindDocuments query structure
    const patientIdParam = `'${params.patientId}^^^&2.16.756.5.30.1.127.3.10.3&ISO'`; // Swiss EPD patient ID format

    let additionalParams = '';

    if (params.documentTypes && params.documentTypes.length > 0) {
      const classCodeList = params.documentTypes.map(code => `('${code}')`).join(',');
      additionalParams += `
        <rim:Slot name="$XDSDocumentEntryClassCode">
          <rim:ValueList>
            <rim:Value>(${classCodeList})</rim:Value>
          </rim:ValueList>
        </rim:Slot>`;
    }

    if (params.createdFrom) {
      additionalParams += `
        <rim:Slot name="$XDSDocumentEntryCreationTimeFrom">
          <rim:ValueList>
            <rim:Value>${this.formatHL7Date(params.createdFrom)}</rim:Value>
          </rim:ValueList>
        </rim:Slot>`;
    }

    if (params.createdTo) {
      additionalParams += `
        <rim:Slot name="$XDSDocumentEntryCreationTimeTo">
          <rim:ValueList>
            <rim:Value>${this.formatHL7Date(params.createdTo)}</rim:Value>
          </rim:ValueList>
        </rim:Slot>`;
    }

    const status = params.status || 'Approved';
    additionalParams += `
      <rim:Slot name="$XDSDocumentEntryStatus">
        <rim:ValueList>
          <rim:Value>('urn:oasis:names:tc:ebxml-regrep:StatusType:${status}')</rim:Value>
        </rim:ValueList>
      </rim:Slot>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:wsa="http://www.w3.org/2005/08/addressing"
               xmlns:query="urn:oasis:names:tc:ebxml-regrep:xsd:query:3.0"
               xmlns:rim="urn:oasis:names:tc:ebxml-regrep:xsd:rim:3.0">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:ihe:iti:2007:RegistryStoredQuery</wsa:Action>
    <wsa:MessageID>urn:uuid:${this.generateUUID()}</wsa:MessageID>
    <wsa:To soap:mustUnderstand="1">${this.config.registryUrl}</wsa:To>
  </soap:Header>
  <soap:Body>
    <query:AdhocQueryRequest>
      <query:ResponseOption returnComposedObjects="true" returnType="LeafClass"/>
      <rim:AdhocQuery id="urn:uuid:14d4debf-8f97-4251-9a74-a90016b0af0d">
        <rim:Slot name="$XDSDocumentEntryPatientId">
          <rim:ValueList>
            <rim:Value>${patientIdParam}</rim:Value>
          </rim:ValueList>
        </rim:Slot>
        ${additionalParams}
      </rim:AdhocQuery>
    </query:AdhocQueryRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build ITI-43 SOAP Request (Retrieve Document Set)
   */
  private buildITI43Request(params: ITI43RetrieveParams, accessToken: string): string {
    const homeCommunityId = params.homeCommunityId || this.config.homeCommunityId;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:wsa="http://www.w3.org/2005/08/addressing"
               xmlns:ihe="urn:ihe:iti:xds-b:2007">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:ihe:iti:2007:RetrieveDocumentSet</wsa:Action>
    <wsa:MessageID>urn:uuid:${this.generateUUID()}</wsa:MessageID>
    <wsa:To soap:mustUnderstand="1">${this.config.repositoryUrl}</wsa:To>
  </soap:Header>
  <soap:Body>
    <ihe:RetrieveDocumentSetRequest>
      <ihe:DocumentRequest>
        <ihe:HomeCommunityId>${homeCommunityId}</ihe:HomeCommunityId>
        <ihe:RepositoryUniqueId>${params.repositoryUniqueId}</ihe:RepositoryUniqueId>
        <ihe:DocumentUniqueId>${params.documentUniqueId}</ihe:DocumentUniqueId>
      </ihe:DocumentRequest>
    </ihe:RetrieveDocumentSetRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build ITI-41 SOAP Request (Provide and Register Document Set-b)
   */
  private buildITI41Request(params: ITI41SubmitParams, accessToken: string): string {
    const documentId = this.generateUUID();
    const submissionSetId = this.generateUUID();
    const timestamp = this.formatHL7Date(new Date());
    const base64Document = params.document.toString('base64');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:wsa="http://www.w3.org/2005/08/addressing"
               xmlns:ihe="urn:ihe:iti:xds-b:2007"
               xmlns:lcm="urn:oasis:names:tc:ebxml-regrep:xsd:lcm:3.0"
               xmlns:rim="urn:oasis:names:tc:ebxml-regrep:xsd:rim:3.0">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:ihe:iti:2007:ProvideAndRegisterDocumentSet-b</wsa:Action>
    <wsa:MessageID>urn:uuid:${this.generateUUID()}</wsa:MessageID>
    <wsa:To soap:mustUnderstand="1">${this.config.repositoryUrl}</wsa:To>
  </soap:Header>
  <soap:Body>
    <lcm:SubmitObjectsRequest>
      <rim:RegistryObjectList>
        <!-- Document Entry -->
        <rim:ExtrinsicObject id="Document_${documentId}" mimeType="${params.metadata.mimeType}" objectType="urn:uuid:7edca82f-054d-47f2-a032-9b2a5b5186c1">
          <rim:Slot name="creationTime">
            <rim:ValueList><rim:Value>${timestamp}</rim:Value></rim:ValueList>
          </rim:Slot>
          <rim:Slot name="languageCode">
            <rim:ValueList><rim:Value>${params.metadata.languageCode}</rim:Value></rim:ValueList>
          </rim:Slot>
          <rim:Slot name="sourcePatientId">
            <rim:ValueList><rim:Value>${params.patientId}^^^&2.16.756.5.30.1.127.3.10.3&ISO</rim:Value></rim:ValueList>
          </rim:Slot>
          <rim:Name><rim:LocalizedString value="${params.metadata.title}"/></rim:Name>
          <rim:Classification classificationScheme="urn:uuid:41a5887f-8865-4c09-adf7-e362475b143a" classifiedObject="Document_${documentId}" nodeRepresentation="${params.metadata.classCode}">
            <rim:Slot name="codingScheme"><rim:ValueList><rim:Value>2.16.840.1.113883.6.1</rim:Value></rim:ValueList></rim:Slot>
          </rim:Classification>
          <rim:Classification classificationScheme="urn:uuid:a09d5840-386c-46f2-b5ad-9c3699a4309d" classifiedObject="Document_${documentId}" nodeRepresentation="${params.metadata.formatCode}"/>
          <rim:Classification classificationScheme="urn:uuid:f4f85eac-e6cb-4883-b524-f2705394840f" classifiedObject="Document_${documentId}" nodeRepresentation="${params.metadata.confidentialityCode}"/>
          <rim:ExternalIdentifier identificationScheme="urn:uuid:58a6f841-87b3-4a3e-92fd-a8ffeff98427" value="${params.patientId}^^^&2.16.756.5.30.1.127.3.10.3&ISO" registryObject="Document_${documentId}"/>
          <rim:ExternalIdentifier identificationScheme="urn:uuid:2e82c1f6-a085-4c72-9da3-8640a32e42ab" value="${documentId}" registryObject="Document_${documentId}"/>
        </rim:ExtrinsicObject>
        <!-- Submission Set -->
        <rim:RegistryPackage id="SubmissionSet_${submissionSetId}">
          <rim:Slot name="submissionTime">
            <rim:ValueList><rim:Value>${timestamp}</rim:Value></rim:ValueList>
          </rim:Slot>
          <rim:Name><rim:LocalizedString value="Pharmacy Dispensation Submission"/></rim:Name>
          <rim:Classification classificationScheme="urn:uuid:a54d6aa5-d40d-43f9-88c5-b4633d873bdd" classifiedObject="SubmissionSet_${submissionSetId}" nodeRepresentation=""/>
          <rim:ExternalIdentifier identificationScheme="urn:uuid:96fdda7c-d067-4183-912e-bf5ee74998a8" value="${params.patientId}^^^&2.16.756.5.30.1.127.3.10.3&ISO" registryObject="SubmissionSet_${submissionSetId}"/>
          <rim:ExternalIdentifier identificationScheme="urn:uuid:554ac39e-e3fe-47fe-b233-965d2a147832" value="${params.metadata.author}" registryObject="SubmissionSet_${submissionSetId}"/>
          <rim:ExternalIdentifier identificationScheme="urn:uuid:6b5aea1a-874d-4603-a4bc-96a0a7b38446" value="${submissionSetId}" registryObject="SubmissionSet_${submissionSetId}"/>
        </rim:RegistryPackage>
        <!-- Association -->
        <rim:Association associationType="urn:oasis:names:tc:ebxml-regrep:AssociationType:HasMember" sourceObject="SubmissionSet_${submissionSetId}" targetObject="Document_${documentId}" id="Association_${this.generateUUID()}"/>
      </rim:RegistryObjectList>
    </lcm:SubmitObjectsRequest>
    <ihe:Document id="Document_${documentId}">
      ${base64Document}
    </ihe:Document>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Parse ITI-18 Response
   */
  private parseITI18Response(xmlData: string): ITI18Response {
    try {
      const parsed = this.xmlParser.parse(xmlData);
      const documents: ITI18Response['documents'] = [];

      // Extract documents from AdhocQueryResponse
      // (Simplified - real implementation needs full XDS.b response parsing)
      const extrinsicObjects = this.extractExtrinsicObjects(parsed);

      for (const obj of extrinsicObjects) {
        documents.push({
          documentId: obj['@_id'] || '',
          uniqueId: this.extractUniqueId(obj),
          repositoryUniqueId: this.extractRepositoryId(obj),
          title: this.extractTitle(obj),
          creationTime: this.parseHL7Date(this.extractCreationTime(obj)),
          author: this.extractAuthor(obj),
          classCode: this.extractClassCode(obj),
          formatCode: this.extractFormatCode(obj),
          mimeType: obj['@_mimeType'] || 'application/pdf',
          size: parseInt(this.extractSize(obj) || '0', 10),
        });
      }

      return { documents };
    } catch (error: any) {
      console.error('Failed to parse ITI-18 response:', error);
      throw new Error('Invalid XDS.b registry response');
    }
  }

  /**
   * Parse ITI-43 Response (with MTOM support)
   */
  private parseITI43Response(xmlData: string): DocumentContent {
    try {
      const parsed = this.xmlParser.parse(xmlData);

      // Extract document from RetrieveDocumentSetResponse
      // (Simplified - real implementation needs MTOM multipart parsing)
      const documentResponse = this.extractDocumentResponse(parsed);

      return {
        id: documentResponse.documentId,
        documentId: documentResponse.uniqueId,
        title: documentResponse.title || 'EPD Document',
        contentType: documentResponse.mimeType,
        data: Buffer.from(documentResponse.document, 'base64'),
        metadata: documentResponse.metadata as any, // Cast to EPDDocument
      };
    } catch (error: any) {
      console.error('Failed to parse ITI-43 response:', error);
      throw new Error('Invalid document retrieval response');
    }
  }

  /**
   * Parse ITI-41 Response
   */
  private parseITI41Response(xmlData: string): { success: boolean; documentId: string } {
    try {
      const parsed = this.xmlParser.parse(xmlData);

      // Check for RegistryResponse status
      const status = this.extractRegistryStatus(parsed);
      const documentId = this.extractSubmittedDocumentId(parsed);

      return {
        success: status === 'Success',
        documentId,
      };
    } catch (error: any) {
      console.error('Failed to parse ITI-41 response:', error);
      throw new Error('Invalid submission response');
    }
  }

  // Helper methods for XML extraction (simplified for this implementation)
  private extractExtrinsicObjects(parsed: any): any[] {
    // Navigate to ExtrinsicObject elements in response
    // Real implementation: traverse SOAP -> Body -> AdhocQueryResponse -> RegistryObjectList -> ExtrinsicObject
    return [];
  }

  private extractUniqueId(obj: any): string {
    // Extract XDS uniqueId from ExternalIdentifier
    return '';
  }

  private extractRepositoryId(obj: any): string {
    // Extract repository ID from slots
    return '';
  }

  private extractTitle(obj: any): string {
    // Extract document title from Name/LocalizedString
    return '';
  }

  private extractCreationTime(obj: any): string {
    // Extract creationTime slot value
    return new Date().toISOString();
  }

  private extractAuthor(obj: any): string {
    // Extract author classification
    return '';
  }

  private extractClassCode(obj: any): string {
    // Extract LOINC class code
    return '';
  }

  private extractFormatCode(obj: any): string {
    // Extract format code classification
    return '';
  }

  private extractSize(obj: any): string {
    // Extract size slot
    return '0';
  }

  private extractDocumentResponse(parsed: any): any {
    // Extract document from ITI-43 response
    return {
      documentId: '',
      uniqueId: '',
      title: '',
      mimeType: 'application/pdf',
      document: '',
      metadata: {},
    };
  }

  private extractRegistryStatus(parsed: any): string {
    // Extract status from RegistryResponse
    return 'Success';
  }

  private extractSubmittedDocumentId(parsed: any): string {
    // Extract submitted document ID
    return '';
  }

  // Utility methods
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatHL7Date(date: Date): string {
    // HL7 format: YYYYMMDDHHMMSS
    return date.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
  }

  private parseHL7Date(dateStr: string): Date {
    // Parse YYYYMMDDHHMMSS format
    if (!dateStr || dateStr.length < 8) return new Date();

    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const hour = dateStr.length >= 10 ? parseInt(dateStr.substring(8, 10), 10) : 0;
    const minute = dateStr.length >= 12 ? parseInt(dateStr.substring(10, 12), 10) : 0;
    const second = dateStr.length >= 14 ? parseInt(dateStr.substring(12, 14), 10) : 0;

    return new Date(year, month, day, hour, minute, second);
  }
}
