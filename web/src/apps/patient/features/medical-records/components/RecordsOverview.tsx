/**
 * RecordsOverview Component
 * Main dashboard overview showing record counts and quick stats
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React from 'react';
import { useRecordCounts } from '../hooks/useMedicalRecords';
import { RecordType } from '../types';

interface RecordCategoryCardProps {
  title: string;
  count: number;
  icon: string;
  recordType: RecordType;
  onClick: (recordType: RecordType) => void;
}

function RecordCategoryCard({
  title,
  count,
  icon,
  recordType,
  onClick,
}: RecordCategoryCardProps) {
  return (
    <div
      className="record-category-card"
      onClick={() => onClick(recordType)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(recordType);
        }
      }}
    >
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-count">{count}</p>
      </div>
    </div>
  );
}

interface RecordsOverviewProps {
  onCategoryClick: (recordType: RecordType) => void;
}

export function RecordsOverview({ onCategoryClick }: RecordsOverviewProps) {
  const { counts, loading, error } = useRecordCounts();

  if (loading) {
    return (
      <div className="records-overview-loading">
        <div className="spinner" />
        <p>Loading your medical records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="records-overview-error">
        <p>Error loading medical records</p>
        <p className="error-message">{error.message}</p>
      </div>
    );
  }

  if (!counts) {
    return (
      <div className="records-overview-empty">
        <p>No medical records found</p>
      </div>
    );
  }

  return (
    <div className="records-overview">
      <div className="overview-header">
        <h2>My Medical Records</h2>
        <p className="overview-subtitle">
          Total Records: <strong>{counts.total}</strong>
        </p>
      </div>

      <div className="record-categories-grid">
        <RecordCategoryCard
          title="Prescriptions"
          count={counts.prescription}
          icon="💊"
          recordType={RecordType.PRESCRIPTION}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Lab Results"
          count={counts.lab_result}
          icon="🔬"
          recordType={RecordType.LAB_RESULT}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Medications"
          count={counts.medication}
          icon="💉"
          recordType={RecordType.MEDICATION}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Allergies"
          count={counts.allergy}
          icon="⚠️"
          recordType={RecordType.ALLERGY}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Conditions"
          count={counts.condition}
          icon="🏥"
          recordType={RecordType.CONDITION}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Procedures"
          count={counts.procedure}
          icon="🔧"
          recordType={RecordType.PROCEDURE}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Immunizations"
          count={counts.immunization}
          icon="💉"
          recordType={RecordType.IMMUNIZATION}
          onClick={onCategoryClick}
        />
        <RecordCategoryCard
          title="Consultations"
          count={counts.consultation}
          icon="👨‍⚕️"
          recordType={RecordType.CONSULTATION}
          onClick={onCategoryClick}
        />
      </div>
    </div>
  );
}
