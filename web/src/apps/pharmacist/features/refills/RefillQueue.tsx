/**
 * RefillQueue Component
 * Pharmacist view of pending refill requests queue
 * Task: T2-104
 */

import React, { useState, useEffect } from 'react';
import './RefillQueue.css';

interface RefillRequestInQueue {
  id: string;
  prescriptionId: string;
  patientId: string;
  quantityRequested: number;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  controlledSubstance: boolean;
  requiresManualApproval: boolean;
}

interface RefillQueueProps {
  pharmacyId: string;
  onSelectRefill?: (refillId: string) => void;
  isLoading?: boolean;
}

export const RefillQueue: React.FC<RefillQueueProps> = ({
  pharmacyId,
  onSelectRefill,
  isLoading = false,
}) => {
  const [queue, setQueue] = useState<RefillRequestInQueue[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [selectedRefill, setSelectedRefill] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('priority');

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError(null);

      try {
        // Mock data - in real implementation, fetch from API
        const mockQueue: RefillRequestInQueue[] = [
          {
            id: '1',
            prescriptionId: 'rx-001',
            patientId: 'patient-001',
            quantityRequested: 1,
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            controlledSubstance: true,
            requiresManualApproval: true,
          },
          {
            id: '2',
            prescriptionId: 'rx-002',
            patientId: 'patient-002',
            quantityRequested: 2,
            status: 'pending',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            controlledSubstance: false,
            requiresManualApproval: false,
          },
          {
            id: '3',
            prescriptionId: 'rx-003',
            patientId: 'patient-003',
            quantityRequested: 1,
            status: 'pending',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            controlledSubstance: false,
            requiresManualApproval: true,
          },
        ];

        setQueue(mockQueue);
      } catch (err: any) {
        setError(err.message || 'Failed to load refill queue');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [pharmacyId]);

  const getSortedQueue = () => {
    const sorted = [...queue];

    if (sortBy === 'priority') {
      // Controlled substances first, then by date
      return sorted.sort((a, b) => {
        if (a.controlledSubstance !== b.controlledSubstance) {
          return a.controlledSubstance ? -1 : 1;
        }
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    } else {
      // Sort by oldest first
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  };

  const sortedQueue = getSortedQueue();
  const pendingCount = queue.filter((r) => r.status === 'pending').length;

  const handleSelectRefill = (refillId: string) => {
    setSelectedRefill(refillId);
    if (onSelectRefill) {
      onSelectRefill(refillId);
    }
  };

  if (loading) {
    return (
      <div className="refill-queue-container">
        <div className="refill-queue-card">
          <h2>Refill Request Queue</h2>
          <div className="loading">Loading refill queue...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="refill-queue-container">
      <div className="refill-queue-card">
        <div className="queue-header">
          <h2>Refill Request Queue</h2>
          <div className="queue-stats">
            <div className="stat">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">{queue.length}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Sort Controls */}
        <div className="queue-controls">
          <label htmlFor="sort-select">Sort By:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
            className="sort-select"
          >
            <option value="priority">Priority (Controlled Substances First)</option>
            <option value="date">Date (Oldest First)</option>
          </select>
        </div>

        {/* Queue List */}
        {pendingCount === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <p>All refill requests processed!</p>
          </div>
        ) : (
          <div className="queue-list">
            {sortedQueue
              .filter((r) => r.status === 'pending')
              .map((refill) => (
                <div
                  key={refill.id}
                  className={`queue-item ${
                    selectedRefill === refill.id ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectRefill(refill.id)}
                >
                  <div className="queue-item-header">
                    <div className="priority-indicator">
                      {refill.controlledSubstance && (
                        <span className="priority-badge priority-high" title="Controlled Substance">
                          ⚠️
                        </span>
                      )}
                      {refill.requiresManualApproval && (
                        <span
                          className="priority-badge priority-medium"
                          title="Manual Review Required"
                        >
                          ⚙️
                        </span>
                      )}
                    </div>
                    <span className="queue-item-id">{refill.id}</span>
                    <span className="queue-item-time">
                      {new Date(refill.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="queue-item-body">
                    <div className="queue-item-row">
                      <span className="label">Patient:</span>
                      <span className="value">{refill.patientId}</span>
                    </div>
                    <div className="queue-item-row">
                      <span className="label">Prescription:</span>
                      <span className="value">{refill.prescriptionId}</span>
                    </div>
                    <div className="queue-item-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{refill.quantityRequested}</span>
                    </div>
                  </div>

                  <div className="queue-item-tags">
                    {refill.controlledSubstance && (
                      <span className="tag tag-danger">Controlled</span>
                    )}
                    {refill.requiresManualApproval && (
                      <span className="tag tag-warning">Manual Review</span>
                    )}
                    <span className="tag tag-primary">Pending</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillQueue;
