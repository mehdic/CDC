/**
 * PrescriptionHistory Component
 * Display list of patient prescriptions (current and past)
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useRecordsByType } from '../hooks/useMedicalRecords';
import { RecordType, PrescriptionData } from '../types';

export function PrescriptionHistory() {
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const { records, loading, error } = useRecordsByType(
    RecordType.PRESCRIPTION,
    activeOnly
  );

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="prescription-history-loading">
        <div className="spinner" />
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prescription-history-error">
        <p>Error loading prescriptions</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="prescription-history">
      <div className="prescription-header">
        <h2>Prescription History</h2>
        <div className="filter-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            <span>Show active only</span>
          </label>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="prescription-empty">
          <p>No prescriptions found</p>
        </div>
      ) : (
        <div className="prescription-list">
          {records.map((record) => {
            const data = record.data as unknown as PrescriptionData;
            return (
              <div
                key={record.id}
                className={`prescription-card ${!record.active ? 'inactive' : ''}`}
              >
                <div className="prescription-header-row">
                  <h3 className="prescription-title">{record.title}</h3>
                  <span
                    className={`prescription-status ${record.active ? 'active' : 'inactive'}`}
                  >
                    {record.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="prescription-details">
                  {data && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Medication:</span>
                        <span className="detail-value">{data.medication}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Dosage:</span>
                        <span className="detail-value">{data.dosage}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Frequency:</span>
                        <span className="detail-value">{data.frequency}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{data.duration}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Prescribed by:</span>
                        <span className="detail-value">
                          {data.prescribedBy}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">
                          {formatDate(data.startDate)}
                        </span>
                      </div>
                      {data.endDate && (
                        <div className="detail-row">
                          <span className="detail-label">End Date:</span>
                          <span className="detail-value">
                            {formatDate(data.endDate)}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Refills:</span>
                        <span className="detail-value">
                          {data.refillsRemaining} / {data.refillsAllowed}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="prescription-meta">
                  <span className="meta-item">
                    Recorded: {formatDate(record.recordedAt)}
                  </span>
                  <span className="meta-item">Source: {record.source}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
