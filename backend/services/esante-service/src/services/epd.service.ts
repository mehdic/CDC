/**
 * EPD Service
 * Electronic Patient Dossier integration
 * Swiss federal e-health system for medical records access
 */

import {
  EPDDocument,
  EPDDocumentType,
  DocumentFilters,
  DocumentContent,
  DocumentUploadRequest,
  ConfidentialityLevel,
  ICantonalAdapter,
} from '../types/esante.types';

export class EPDService {
  private adapters: Map<string, ICantonalAdapter> = new Map();
  private documentCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

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
   * List EPD documents for a patient
   */
  async listDocuments(
    patientId: string,
    canton: string,
    accessToken: string,
    filters?: DocumentFilters
  ): Promise<EPDDocument[]> {
    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    const cacheKey = this.generateCacheKey('list', patientId, canton);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as EPDDocument[];
    }

    try {
      const documents = await adapter.listDocuments(patientId, accessToken, filters);
      this.addToCache(cacheKey, documents);
      return documents;
    } catch (error) {
      console.error(`Error listing documents from ${canton}:`, error);
      throw new Error(`Failed to list EPD documents: ${error}`);
    }
  }

  /**
   * Get a specific EPD document
   */
  async getDocument(
    documentId: string,
    canton: string,
    accessToken: string
  ): Promise<DocumentContent> {
    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    const cacheKey = this.generateCacheKey('document', documentId, canton);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as DocumentContent;
    }

    try {
      const content = await adapter.getDocument(documentId, accessToken);
      this.addToCache(cacheKey, content);
      return content;
    } catch (error) {
      console.error(`Error retrieving document from ${canton}:`, error);
      throw new Error(`Failed to retrieve EPD document: ${error}`);
    }
  }

  /**
   * Upload a document to EPD
   */
  async uploadDocument(
    patientId: string,
    canton: string,
    document: DocumentUploadRequest,
    accessToken: string
  ): Promise<EPDDocument> {
    const adapter = this.getAdapter(canton);
    if (!adapter) {
      throw new Error(`No adapter available for canton: ${canton}`);
    }

    // Validate document before upload
    this.validateDocument(document);

    try {
      const uploadedDoc = await adapter.uploadDocument(patientId, document, accessToken);
      // Invalidate cache for this patient
      this.invalidatePatientCache(patientId, canton);
      return uploadedDoc;
    } catch (error) {
      console.error(`Error uploading document to ${canton}:`, error);
      throw new Error(`Failed to upload EPD document: ${error}`);
    }
  }

  /**
   * Validate document before upload
   */
  private validateDocument(document: DocumentUploadRequest): void {
    if (!document.title || document.title.length === 0) {
      throw new Error('Document title is required');
    }

    if (!document.documentType || !Object.values(EPDDocumentType).includes(document.documentType)) {
      throw new Error('Invalid document type');
    }

    if (!document.formatCode || document.formatCode.length === 0) {
      throw new Error('Format code is required');
    }

    if (!document.contentType || document.contentType.length === 0) {
      throw new Error('Content type is required');
    }

    if (!document.data || document.data.length === 0) {
      throw new Error('Document content is required');
    }

    if (document.data.length > 50 * 1024 * 1024) {
      // 50MB limit
      throw new Error('Document size exceeds maximum allowed (50MB)');
    }
  }

  /**
   * Search documents by type
   */
  async searchByType(
    patientId: string,
    canton: string,
    documentType: EPDDocumentType,
    accessToken: string
  ): Promise<EPDDocument[]> {
    const filters: DocumentFilters = {
      documentTypes: [documentType],
    };

    return this.listDocuments(patientId, canton, accessToken, filters);
  }

  /**
   * Search documents by creation date range
   */
  async searchByDateRange(
    patientId: string,
    canton: string,
    from: Date,
    to: Date,
    accessToken: string
  ): Promise<EPDDocument[]> {
    const filters: DocumentFilters = {
      createdSince: from,
      createdUntil: to,
    };

    return this.listDocuments(patientId, canton, accessToken, filters);
  }

  /**
   * Get documents requiring prescription
   */
  async getPrescriptionDocuments(
    patientId: string,
    canton: string,
    accessToken: string
  ): Promise<EPDDocument[]> {
    return this.searchByType(patientId, canton, EPDDocumentType.PRESCRIPTION, accessToken);
  }

  /**
   * Get medication list
   */
  async getMedicationList(
    patientId: string,
    canton: string,
    accessToken: string
  ): Promise<EPDDocument[]> {
    return this.searchByType(patientId, canton, EPDDocumentType.MEDICATION_LIST, accessToken);
  }

  /**
   * Get allergy information
   */
  async getAllergies(
    patientId: string,
    canton: string,
    accessToken: string
  ): Promise<EPDDocument[]> {
    return this.searchByType(patientId, canton, EPDDocumentType.ALLERGY_LIST, accessToken);
  }

  /**
   * Get restricted confidentiality documents
   */
  async getRestrictedDocuments(
    patientId: string,
    canton: string,
    accessToken: string
  ): Promise<EPDDocument[]> {
    const filters: DocumentFilters = {
      confidentialityLevel: ConfidentialityLevel.RESTRICTED,
    };

    return this.listDocuments(patientId, canton, accessToken, filters);
  }

  /**
   * Cache management
   */
  private generateCacheKey(type: string, id1: string, id2: string): string {
    return `${type}:${id1}:${id2}`;
  }

  private addToCache(key: string, value: any): void {
    this.documentCache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  private getFromCache(key: string): any {
    const cached = this.documentCache.get(key) as any;
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiryMs) {
      this.documentCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private invalidatePatientCache(patientId: string, canton: string): void {
    const keysToDelete: string[] = [];

    this.documentCache.forEach((_, key) => {
      if (key.includes(patientId) && key.includes(canton)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.documentCache.delete(key);
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.documentCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.documentCache.size,
      keys: Array.from(this.documentCache.keys()),
    };
  }
}
