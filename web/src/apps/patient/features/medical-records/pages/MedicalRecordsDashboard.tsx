/**
 * MedicalRecordsDashboard Page
 * Main dashboard for patient medical records
 * Task: T8-041 - Patient Medical Records Dashboard
 */

'use client';

import React, { useState } from 'react';
import { RecordsOverview } from '../components/RecordsOverview';
import { PrescriptionHistory } from '../components/PrescriptionHistory';
import { LabResults } from '../components/LabResults';
import { MedicationList } from '../components/MedicationList';
import { AllergyList } from '../components/AllergyList';
import { ConditionsList } from '../components/ConditionsList';
import { DocumentManager } from '../components/DocumentManager';
import { ShareRecordsModal } from '../components/ShareRecordsModal';
import { RecordType } from '../types';

type DashboardView =
  | 'overview'
  | 'prescriptions'
  | 'lab_results'
  | 'medications'
  | 'allergies'
  | 'conditions'
  | 'documents';

export function MedicalRecordsDashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const handleCategoryClick = (recordType: RecordType) => {
    switch (recordType) {
      case RecordType.PRESCRIPTION:
        setCurrentView('prescriptions');
        break;
      case RecordType.LAB_RESULT:
        setCurrentView('lab_results');
        break;
      case RecordType.MEDICATION:
        setCurrentView('medications');
        break;
      case RecordType.ALLERGY:
        setCurrentView('allergies');
        break;
      case RecordType.CONDITION:
        setCurrentView('conditions');
        break;
      default:
        setCurrentView('overview');
    }
  };

  const renderNavigation = () => (
    <nav className="dashboard-nav">
      <button
        type="button"
        onClick={() => setCurrentView('overview')}
        className={`nav-btn ${currentView === 'overview' ? 'active' : ''}`}
      >
        Overview
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('prescriptions')}
        className={`nav-btn ${currentView === 'prescriptions' ? 'active' : ''}`}
      >
        Prescriptions
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('lab_results')}
        className={`nav-btn ${currentView === 'lab_results' ? 'active' : ''}`}
      >
        Lab Results
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('medications')}
        className={`nav-btn ${currentView === 'medications' ? 'active' : ''}`}
      >
        Medications
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('allergies')}
        className={`nav-btn ${currentView === 'allergies' ? 'active' : ''}`}
      >
        Allergies
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('conditions')}
        className={`nav-btn ${currentView === 'conditions' ? 'active' : ''}`}
      >
        Conditions
      </button>
      <button
        type="button"
        onClick={() => setCurrentView('documents')}
        className={`nav-btn ${currentView === 'documents' ? 'active' : ''}`}
      >
        Documents
      </button>
    </nav>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <RecordsOverview onCategoryClick={handleCategoryClick} />;
      case 'prescriptions':
        return <PrescriptionHistory />;
      case 'lab_results':
        return <LabResults />;
      case 'medications':
        return <MedicationList />;
      case 'allergies':
        return <AllergyList />;
      case 'conditions':
        return <ConditionsList />;
      case 'documents':
        return <DocumentManager />;
      default:
        return <RecordsOverview onCategoryClick={handleCategoryClick} />;
    }
  };

  return (
    <div className="medical-records-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Medical Records Dashboard</h1>
          <p className="header-subtitle">
            View and manage your complete medical history
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="share-btn"
          >
            Share Records
          </button>
        </div>
      </header>

      {renderNavigation()}

      <main className="dashboard-content">{renderContent()}</main>

      <ShareRecordsModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <footer className="dashboard-footer">
        <p className="security-notice">
          🔒 Your medical records are encrypted and protected by HIPAA/GDPR
          compliance
        </p>
      </footer>
    </div>
  );
}
