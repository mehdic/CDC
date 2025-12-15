/**
 * Unit Tests for Offline Indicator Components
 * Tests network status display, sync queue handling, and offline mode
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { useOfflineMode } from '../../hooks/useOfflineMode';
import {
  OfflineIndicator,
  SyncQueueStatus,
  PartialConnectivity,
  ConnectionRecoveryHelper,
} from '../OfflineIndicator';

// Mock hooks
jest.mock('../../hooks/useOfflineMode');

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUseOfflineMode = useOfflineMode as jest.MockedFunction<typeof useOfflineMode>;

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseOfflineMode.mockReturnValue({
      isOffline: false,
      queuedCount: 0,
      isProcessing: false,
      networkStatus: {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      },
      queue: [],
      forceSync: jest.fn(),
      clearQueue: jest.fn(),
      removeAction: jest.fn(),
      checkNetwork: jest.fn(),
    });
  });

  it('should not render when online and queue is empty', () => {
    const { queryByText } = render(<OfflineIndicator />);
    expect(queryByText('Offline Mode')).toBeNull();
    expect(queryByText('Back Online')).toBeNull();
  });

  it('should render when offline', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: true,
    });

    const { getByText } = render(<OfflineIndicator />);
    expect(getByText('Offline Mode')).toBeTruthy();
  });

  it('should render when online with pending sync', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: false,
      queuedCount: 3,
    });

    const { getByText } = render(<OfflineIndicator />);
    expect(getByText('Back Online')).toBeTruthy();
  });

  it('should show details when enabled', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: true,
      networkStatus: {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      },
      queuedCount: 1,
    });

    const { getByText } = render(<OfflineIndicator showDetails />);
    expect(getByText(/Connection: none/)).toBeTruthy();
    expect(getByText(/Pending: 1/)).toBeTruthy();
  });

  it('should show details button when offline with queue', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: true,
      queuedCount: 3,
    });

    const { getByText } = render(<OfflineIndicator />);

    fireEvent.press(getByText('Details'));
    expect(Alert.alert).toHaveBeenCalledWith('Sync Queue', '3 operations queued for sync');
  });

  it('should call onStatusChange when mounted', async () => {
    const onStatusChange = jest.fn();

    render(<OfflineIndicator onStatusChange={onStatusChange} />);

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(true);
    });
  });
});

describe('SyncQueueStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOfflineMode.mockReturnValue({
      isOffline: false,
      queuedCount: 0,
      isProcessing: false,
      networkStatus: null,
      queue: [],
      forceSync: jest.fn(),
      clearQueue: jest.fn(),
      removeAction: jest.fn(),
      checkNetwork: jest.fn(),
    });
  });

  it('should not render when queue is empty', () => {
    const { queryByText } = render(<SyncQueueStatus />);
    expect(queryByText(/Sync Queue/)).toBeNull();
  });

  it('should render queue items', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      queue: [
        {
          id: '1',
          type: 'status_update',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: '2',
          type: 'proof_submit',
          payload: {},
          timestamp: Date.now(),
          retryCount: 1,
        },
      ],
      queuedCount: 2,
    });

    const { getByText } = render(<SyncQueueStatus />);

    expect(getByText('Sync Queue (2 items)')).toBeTruthy();
    expect(getByText('Status Update')).toBeTruthy();
    expect(getByText('Proof of Delivery')).toBeTruthy();
    expect(getByText('Retry 1')).toBeTruthy();
  });

  it('should show processing status', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      queue: [
        {
          id: '1',
          type: 'status_update',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
        },
      ],
      queuedCount: 1,
      isProcessing: true,
    });

    const { getByText } = render(<SyncQueueStatus />);
    expect(getByText('Syncing...')).toBeTruthy();
  });
});

describe('PartialConnectivity Component', () => {
  it('should not render when signal is good', () => {
    const { queryByText } = render(<PartialConnectivity signalStrength={80} />);
    expect(queryByText('Weak Connection')).toBeNull();
  });

  it('should render when signal is weak', async () => {
    const { getByText } = render(<PartialConnectivity signalStrength={20} />);

    await waitFor(() => {
      expect(getByText('Weak Connection')).toBeTruthy();
    });
  });

  it('should show WiFi button when callback provided', async () => {
    const onWiFiSwitch = jest.fn();

    const { getByText } = render(
      <PartialConnectivity signalStrength={20} onWiFiSwitch={onWiFiSwitch} />
    );

    await waitFor(() => {
      expect(getByText('Use WiFi')).toBeTruthy();
    });

    fireEvent.press(getByText('Use WiFi'));
    expect(onWiFiSwitch).toHaveBeenCalled();
  });
});

describe('ConnectionRecoveryHelper Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseOfflineMode.mockReturnValue({
      isOffline: false,
      queuedCount: 0,
      isProcessing: false,
      networkStatus: null,
      queue: [],
      forceSync: jest.fn(),
      clearQueue: jest.fn(),
      removeAction: jest.fn(),
      checkNetwork: jest.fn(),
    });
  });

  it('should not render when online', () => {
    const { queryByText } = render(<ConnectionRecoveryHelper />);
    expect(queryByText('Offline Mode Active')).toBeNull();
  });

  it('should render when offline', () => {
    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: true,
    });

    const { getByText } = render(<ConnectionRecoveryHelper />);
    expect(getByText('Offline Mode Active')).toBeTruthy();
  });

  it('should call checkNetwork when button pressed', async () => {
    const checkNetwork = jest.fn();

    mockUseOfflineMode.mockReturnValue({
      ...mockUseOfflineMode(),
      isOffline: true,
      checkNetwork,
    });

    const { getByText } = render(<ConnectionRecoveryHelper />);

    fireEvent.press(getByText('Check Connection Status'));

    await waitFor(() => {
      expect(checkNetwork).toHaveBeenCalled();
    });
  });
});
