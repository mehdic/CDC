/**
 * RefillStatus Component
 * Displays current status of active refill requests
 * Task: T2-108
 */

import React, { useState, useEffect } from 'react';
import './RefillStatus.css';

interface RefillRequest {
  id: string;
  prescriptionId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'filled';
  quantityRequested: number;
  approvedAt?: string;
  filledAt?: string;
  expiresAt: string;
  createdAt: string;
  decisionType?: string;
  denialReason?: string;
  pharmacistNotes?: string;
}

interface RefillStatusProps {
  refills?: RefillRequest[];
  isLoading?: boolean;
  onRefill?: (refillId: string) => void;
}

const getStatusColor = (status: RefillRequest['status']): string => {
  switch (status) {
    case 'pending':
      return 'status-pending';
    case 'approved':
      return 'status-approved';
    case 'denied':
      return 'status-denied';
    case 'expired':
      return 'status-expired';
    case 'filled':
      return 'status-filled';
    default:
      return 'status-default';
  }
};

const getStatusLabel = (status: RefillRequest['status']): string => {
  const labels = {
    pending: 'Pending Review',
    approved: 'Approved',
    denied: 'Denied',
    expired: 'Expired',
    filled: 'Filled',
  };
  return labels[status] || status;
};

const getStatusIcon = (status: RefillRequest['status']): string => {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'approved':
      return '✓';
    case 'denied':
      return '✗';
    case 'expired':
      return '⏰';
    case 'filled':
      return '📦';
    default:
      return '•';
  }
};

export const RefillStatus: React.FC<RefillStatusProps> = ({
  refills = [],
  isLoading = false,
  onRefill,
}) => {
  const [filteredRefills, setFilteredRefills] = useState<RefillRequest[]>(refills);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed'>(
    'all'
  );

  useEffect(() => {
    if (selectedTab === 'all') {
      setFilteredRefills(refills);
    } else if (selectedTab === 'pending') {
      setFilteredRefills(
        refills.filter(
          (r) =>
            r.status === 'pending' ||
            (r.status === 'approved' && !r.filledAt)
        )
      );
    } else {
      setFilteredRefills(
        refills.filter((r) => r.status === 'filled' || r.status === 'denied')
      );
    }
  }, [refills, selectedTab]);

  if (isLoading) {
    return (
      <div className="refill-status-container">
        <div className="refill-status-card">
          <h2>Refill Status</h2>
          <div className="loading">Loading refill requests...</div>
        </div>
      </div>
    );
  }

  if (refills.length === 0) {
    return (
      <div className="refill-status-container">
        <div className="refill-status-card">
          <h2>Refill Status</h2>
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>No active refill requests</p>
            <button
              className="btn btn-primary"
              onClick={() => onRefill?.('')}
            >
              Request a Refill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="refill-status-container">
      <div className="refill-status-card">
        <h2>Refill Status</h2>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${selectedTab === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTab('all')}
          >
            All ({refills.length})
          </button>
          <button
            className={`tab-button ${selectedTab === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedTab('pending')}
          >
            Pending (
            {refills.filter(
              (r) =>
                r.status === 'pending' ||
                (r.status === 'approved' && !r.filledAt)
            ).length}
            )
          </button>
          <button
            className={`tab-button ${
              selectedTab === 'completed' ? 'active' : ''
            }`}
            onClick={() => setSelectedTab('completed')}
          >
            Completed (
            {refills.filter(
              (r) => r.status === 'filled' || r.status === 'denied'
            ).length}
            )
          </button>
        </div>

        {/* Refill List */}
        <div className="refill-list">
          {filteredRefills.length === 0 ? (
            <div className="empty-state">
              <p>No {selectedTab} refill requests</p>
            </div>
          ) : (
            filteredRefills.map((refill) => (
              <div
                key={refill.id}
                className={`refill-item ${getStatusColor(refill.status)}`}
              >
                <div className="refill-header">
                  <div className="refill-status-badge">
                    <span className="status-icon">
                      {getStatusIcon(refill.status)}
                    </span>
                    <span className="status-label">
                      {getStatusLabel(refill.status)}
                    </span>
                  </div>
                  <span className="refill-date">
                    Requested: {new Date(refill.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="refill-details">
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{refill.quantityRequested}</span>
                  </div>

                  {refill.status === 'approved' && refill.approvedAt && (
                    <div className="detail-row">
                      <span className="label">Approved:</span>
                      <span className="value">
                        {new Date(refill.approvedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {refill.status === 'filled' && refill.filledAt && (
                    <div className="detail-row">
                      <span className="label">Filled:</span>
                      <span className="value">
                        {new Date(refill.filledAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {refill.status === 'denied' && refill.denialReason && (
                    <div className="detail-row alert-row">
                      <span className="label">Reason:</span>
                      <span className="value alert">{refill.denialReason}</span>
                    </div>
                  )}

                  {refill.pharmacistNotes && (
                    <div className="detail-row">
                      <span className="label">Notes:</span>
                      <span className="value">{refill.pharmacistNotes}</span>
                    </div>
                  )}
                </div>

                <div className="refill-footer">
                  <span className="expires-info">
                    Expires: {new Date(refill.expiresAt).toLocaleDateString()}
                  </span>

                  {refill.status === 'approved' && !refill.filledAt && (
                    <button className="btn btn-small btn-success">
                      Pickup Ready
                    </button>
                  )}

                  {refill.status === 'denied' && (
                    <button className="btn btn-small btn-secondary">
                      Request New
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RefillStatus;
