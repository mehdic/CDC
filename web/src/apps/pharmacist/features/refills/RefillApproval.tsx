/**
 * RefillApproval Component
 * Pharmacist component for reviewing and approving/denying refill requests
 * Task: T2-105
 */

import React, { useState } from 'react';
import './RefillApproval.css';

interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  quantityRequested: number;
  status: 'pending' | 'approved' | 'denied';
  expiresAt: string;
  createdAt: string;
  eligibilityCheckResult?: {
    isEligible: boolean;
    remainingRefills: number;
    controlledSubstance: boolean;
    requiresManualApproval: boolean;
  };
}

interface RefillApprovalProps {
  refillRequest: RefillRequest;
  onApprove?: (refillId: string, notes: string) => Promise<void>;
  onDeny?: (refillId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RefillApproval: React.FC<RefillApprovalProps> = ({
  refillRequest,
  onApprove,
  onDeny,
  isLoading = false,
}) => {
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);
  const [notes, setNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isExpired = new Date(refillRequest.expiresAt) < new Date();
  const canApprove = !isExpired && refillRequest.status === 'pending';

  const handleApprove = async () => {
    setError(null);

    if (!notes.trim()) {
      setError('Please add notes before approving');
      return;
    }

    try {
      if (onApprove) {
        await onApprove(refillRequest.id, notes);
        setSuccess(true);
        setNotes('');
        setAction(null);

        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve refill');
    }
  };

  const handleDeny = async () => {
    setError(null);

    if (!denialReason.trim()) {
      setError('Please provide a denial reason');
      return;
    }

    try {
      if (onDeny) {
        await onDeny(refillRequest.id, denialReason);
        setSuccess(true);
        setDenialReason('');
        setAction(null);

        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deny refill');
    }
  };

  return (
    <div className="refill-approval-container">
      <div className="refill-approval-card">
        <h2>Refill Request Review</h2>

        {/* Request Information */}
        <div className="request-info">
          <div className="info-section">
            <h3>Request Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Request ID:</span>
                <span className="value">{refillRequest.id}</span>
              </div>
              <div className="info-item">
                <span className="label">Patient ID:</span>
                <span className="value">{refillRequest.patientId}</span>
              </div>
              <div className="info-item">
                <span className="label">Quantity Requested:</span>
                <span className="value">{refillRequest.quantityRequested}</span>
              </div>
              <div className="info-item">
                <span className="label">Submitted:</span>
                <span className="value">
                  {new Date(refillRequest.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Information */}
          {refillRequest.eligibilityCheckResult && (
            <div className="info-section">
              <h3>Eligibility Check</h3>
              <div className="eligibility-status">
                <div className={`status-badge ${refillRequest.eligibilityCheckResult.isEligible ? 'eligible' : 'ineligible'}`}>
                  {refillRequest.eligibilityCheckResult.isEligible
                    ? '✓ Eligible'
                    : '✗ Ineligible'}
                </div>
              </div>
              <div className="eligibility-details">
                <div className="detail-item">
                  <span className="label">Remaining Refills:</span>
                  <span className="value">
                    {refillRequest.eligibilityCheckResult.remainingRefills}
                  </span>
                </div>
                {refillRequest.eligibilityCheckResult.controlledSubstance && (
                  <div className="detail-item alert">
                    <span className="label">⚠️ Controlled Substance</span>
                  </div>
                )}
                {refillRequest.eligibilityCheckResult.requiresManualApproval && (
                  <div className="detail-item alert">
                    <span className="label">⚠️ Requires Manual Review</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            Refill request processed successfully!
          </div>
        )}

        {isExpired && (
          <div className="alert alert-warning">
            <span className="alert-icon">⏰</span>
            This refill request has expired and cannot be approved.
          </div>
        )}

        {/* Action Buttons */}
        {!success && refillRequest.status === 'pending' && !isExpired && (
          <div className="action-buttons">
            <button
              className="btn btn-success"
              onClick={() => setAction('approve')}
              disabled={isLoading || action !== null}
            >
              Approve
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setAction('deny')}
              disabled={isLoading || action !== null}
            >
              Deny
            </button>
          </div>
        )}

        {/* Approve Form */}
        {action === 'approve' && (
          <div className="action-form">
            <h3>Approve Refill Request</h3>
            <div className="form-group">
              <label htmlFor="approve-notes">Pharmacist Notes:</label>
              <textarea
                id="approve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes (e.g., consultation performed, drug interactions checked)"
                rows={4}
                disabled={isLoading}
                className="form-textarea"
              />
            </div>
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={isLoading || !notes.trim()}
              >
                {isLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAction(null);
                  setNotes('');
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Deny Form */}
        {action === 'deny' && (
          <div className="action-form">
            <h3>Deny Refill Request</h3>
            <div className="form-group">
              <label htmlFor="denial-reason">Denial Reason:</label>
              <select
                id="denial-reason"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                disabled={isLoading}
                className="form-select"
              >
                <option value="">Select a reason</option>
                <option value="too_early">Too early to refill</option>
                <option value="no_refills">No refills remaining</option>
                <option value="allergy_conflict">Drug allergy conflict</option>
                <option value="interaction">Drug interaction risk</option>
                <option value="controlled_substance">Controlled substance limitations</option>
                <option value="other">Other reason</option>
              </select>
              {denialReason === 'other' && (
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="Please specify the reason for denial"
                  rows={3}
                  disabled={isLoading}
                  className="form-textarea"
                />
              )}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-danger"
                onClick={handleDeny}
                disabled={isLoading || !denialReason.trim()}
              >
                {isLoading ? 'Processing...' : 'Confirm Denial'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAction(null);
                  setDenialReason('');
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillApproval;
