/**
 * ShareRecordsModal Component
 * Modal for sharing medical records with healthcare providers
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useShareRecords } from '../hooks/useShareRecords';
import { useMedicalRecords } from '../hooks/useMedicalRecords';

interface ShareRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareRecordsModal({ isOpen, onClose }: ShareRecordsModalProps) {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [recipientId, setRecipientId] = useState<string>('');
  const [recipientType, setRecipientType] = useState<
    'doctor' | 'pharmacist' | 'nurse' | 'healthcare_provider'
  >('doctor');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [message, setMessage] = useState<string>('');
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const { records, loading } = useMedicalRecords({ activeOnly: true });
  const { share, sharing, error, shareResult, reset } = useShareRecords();

  const handleRecordToggle = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((r) => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRecords.size === 0 || !recipientId) {
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await share({
        recordIds: Array.from(selectedRecords),
        recipientId,
        recipientType,
        expiresAt: expiresAt.toISOString(),
        message: message || null,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRecords(new Set());
    setRecipientId('');
    setMessage('');
    setSelectAll(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  if (shareResult) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="share-success">
            <h2>✓ Records Shared Successfully</h2>
            <p>
              Your medical records have been shared with the healthcare
              provider.
            </p>
            <div className="share-details">
              <p>
                <strong>Access Token:</strong>{' '}
                <code>{shareResult.accessToken}</code>
              </p>
              <p>
                <strong>Expires:</strong>{' '}
                {shareResult.expiresAt
                  ? new Date(shareResult.expiresAt).toLocaleString()
                  : 'Never'}
              </p>
              <p>
                <strong>Records Shared:</strong> {shareResult.recordIds.length}
              </p>
            </div>
            <button type="button" onClick={handleClose} className="close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content share-modal">
        <div className="modal-header">
          <h2>Share Medical Records</h2>
          <button
            type="button"
            onClick={handleClose}
            className="close-icon-btn"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <div className="spinner" />
            <p>Loading records...</p>
          </div>
        ) : (
          <form onSubmit={handleShare} className="share-form">
            <div className="form-group">
              <label htmlFor="recipient-id">Recipient ID:</label>
              <input
                id="recipient-id"
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="Enter healthcare provider ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="recipient-type">Recipient Type:</label>
              <select
                id="recipient-type"
                value={recipientType}
                onChange={(e) =>
                  setRecipientType(
                    e.target.value as
                      | 'doctor'
                      | 'pharmacist'
                      | 'nurse'
                      | 'healthcare_provider'
                  )
                }
              >
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="nurse">Nurse</option>
                <option value="healthcare_provider">
                  Healthcare Provider
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expires-days">Access Expires In:</label>
              <select
                id="expires-days"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message (optional):</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for the healthcare provider"
                rows={3}
              />
            </div>

            <div className="form-group records-selection">
              <div className="selection-header">
                <label>Select Records to Share:</label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="select-all-btn"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="records-list">
                {records.length === 0 ? (
                  <p className="no-records">No records available to share</p>
                ) : (
                  records.map((record) => (
                    <label key={record.id} className="record-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => handleRecordToggle(record.id)}
                      />
                      <span className="record-info">
                        <span className="record-title">{record.title}</span>
                        <span className="record-type">
                          {record.recordType}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>

              <p className="selection-count">
                {selectedRecords.size} of {records.length} records selected
              </p>
            </div>

            {error && (
              <div className="share-error">
                <p>Error sharing records: {error.message}</p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                disabled={selectedRecords.size === 0 || !recipientId || sharing}
                className="share-btn"
              >
                {sharing ? 'Sharing...' : 'Share Records'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
