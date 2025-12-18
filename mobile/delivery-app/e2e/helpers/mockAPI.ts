/**
 * API Mocking Helpers for E2E Tests
 *
 * Provides utilities to mock backend API responses during E2E tests
 */

import { DeliveryRequest, DeliveryStatus, ApiResponse } from '../../src/types/delivery';
import { testDeliveries } from './testData';

/**
 * Mock API response wrapper
 */
export function mockApiResponse<T>(data: T, success: boolean = true): ApiResponse<T> {
  return {
    success,
    data: success ? data : undefined,
    error: success ? undefined : 'Mock error',
    message: success ? 'Success' : 'Failed'
  };
}

/**
 * Mock delivery requests endpoint
 */
export function mockGetDeliveryRequests(): ApiResponse<DeliveryRequest[]> {
  return mockApiResponse([
    testDeliveries.standardDelivery,
    testDeliveries.coldChainDelivery,
    testDeliveries.controlledSubstanceDelivery
  ]);
}

/**
 * Mock accept delivery endpoint
 */
export function mockAcceptDelivery(deliveryId: string): ApiResponse<DeliveryRequest> {
  const delivery = Object.values(testDeliveries).find(d => d.id === deliveryId);
  if (!delivery) {
    return mockApiResponse(null as any, false);
  }

  return mockApiResponse({
    ...delivery,
    status: 'accepted' as DeliveryStatus,
    acceptedAt: new Date().toISOString()
  });
}

/**
 * Mock update delivery status endpoint
 */
export function mockUpdateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus
): ApiResponse<DeliveryRequest> {
  const delivery = Object.values(testDeliveries).find(d => d.id === deliveryId);
  if (!delivery) {
    return mockApiResponse(null as any, false);
  }

  const updates: Partial<DeliveryRequest> = { status };

  if (status === 'delivered') {
    updates.deliveredAt = new Date().toISOString();
  }

  return mockApiResponse({
    ...delivery,
    ...updates
  } as DeliveryRequest);
}

/**
 * Mock submit proof of delivery endpoint
 */
export function mockSubmitProofOfDelivery(deliveryId: string): ApiResponse<{message: string}> {
  return mockApiResponse({ message: 'Proof of delivery submitted successfully' });
}

/**
 * Mock location update endpoint
 */
export function mockUpdateLocation(latitude: number, longitude: number): ApiResponse<{message: string}> {
  return mockApiResponse({ message: 'Location updated' });
}

/**
 * Setup API mocking interceptors for Detox
 * This would typically integrate with a mocking library like MSW or nock
 */
export function setupAPIMocks(device: any): void {
  // In a real implementation, this would set up request interceptors
  // For now, it's a placeholder for the pattern
  console.log('API mocks would be set up here');
}

/**
 * Mock endpoints configuration
 */
export const mockEndpoints = {
  getDeliveries: '/api/delivery/requests',
  acceptDelivery: '/api/delivery/:id/accept',
  updateStatus: '/api/delivery/:id/status',
  submitProof: '/api/delivery/:id/proof',
  updateLocation: '/api/delivery/location'
};
