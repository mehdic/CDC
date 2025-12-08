/**
 * GDPR Controller Integration Tests
 * Tests API endpoints with security and rate limiting
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { GDPRController, AuthenticatedRequest } from '../controllers/gdpr.controller';
import { ExportService } from '../services/export.service';
import { PDFGeneratorService } from '../services/pdf-generator.service';

// Mock dependencies
jest.mock('../services/export.service');
jest.mock('../services/pdf-generator.service');

describe('GDPRController', () => {
  let controller: GDPRController;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockDataSource = {
      getRepository: jest.fn(() => ({
        save: jest.fn(),
      })),
    } as any;

    controller = new GDPRController(mockDataSource);

    mockRequest = {
      user: {
        id: 'patient-123',
        role: 'patient',
        email: 'patient@test.com',
      },
      body: {},
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
  });

  describe('POST /gdpr/export', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await controller.requestExport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    });

    it('should return 403 if user is not a patient', async () => {
      mockRequest.user!.role = 'pharmacist';

      await controller.requestExport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Only patients can request GDPR exports',
      });
    });

    it('should return 400 if invalid format provided', async () => {
      mockRequest.body = { format: 'xml' };

      await controller.requestExport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid format',
        message: 'Format must be either "json" or "pdf"',
      });
    });

    it('should return 429 if rate limit exceeded', async () => {
      mockRequest.body = { format: 'json' };

      // Mock rate limit check
      const mockExportService = ExportService as jest.MockedClass<typeof ExportService>;
      mockExportService.prototype.canRequestExport = jest.fn().mockResolvedValue({
        allowed: false,
        reason: 'Please wait 23 hours before requesting another export',
      });

      await controller.requestExport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Please wait 23 hours before requesting another export',
      });
    });

    it('should return JSON export successfully', async () => {
      mockRequest.body = { format: 'json' };

      const mockExportData = {
        exportMetadata: {
          exportId: 'export-123',
          exportDate: new Date().toISOString(),
          patientId: 'patient-123',
          format: 'json',
        },
        personalInformation: {
          userId: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'patient@test.com',
        },
      };

      // Mock rate limit check (allowed)
      const mockExportService = ExportService as jest.MockedClass<typeof ExportService>;
      mockExportService.prototype.canRequestExport = jest.fn().mockResolvedValue({
        allowed: true,
      });
      mockExportService.prototype.collectPatientData = jest
        .fn()
        .mockResolvedValue(mockExportData);

      await controller.requestExport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockExportData);
    });
  });

  describe('GET /gdpr/export/status', () => {
    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await controller.checkExportStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return can export status', async () => {
      const mockExportService = ExportService as jest.MockedClass<typeof ExportService>;
      mockExportService.prototype.canRequestExport = jest.fn().mockResolvedValue({
        allowed: true,
      });

      await controller.checkExportStatus(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        canExport: true,
        message: 'You can request an export',
      });
    });
  });
});
