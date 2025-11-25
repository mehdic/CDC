/**
 * Delivery API Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryApi } from '../../src/services/deliveryApi';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return mockAxios;
});

describe('DeliveryApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should store token on successful login', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            personnel: {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        },
      };

      const axios = require('axios');
      axios.post.mockResolvedValue(mockResponse);

      await deliveryApi.login('john@example.com', 'password');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@delivery_token', 'test-token');
    });

    it('should remove token on logout', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { success: true } });

      await deliveryApi.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@delivery_token');
    });
  });

  describe('Delivery Requests', () => {
    it('should fetch available requests with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            items: [
              { id: '1', status: 'pending' },
              { id: '2', status: 'assigned' },
            ],
          },
        },
      };

      const axios = require('axios');
      axios.get.mockResolvedValue(mockResponse);

      const result = await deliveryApi.getAvailableRequests({ radius: 10 });

      expect(axios.get).toHaveBeenCalledWith(
        '/delivery/requests/available',
        { params: { radius: 10 } }
      );
      expect(result.data?.items).toHaveLength(2);
    });

    it('should accept delivery', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: '1', status: 'accepted' },
        },
      };

      const axios = require('axios');
      axios.post.mockResolvedValue(mockResponse);

      const result = await deliveryApi.acceptDelivery('1');

      expect(axios.post).toHaveBeenCalledWith('/delivery/requests/1/accept');
      expect(result.data?.status).toBe('accepted');
    });
  });

  describe('GPS Tracking', () => {
    it('should update location', async () => {
      const location = {
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 10,
        timestamp: new Date().toISOString(),
      };

      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { success: true } });

      await deliveryApi.updateLocation(location);

      expect(axios.post).toHaveBeenCalledWith('/delivery/location', location);
    });
  });

  describe('QR Verification', () => {
    it('should verify package QR code', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            valid: true,
            deliveryId: 'del1',
            packageDetails: { id: 'pkg1' },
          },
        },
      };

      const axios = require('axios');
      axios.post.mockResolvedValue(mockResponse);

      const result = await deliveryApi.verifyPackageQR('QR123456');

      expect(axios.post).toHaveBeenCalledWith('/delivery/verify/qr', { qrCode: 'QR123456' });
      expect(result.data?.valid).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should fetch stats', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            completed: 10,
            earnings: 250.5,
            distance: 45.2,
            onTimeRate: 0.95,
          },
        },
      };

      const axios = require('axios');
      axios.get.mockResolvedValue(mockResponse);

      const result = await deliveryApi.getStats('today');

      expect(axios.get).toHaveBeenCalledWith('/delivery/stats', { params: { period: 'today' } });
      expect(result.data?.completed).toBe(10);
    });
  });
});
