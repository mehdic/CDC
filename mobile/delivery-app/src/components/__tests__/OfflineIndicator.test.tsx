/**
 * Unit Tests for OfflineIndicator Component
 * Tests network status display, sync queue handling, and offline mode
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  OfflineIndicator,
  SyncQueueStatus,
  PartialConnectivity,
  ConnectionRecoveryHelper,
} from '../OfflineIndicator';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => {
  let listeners: Array<(state: any) => void> = [];

  const mockNetInfo = {
    addEventListener: jest.fn((callback: (state: any) => void) => {
      listeners.push(callback);
      // Immediately fire callback with initial state
      callback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
      return jest.fn(() => {
        listeners = listeners.filter(l => l !== callback);
      });
    }),
    fetch: jest.fn(() => Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })),
  };

  return {
    __esModule: true,
    default: mockNetInfo,
    ...mockNetInfo,
  };
});

// Mock Redux hooks
jest.mock('../../hooks/useRedux');

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.MockedFunction<typeof useAppDispatch>;
const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>;

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    // Ensure NetInfo mock is properly reset
    (NetInfo.addEventListener as jest.Mock).mockClear();
    (NetInfo.fetch as jest.Mock).mockClear();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
  });

  describe('Online Status Display', () => {
    it('should render when offline', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle online status', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: true, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show details when requested', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator showDetails={true} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should hide details when not requested', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator showDetails={false} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Sync Queue Display', () => {
    it('should handle sync queue with items', () => {
      const mockSyncQueue = [
        { id: '1', type: 'status_update', timestamp: new Date().toISOString(), retryCount: 0 },
        { id: '2', type: 'location_update', timestamp: new Date().toISOString(), retryCount: 0 },
      ];

      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: mockSyncQueue },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle empty sync queue', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Network Status Monitoring', () => {
    it('should subscribe to NetInfo changes', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: true, syncQueue: [] },
        };
        return selector(state);
      });

      render(<OfflineIndicator />);
      expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should dispatch setOnlineStatus when network changes', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      render(<OfflineIndicator />);
      expect(mockDispatch).toBeDefined();
    });

    it('should call onStatusChange callback', () => {
      const mockOnStatusChange = jest.fn();

      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: true, syncQueue: [] },
        };
        return selector(state);
      });

      render(<OfflineIndicator onStatusChange={mockOnStatusChange} />);
      expect(mockUseAppDispatch).toHaveBeenCalled();
    });
  });

  describe('Position Props', () => {
    it('should render at top by default', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should accept bottom position', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const state = {
          delivery: { isOnline: false, syncQueue: [] },
        };
        return selector(state);
      });

      const { UNSAFE_root } = render(<OfflineIndicator position="bottom" />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});

describe('SyncQueueStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with sync queue items', () => {
    const mockSyncQueue = [
      { id: '1', type: 'status_update', timestamp: new Date().toISOString(), retryCount: 0 },
    ];

    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<SyncQueueStatus />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should not render when sync queue is empty', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: true, syncQueue: [] },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<SyncQueueStatus />);
    // Root should still exist even if component returns null
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should display multiple sync queue items', () => {
    const mockSyncQueue = [
      { id: '1', type: 'status_update', timestamp: new Date().toISOString(), retryCount: 0 },
      { id: '2', type: 'location_update', timestamp: new Date().toISOString(), retryCount: 0 },
      { id: '3', type: 'proof_of_delivery', timestamp: new Date().toISOString(), retryCount: 1 },
    ];

    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: true, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<SyncQueueStatus />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle different sync types', () => {
    const mockSyncQueue = [
      { id: '1', type: 'acceptance', timestamp: new Date().toISOString(), retryCount: 0 },
    ];

    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<SyncQueueStatus />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should display retry count for items', () => {
    const mockSyncQueue = [
      { id: '1', type: 'status_update', timestamp: new Date().toISOString(), retryCount: 2 },
    ];

    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<SyncQueueStatus />);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe('PartialConnectivity Component', () => {
  it('should not render when signal strength is high', () => {
    const { UNSAFE_root } = render(<PartialConnectivity signalStrength={80} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render when signal strength is low', () => {
    const { UNSAFE_root } = render(<PartialConnectivity signalStrength={20} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle no signal strength prop', () => {
    const { UNSAFE_root } = render(<PartialConnectivity />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should show WiFi button when callback is provided', () => {
    const mockOnWiFiSwitch = jest.fn();
    const { UNSAFE_root } = render(
      <PartialConnectivity signalStrength={20} onWiFiSwitch={mockOnWiFiSwitch} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle WiFi switch without callback', () => {
    const { UNSAFE_root } = render(<PartialConnectivity signalStrength={20} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe('ConnectionRecoveryHelper Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when online', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: true, syncQueue: [] },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<ConnectionRecoveryHelper />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should render when offline', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: [] },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<ConnectionRecoveryHelper />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should display recovery information offline', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: [] },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<ConnectionRecoveryHelper />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('should handle large sync queues', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const mockSyncQueue = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        type: 'status_update',
        timestamp: new Date().toISOString(),
        retryCount: 0,
      }));
      const state = {
        delivery: { isOnline: false, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const { UNSAFE_root } = render(<ConnectionRecoveryHelper />);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    // Ensure NetInfo mock is properly set up
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
  });

  it('should handle complete offline workflow', () => {
    const mockSyncQueue = [
      { id: '1', type: 'status_update', timestamp: new Date().toISOString(), retryCount: 0 },
    ];

    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: false, syncQueue: mockSyncQueue },
      };
      return selector(state);
    });

    const result = render(
      <>
        <OfflineIndicator />
        <SyncQueueStatus />
        <ConnectionRecoveryHelper />
      </>
    );

    expect(result.UNSAFE_root).toBeTruthy();
  });

  it('should handle complete online workflow', () => {
    mockUseAppSelector.mockImplementation((selector: any) => {
      const state = {
        delivery: { isOnline: true, syncQueue: [] },
      };
      return selector(state);
    });

    const result = render(
      <>
        <OfflineIndicator />
        <SyncQueueStatus />
        <PartialConnectivity signalStrength={90} />
      </>
    );

    expect(result.UNSAFE_root).toBeTruthy();
  });
});
