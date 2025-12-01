/**
 * RefillRequest Component
 * Patient component for requesting prescription refills
 * Task: T2-108
 */

import React, { useState } from 'react';
import './RefillRequest.css';

interface Medication {
  drugName: string;
  dosage: string;
  quantity: number;
}

interface Prescription {
  id: string;
  medications: Medication[];
  refillsAllowed: number;
  refillsUsed: number;
  issuedAt: string;
  expiresAt: string;
}

interface RefillRequestProps {
  prescription: Prescription;
  onSubmit?: (refillRequestData: any) => Promise<void>;
  isLoading?: boolean;
}

export const RefillRequest: React.FC<RefillRequestProps> = ({
  prescription,
  onSubmit,
  isLoading = false,
}) => {
  const [quantityRequested, setQuantityRequested] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const remainingRefills = prescription.refillsAllowed - prescription.refillsUsed;
  const isExpired = new Date(prescription.expiresAt) < new Date();
  const canRefill = remainingRefills > 0 && !isExpired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!canRefill) {
      setError('This prescription is not eligible for refill');
      return;
    }

    if (quantityRequested < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit({
          prescriptionId: prescription.id,
          quantityRequested,
        });
        setSuccess(true);
        setQuantityRequested(1);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit refill request');
    }
  };

  return (
    <div className="refill-request-container">
      <div className="refill-request-card">
        <h2>Request Refill</h2>

        {/* Medication Information */}
        <div className="medication-info">
          <h3>Medications</h3>
          <div className="medication-list">
            {prescription.medications.map((med, index) => (
              <div key={index} className="medication-item">
                <div className="med-name">{med.drugName}</div>
                <div className="med-dosage">{med.dosage}</div>
                <div className="med-quantity">Qty: {med.quantity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Refill Status */}
        <div className="refill-status">
          <div className="status-item">
            <span className="label">Refills Remaining:</span>
            <span className={`value ${remainingRefills === 0 ? 'error' : ''}`}>
              {remainingRefills}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Expires:</span>
            <span className={`value ${isExpired ? 'error' : ''}`}>
              {new Date(prescription.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            Refill request submitted successfully! You will be notified when
            approved.
          </div>
        )}

        {/* Refill Form */}
        {canRefill ? (
          <form onSubmit={handleSubmit} className="refill-form">
            <div className="form-group">
              <label htmlFor="quantity">Quantity to Refill:</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={remainingRefills}
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(parseInt(e.target.value))}
                disabled={isLoading}
                className="form-input"
              />
              <small>Max: {remainingRefills} refills available</small>
            </div>

            <button
              type="submit"
              disabled={isLoading || !canRefill}
              className="btn btn-primary btn-refill"
            >
              {isLoading ? 'Submitting...' : 'Request Refill'}
            </button>
          </form>
        ) : (
          <div className="alert alert-warning">
            <span className="alert-icon">ℹ️</span>
            {isExpired
              ? 'This prescription has expired. Please contact your doctor.'
              : 'No refills remaining. Please contact your doctor for a new prescription.'}
          </div>
        )}

        {/* Additional Information */}
        <div className="refill-info">
          <h4>How it works:</h4>
          <ol>
            <li>Request a refill using this form</li>
            <li>Your pharmacist will review your request</li>
            <li>You will receive a notification when approved or denied</li>
            <li>Pick up your refill at the pharmacy</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RefillRequest;
