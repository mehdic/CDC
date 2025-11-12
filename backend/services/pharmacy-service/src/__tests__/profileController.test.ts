import { Request, Response } from 'express';
import {
  getPharmacyProfile,
  updatePharmacyProfile,
  publishPharmacyProfile,
  unpublishPharmacyProfile,
} from '../controllers/profileController';

// Mock AppDataSource
jest.mock('../index', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Profile Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRepository: any;

  beforeEach(() => {
    mockRequest = {
      params: { pharmacyId: 'pharmacy-123' },
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const { AppDataSource } = require('../index');
    AppDataSource.getRepository.mockReturnValue(mockRepository);
  });

  describe('getPharmacyProfile', () => {
    it('should return existing pharmacy profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        pharmacyId: 'pharmacy-123',
        name: 'Test Pharmacy',
        published: false,
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);

      await getPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        pharmacy: mockProfile,
      });
    });

    it('should create default profile if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ pharmacyId: 'pharmacy-123' });
      mockRepository.save.mockResolvedValue({ pharmacyId: 'pharmacy-123' });

      await getPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if pharmacy ID is missing', async () => {
      mockRequest.params = {};

      await getPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pharmacy ID required',
      });
    });
  });

  describe('updatePharmacyProfile', () => {
    it('should update existing profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        pharmacyId: 'pharmacy-123',
        name: 'Old Name',
      };

      mockRequest.body = {
        name: 'New Name',
        description: 'New description',
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue({ ...mockProfile, name: 'New Name' });

      await updatePharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        pharmacy: expect.objectContaining({ name: 'New Name' }),
      });
    });

    it('should create profile if not exists', async () => {
      mockRequest.body = { name: 'New Pharmacy' };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ pharmacyId: 'pharmacy-123' });
      mockRepository.save.mockResolvedValue({ pharmacyId: 'pharmacy-123', name: 'New Pharmacy' });

      await updatePharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('publishPharmacyProfile', () => {
    it('should publish pharmacy profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        pharmacyId: 'pharmacy-123',
        published: false,
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue({ ...mockProfile, published: true });

      await publishPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        pharmacy: expect.objectContaining({ published: true }),
      });
    });

    it('should return 404 if profile not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await publishPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Pharmacy profile not found',
      });
    });
  });

  describe('unpublishPharmacyProfile', () => {
    it('should unpublish pharmacy profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        pharmacyId: 'pharmacy-123',
        published: true,
      };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue({ ...mockProfile, published: false });

      await unpublishPharmacyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        pharmacy: expect.objectContaining({ published: false }),
      });
    });
  });
});
