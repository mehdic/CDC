/**
 * LabResults Component
 * Display lab results with date filtering
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { useRecordsByType } from '../hooks/useMedicalRecords';
import { RecordType, LabResultData } from '../types';

export function LabResults() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { records, loading, error } = useRecordsByType(
    RecordType.LAB_RESULT,
    true
  );

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (
    status: 'normal' | 'abnormal' | 'critical'
  ): string => {
    switch (status) {
      case 'normal':
        return 'status-normal';
      case 'abnormal':
        return 'status-abnormal';
      case 'critical':
        return 'status-critical';
      default:
        return '';
    }
  };

  const filteredRecords = records.filter((record) => {
    if (!record.recordedAt) return true;
    const recordDate = new Date(record.recordedAt);

    if (startDate && recordDate < new Date(startDate)) {
      return false;
    }
    if (endDate && recordDate > new Date(endDate)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="lab-results-loading">
        <div className="spinner" />
        <p>Loading lab results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lab-results-error">
        <p>Error loading lab results</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="lab-results">
      <div className="lab-results-header">
        <h2>Lab Results</h2>
        <div className="date-filters">
          <div className="filter-group">
            <label htmlFor="start-date">From:</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="end-date">To:</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="lab-results-empty">
          <p>No lab results found</p>
        </div>
      ) : (
        <div className="lab-results-list">
          {filteredRecords.map((record) => {
            const data = record.data as unknown as LabResultData;
            return (
              <div key={record.id} className="lab-result-card">
                <div className="lab-result-header-row">
                  <h3 className="lab-result-title">{record.title}</h3>
                  {data && (
                    <span
                      className={`lab-result-status ${getStatusColor(data.status)}`}
                    >
                      {data.status.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="lab-result-details">
                  {data && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Test Name:</span>
                        <span className="detail-value">{data.testName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Test Code:</span>
                        <span className="detail-value">{data.testCode}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Result:</span>
                        <span className="detail-value result-highlight">
                          {data.result} {data.unit}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Reference Range:</span>
                        <span className="detail-value">
                          {data.referenceRange}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Ordered by:</span>
                        <span className="detail-value">{data.orderedBy}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Performed at:</span>
                        <span className="detail-value">
                          {formatDate(data.performedAt)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Laboratory:</span>
                        <span className="detail-value">{data.laboratory}</span>
                      </div>
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
                  <div className="lab-result-description">
                    <p>{record.description}</p>
                  </div>
                )}

                <div className="lab-result-meta">
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

      <div className="results-summary">
        <p>
          Showing {filteredRecords.length} of {records.length} lab results
        </p>
      </div>
    </div>
  );
}
