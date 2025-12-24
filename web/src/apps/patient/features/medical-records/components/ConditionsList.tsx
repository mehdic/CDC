/**
 * ConditionsList Component
 * Display patient medical conditions
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useRecordsByType } from '../hooks/useMedicalRecords';
import { RecordType, ConditionData } from '../types';

export function ConditionsList() {
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const { records, loading, error } = useRecordsByType(
    RecordType.CONDITION,
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

  const getStatusClass = (
    status: 'active' | 'resolved' | 'chronic' | 'in_remission'
  ): string => {
    switch (status) {
      case 'active':
        return 'condition-status-active';
      case 'resolved':
        return 'condition-status-resolved';
      case 'chronic':
        return 'condition-status-chronic';
      case 'in_remission':
        return 'condition-status-remission';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="conditions-list-loading">
        <div className="spinner" />
        <p>Loading conditions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conditions-list-error">
        <p>Error loading conditions</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="conditions-list">
      <div className="conditions-header">
        <h2>My Medical Conditions</h2>
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
        <div className="conditions-empty">
          <p>No medical conditions recorded</p>
        </div>
      ) : (
        <div className="conditions-grid">
          {records.map((record) => {
            const data = record.data as unknown as ConditionData;
            return (
              <div key={record.id} className="condition-card">
                <div className="condition-header-row">
                  <h3 className="condition-title">{record.title}</h3>
                  {data && (
                    <span
                      className={`condition-status ${getStatusClass(data.status)}`}
                    >
                      {data.status.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="condition-details">
                  {data && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Condition:</span>
                        <span className="detail-value">{data.condition}</span>
                      </div>
                      {data.icd10Code && (
                        <div className="detail-row">
                          <span className="detail-label">ICD-10 Code:</span>
                          <span className="detail-value code">
                            {data.icd10Code}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Diagnosed:</span>
                        <span className="detail-value">
                          {formatDate(data.diagnosedDate)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Diagnosed by:</span>
                        <span className="detail-value">
                          {data.diagnosedBy}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Severity:</span>
                        <span
                          className={`detail-value severity-${data.severity}`}
                        >
                          {data.severity.charAt(0).toUpperCase() +
                            data.severity.slice(1)}
                        </span>
                      </div>
                      {data.treatment && (
                        <div className="detail-row treatment">
                          <span className="detail-label">Treatment:</span>
                          <span className="detail-value">
                            {data.treatment}
                          </span>
                        </div>
                      )}
                      {data.notes && (
                        <div className="detail-row notes">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">{data.notes}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {record.description && (
                  <div className="condition-description">
                    <p>{record.description}</p>
                  </div>
                )}

                <div className="condition-meta">
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

      <div className="conditions-summary">
        <p>
          {activeOnly ? 'Active' : 'All'} Conditions: {records.length}
        </p>
      </div>
    </div>
  );
}
