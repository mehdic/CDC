/**
 * RefillHistory Component
 * Displays refill history and analytics for patient
 * Task: T2-109
 */

import React, { useEffect, useState } from 'react';
import './RefillHistory.css';

interface RefillHistoryEntry {
  id: string;
  prescriptionId: string;
  action: 'requested' | 'approved' | 'denied' | 'filled' | 'expired';
  quantity?: number;
  createdAt: string;
  details?: {
    reason?: string;
    notes?: string;
  };
}

interface RefillHistoryProps {
  prescriptionId: string;
  onLoad?: (entries: RefillHistoryEntry[]) => void;
  isLoading?: boolean;
}

const getActionBadgeClass = (
  action: RefillHistoryEntry['action']
): string => {
  switch (action) {
    case 'requested':
      return 'badge-pending';
    case 'approved':
      return 'badge-success';
    case 'denied':
      return 'badge-danger';
    case 'filled':
      return 'badge-filled';
    case 'expired':
      return 'badge-warning';
    default:
      return 'badge-default';
  }
};

const getActionLabel = (action: RefillHistoryEntry['action']): string => {
  const labels = {
    requested: 'Requested',
    approved: 'Approved',
    denied: 'Denied',
    filled: 'Filled',
    expired: 'Expired',
  };
  return labels[action] || action;
};

const getActionIcon = (action: RefillHistoryEntry['action']): string => {
  switch (action) {
    case 'requested':
      return '📝';
    case 'approved':
      return '✓';
    case 'denied':
      return '✗';
    case 'filled':
      return '📦';
    case 'expired':
      return '⏰';
    default:
      return '•';
  }
};

export const RefillHistory: React.FC<RefillHistoryProps> = ({
  prescriptionId,
  onLoad,
  isLoading = false,
}) => {
  const [history, setHistory] = useState<RefillHistoryEntry[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Mock data - in real implementation, this would fetch from API
        const mockHistory: RefillHistoryEntry[] = [
          {
            id: '1',
            prescriptionId,
            action: 'filled',
            quantity: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            prescriptionId,
            action: 'approved',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            prescriptionId,
            action: 'requested',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];

        setHistory(mockHistory);
        if (onLoad) {
          onLoad(mockHistory);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load refill history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [prescriptionId, onLoad]);

  if (loading) {
    return (
      <div className="refill-history-container">
        <div className="refill-history-card">
          <h2>Refill History</h2>
          <div className="loading">Loading refill history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="refill-history-container">
        <div className="refill-history-card">
          <h2>Refill History</h2>
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="refill-history-container">
        <div className="refill-history-card">
          <h2>Refill History</h2>
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>No refill history yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="refill-history-container">
      <div className="refill-history-card">
        <h2>Refill History</h2>

        <div className="history-timeline">
          {history.map((entry, index) => (
            <div key={entry.id} className="timeline-item">
              <div className="timeline-marker">
                <div className={`marker-dot ${getActionBadgeClass(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                {index < history.length - 1 && <div className="marker-line" />}
              </div>

              <div className="timeline-content">
                <div className="content-header">
                  <span
                    className={`badge ${getActionBadgeClass(entry.action)}`}
                  >
                    {getActionLabel(entry.action)}
                  </span>
                  <span className="content-date">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {entry.quantity && (
                  <div className="content-quantity">
                    Quantity: {entry.quantity}
                  </div>
                )}

                {entry.details?.reason && (
                  <div className="content-reason">
                    <span className="label">Reason:</span> {entry.details.reason}
                  </div>
                )}

                {entry.details?.notes && (
                  <div className="content-notes">
                    <span className="label">Notes:</span> {entry.details.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="refill-stats">
          <h3>Refill Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Refills</span>
              <span className="stat-value">
                {history.filter((h) => h.action === 'filled').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Approved</span>
              <span className="stat-value">
                {history.filter((h) => h.action === 'approved').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Denied</span>
              <span className="stat-value">
                {history.filter((h) => h.action === 'denied').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefillHistory;
