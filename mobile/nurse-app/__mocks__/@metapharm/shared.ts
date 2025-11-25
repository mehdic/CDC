/**
 * Mock for @metapharm/shared module
 */

export const getAuthToken = jest.fn().mockResolvedValue('mock-token');
export const setAuthToken = jest.fn().mockResolvedValue(undefined);
export const getRefreshToken = jest.fn().mockResolvedValue('mock-refresh-token');
export const setRefreshToken = jest.fn().mockResolvedValue(undefined);
export const clearAuthTokens = jest.fn().mockResolvedValue(undefined);
export const getSecureItem = jest.fn().mockResolvedValue(null);
export const setSecureItem = jest.fn().mockResolvedValue(undefined);
export const removeSecureItem = jest.fn().mockResolvedValue(undefined);
