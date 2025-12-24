/**
 * AllergyList Component
 * Display patient allergies with severity indicators
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React from 'react';
import { useRecordsByType } from '../hooks/useMedicalRecords';
import { RecordType, AllergyData } from '../types';

export function AllergyList() {
  const { records, loading, error } = useRecordsByType(
    RecordType.ALLERGY,
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

  const getSeverityClass = (
    severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
  ): string => {
    switch (severity) {
      case 'mild':
        return 'severity-mild';
      case 'moderate':
        return 'severity-moderate';
      case 'severe':
        return 'severity-severe';
      case 'life-threatening':
        return 'severity-critical';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="allergy-list-loading">
        <div className="spinner" />
        <p>Loading allergies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allergy-list-error">
        <p>Error loading allergies</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="allergy-list">
      <div className="allergy-header">
        <h2>My Allergies</h2>
        {records.length > 0 && (
          <p className="allergy-count">{records.length} known allergies</p>
        )}
      </div>

      {records.length === 0 ? (
        <div className="allergy-empty">
          <p>No allergies recorded</p>
          <p className="empty-subtitle">
            This is good news! No known allergies on file.
          </p>
        </div>
      ) : (
        <div className="allergy-cards">
          {records.map((record) => {
            const data = record.data as unknown as AllergyData;
            return (
              <div
                key={record.id}
                className={`allergy-card ${data ? getSeverityClass(data.severity) : ''}`}
              >
                <div className="allergy-header-row">
                  <h3 className="allergy-title">{record.title}</h3>
                  {data && (
                    <span
                      className={`severity-badge ${getSeverityClass(data.severity)}`}
                    >
                      {data.severity.replace('-', ' ').toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="allergy-details">
                  {data && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Allergen:</span>
                        <span className="detail-value">{data.allergen}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">
                          {data.allergyType.charAt(0).toUpperCase() +
                            data.allergyType.slice(1)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Reaction:</span>
                        <span className="detail-value reaction-text">
                          {data.reaction}
                        </span>
                      </div>
                      {data.onsetDate && (
                        <div className="detail-row">
                          <span className="detail-label">Onset Date:</span>
                          <span className="detail-value">
                            {formatDate(data.onsetDate)}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Reported by:</span>
                        <span className="detail-value">{data.reportedBy}</span>
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
                  <div className="allergy-description">
                    <p>{record.description}</p>
                  </div>
                )}

                <div className="allergy-meta">
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

      {records.length > 0 && (
        <div className="allergy-warning">
          <p className="warning-text">
            ⚠️ Important: Always inform healthcare providers about your
            allergies before any treatment or medication.
          </p>
        </div>
      )}
    </div>
  );
}
