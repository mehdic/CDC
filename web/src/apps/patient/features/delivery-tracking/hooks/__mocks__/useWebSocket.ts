/**
 * Mock useWebSocket Hook
 * T8-042: Patient Delivery Tracking
 */

import type { UseWebSocketResult } from '../useWebSocket';

function mockUseWebSocket(): UseWebSocketResult {
  return {
    connected: true,
    error: null,
    isUsingPolling: false,
  };
}

export { mockUseWebSocket as useWebSocket };
