/**
 * RefillDetails Component
 * Detailed view of a refill request with patient and prescription information
 * Task: T2-105
 */

import React, { useState, useEffect } from 'react';
import './RefillDetails.css';

interface PatientInfo {
  id: string;
  name: string;
  dateOfBirth: string;
  allergies?: string[];
}

interface PrescriptionInfo {
  id: string;
  medications: Array<{
    drugName: string;
    dosage: string;
    quantity: number;
  }>;
  prescribedBy: string;
  prescribedDate: string;
}

interface RefillRequestDetail {
  id: string;
  prescriptionId: string;
  patientId: string;
  quantityRequested: number;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  eligibilityCheckResult?: {
    isEligible: boolean;
    remainingRefills: number;
    controlledSubstance: boolean;
  };
}

interface RefillDetailsProps {
  refillRequest: RefillRequestDetail;
  patient?: PatientInfo;
  prescription?: PrescriptionInfo;
  onApprove?: () => void;
  onDeny?: () => void;
  onFill?: () => void;
  isLoading?: boolean;
}

export const RefillDetails: React.FC<RefillDetailsProps> = ({
  refillRequest,
  patient,
  prescription,
  onApprove,
  onDeny,
  onFill,
  isLoading = false,
}) => {
  const [patientData, setPatientData] = useState<PatientInfo | undefined>(
    patient
  );
  const [prescriptionData, setPrescriptionData] = useState<
    PrescriptionInfo | undefined
  >(prescription);

  useEffect(() => {
    // Fetch patient details if not provided
    if (!patientData && refillRequest.patientId) {
      // Mock patient data
      setPatientData({
        id: refillRequest.patientId,
        name: 'John Doe',
        dateOfBirth: '1980-01-15',
        allergies: ['Penicillin', 'Sulfonamides'],
      });
    }
  }, [refillRequest.patientId, patientData]);

  useEffect(() => {
    // Fetch prescription details if not provided
    if (!prescriptionData && refillRequest.prescriptionId) {
      // Mock prescription data
      setPrescriptionData({
        id: refillRequest.prescriptionId,
        medications: [
          {
            drugName: 'Aspirin',
            dosage: '500mg',
            quantity: 30,
          },
        ],
        prescribedBy: 'Dr. Smith',
        prescribedDate: '2024-01-01',
      });
    }
  }, [refillRequest.prescriptionId, prescriptionData]);

  return (
    <div className="refill-details-container">
      <div className="refill-details-card">
        <div className="details-header">
          <h2>Refill Request Details</h2>
          <span className={`status-badge ${refillRequest.status}`}>
            {refillRequest.status.toUpperCase()}
          </span>
        </div>

        {/* Patient Information */}
        {patientData && (
          <div className="section patient-section">
            <h3>Patient Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name:</span>
                <span className="value">{patientData.name}</span>
              </div>
              <div className="info-item">
                <span className="label">ID:</span>
                <span className="value">{patientData.id}</span>
              </div>
              <div className="info-item">
                <span className="label">Date of Birth:</span>
                <span className="value">
                  {new Date(patientData.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            </div>

            {patientData.allergies && patientData.allergies.length > 0 && (
              <div className="allergies-alert">
                <span className="alert-icon">⚠️</span>
                <span className="alert-title">Known Allergies:</span>
                <div className="allergen-list">
                  {patientData.allergies.map((allergy, index) => (
                    <span key={index} className="allergen-badge">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prescription Information */}
        {prescriptionData && (
          <div className="section prescription-section">
            <h3>Prescription Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Prescription ID:</span>
                <span className="value">{prescriptionData.id}</span>
              </div>
              <div className="info-item">
                <span className="label">Prescribed By:</span>
                <span className="value">{prescriptionData.prescribedBy}</span>
              </div>
              <div className="info-item">
                <span className="label">Date Prescribed:</span>
                <span className="value">
                  {new Date(prescriptionData.prescribedDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="medications-section">
              <h4>Medications</h4>
              <div className="medications-list">
                {prescriptionData.medications.map((med, index) => (
                  <div key={index} className="medication-card">
                    <div className="med-name">{med.drugName}</div>
                    <div className="med-details">
                      <span className="med-dosage">{med.dosage}</span>
                      <span className="med-quantity">Qty: {med.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Refill Request Details */}
        <div className="section refill-request-section">
          <h3>Refill Request Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Request ID:</span>
              <span className="value">{refillRequest.id}</span>
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

        {/* Eligibility Check Results */}
        {refillRequest.eligibilityCheckResult && (
          <div className="section eligibility-section">
            <h3>Eligibility Check Results</h3>
            <div className={`eligibility-status ${refillRequest.eligibilityCheckResult.isEligible ? 'eligible' : 'ineligible'}`}>
              <span className="status-icon">
                {refillRequest.eligibilityCheckResult.isEligible ? '✓' : '✗'}
              </span>
              <span className="status-text">
                {refillRequest.eligibilityCheckResult.isEligible
                  ? 'Eligible for Refill'
                  : 'Not Eligible for Refill'}
              </span>
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
                  <span className="note">Stricter refill rules apply</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {refillRequest.status === 'pending' && (
          <div className="action-buttons">
            <button
              className="btn btn-success"
              onClick={onApprove}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Approve Refill'}
            </button>
            <button
              className="btn btn-danger"
              onClick={onDeny}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Deny Refill'}
            </button>
          </div>
        )}

        {refillRequest.status === 'approved' && (
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={onFill}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Mark as Filled'}
            </button>
          </div>
        )}

        {refillRequest.status === 'denied' && (
          <div className="alert alert-info">
            <span className="alert-icon">ℹ️</span>
            This refill request has been denied. Patient has been notified.
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillDetails;
