/**
 * Offline Sync Hook
 * Manages sync queue when connection is restored
 */

import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setOnlineStatus, removeFromSyncQueue } from '../store/deliverySlice';
import deliveryApi from '../services/deliveryApi';

/**
 * Offline Sync Hook
 */
export const useOfflineSync = () => {
  const dispatch = useAppDispatch();
  const { syncQueue, isOnline } = useAppSelector((state) => state.delivery);
  const processingRef = useRef(false);

  /**
   * Monitor Network Status
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      dispatch(setOnlineStatus(online ?? false));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  /**
   * Process Sync Queue when Online
   */
  useEffect(() => {
    const processSyncQueue = async () => {
      if (!isOnline || syncQueue.length === 0 || processingRef.current) {
        return;
      }

      processingRef.current = true;

      for (const item of syncQueue) {
        try {
          switch (item.type) {
            case 'status_update':
              await deliveryApi.updateDeliveryStatus(
                item.data.id,
                item.data.status,
                item.data.location,
                item.data.notes
              );
              break;

            case 'location_update':
              await deliveryApi.updateLocation(item.data);
              break;

            case 'proof_of_delivery':
              await deliveryApi.submitProofOfDelivery(
                item.data.deliveryId,
                item.data.proof
              );
              break;

            case 'acceptance':
              await deliveryApi.acceptDelivery(item.data.deliveryId);
              break;

            default:
              console.warn('Unknown sync item type:', item.type);
          }

          // Remove from queue on success
          dispatch(removeFromSyncQueue(item.id));
        } catch (error) {
          console.error('Sync error for item:', item.id, error);
          // Keep in queue for retry (will be processed next time)
        }
      }

      processingRef.current = false;
    };

    processSyncQueue();
  }, [isOnline, syncQueue, dispatch]);

  return {
    isOnline,
    syncQueueLength: syncQueue.length,
  };
};
