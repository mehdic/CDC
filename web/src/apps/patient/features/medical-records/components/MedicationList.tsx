/**
 * MedicationList Component
 * Display current and past medications with dosage information
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useRecordsByType } from '../hooks/useMedicalRecords';
import { RecordType, MedicationData } from '../types';

export function MedicationList() {
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const { records, loading, error } = useRecordsByType(
    RecordType.MEDICATION,
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
      <div className="medication-list-loading">
        <div className="spinner" />
        <p>Loading medications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medication-list-error">
        <p>Error loading medications</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="medication-list">
      <div className="medication-header">
        <h2>My Medications</h2>
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
        <div className="medication-empty">
          <p>No medications found</p>
        </div>
      ) : (
        <div className="medication-grid">
          {records.map((record) => {
            const data = record.data as unknown as MedicationData;
            return (
              <div
                key={record.id}
                className={`medication-card ${!record.active ? 'inactive' : ''}`}
              >
                <div className="medication-header-row">
                  <h3 className="medication-name">{record.title}</h3>
                  <span
                    className={`medication-status ${record.active ? 'active' : 'inactive'}`}
                  >
                    {record.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="medication-details">
                  {data && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Medication:</span>
                        <span className="detail-value">{data.name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Dosage:</span>
                        <span className="detail-value dosage-highlight">
                          {data.dosage}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Frequency:</span>
                        <span className="detail-value">{data.frequency}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Route:</span>
                        <span className="detail-value">
                          {data.route.charAt(0).toUpperCase() +
                            data.route.slice(1)}
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
                        <span className="detail-label">Prescribed by:</span>
                        <span className="detail-value">
                          {data.prescribedBy}
                        </span>
                      </div>
                      {data.pharmacy && (
                        <div className="detail-row">
                          <span className="detail-label">Pharmacy:</span>
                          <span className="detail-value">{data.pharmacy}</span>
                        </div>
                      )}
                      {data.refillDate && (
                        <div className="detail-row">
                          <span className="detail-label">Next Refill:</span>
                          <span className="detail-value">
                            {formatDate(data.refillDate)}
                          </span>
                        </div>
                      )}
                      {data.sideEffects && (
                        <div className="detail-row side-effects">
                          <span className="detail-label">Side Effects:</span>
                          <span className="detail-value">
                            {data.sideEffects}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {record.description && (
                  <div className="medication-description">
                    <p>{record.description}</p>
                  </div>
                )}

                <div className="medication-meta">
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

      <div className="medication-summary">
        <p>
          {activeOnly ? 'Active' : 'All'} Medications: {records.length}
        </p>
      </div>
    </div>
  );
}
