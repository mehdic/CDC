/**
 * Doctor Adherence Dashboard
 * Displays patient adherence metrics and highlights patients needing intervention
 */

import React, { useState, useEffect } from 'react';

// Types
interface AdherenceMetrics {
  patientId: string;
  medicationId: string;
  medicationName: string;
  pdc: number;
  mpr: number;
  gapDays: number;
  adherenceCategory: 'optimal' | 'moderate' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
  lastDispensationDate?: Date;
  nextExpectedRefillDate?: Date;
}

interface PatientAdherenceSummary {
  patientId: string;
  patientName: string;
  poorAdherenceMedications: AdherenceMetrics[];
  alertCount: number;
}

interface AdherenceAlert {
  id: string;
  patientId: string;
  type: 'missed_refill' | 'gap_detected' | 'early_refill' | 'stockout_risk';
  severity: 'info' | 'warning' | 'critical';
  medicationName: string;
  daysOverdue?: number;
  recommendedAction: string;
  createdAt: Date;
  resolved: boolean;
}

// Mock API service (would be real API calls in production)
const adherenceAPI = {
  getPatientsWithPoorAdherence: async (patientIds: string[]): Promise<PatientAdherenceSummary[]> => {
    // Mock implementation
    return [];
  },
  getPatientAlerts: async (patientId: string): Promise<AdherenceAlert[]> => {
    // Mock implementation
    return [];
  },
  sendReminder: async (patientId: string, medicationId: string): Promise<void> => {
    // Mock implementation
    console.log('Sending reminder to patient:', patientId, medicationId);
  }
};

export const AdherenceDashboard: React.FC = () => {
  const [patientsWithConcerns, setPatientsWithConcerns] = useState<PatientAdherenceSummary[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientAdherenceSummary | null>(null);
  const [alerts, setAlerts] = useState<AdherenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'poor' | 'moderate'>('all');

  useEffect(() => {
    loadAdherenceData();
  }, []);

  const loadAdherenceData = async () => {
    try {
      setLoading(true);
      // In production, would fetch doctor's patient list first
      const patientIds = ['patient1', 'patient2', 'patient3']; // Mock
      const data = await adherenceAPI.getPatientsWithPoorAdherence(patientIds);
      setPatientsWithConcerns(data);
    } catch (error) {
      console.error('Error loading adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = async (patient: PatientAdherenceSummary) => {
    setSelectedPatient(patient);
    const patientAlerts = await adherenceAPI.getPatientAlerts(patient.patientId);
    setAlerts(patientAlerts);
  };

  const handleSendReminder = async (patientId: string, medicationId: string) => {
    try {
      await adherenceAPI.sendReminder(patientId, medicationId);
      alert('Reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const getSeverityColor = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: 'optimal' | 'moderate' | 'poor') => {
    switch (category) {
      case 'optimal':
        return 'text-green-700 bg-green-100';
      case 'moderate':
        return 'text-orange-700 bg-orange-100';
      case 'poor':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return '↗️';
      case 'declining':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const filteredPatients = patientsWithConcerns.filter(patient => {
    if (filterCategory === 'all') return true;
    return patient.poorAdherenceMedications.some(
      med => med.adherenceCategory === filterCategory
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading adherence data...</div>
      </div>
    );
  }

  return (
    <div className="adherence-dashboard p-6">
      <h1 className="text-3xl font-bold mb-6">Patient Adherence Monitoring</h1>

      {/* Filter Controls */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded ${
            filterCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          All Patients ({patientsWithConcerns.length})
        </button>
        <button
          onClick={() => setFilterCategory('poor')}
          className={`px-4 py-2 rounded ${
            filterCategory === 'poor'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Poor Adherence
        </button>
        <button
          onClick={() => setFilterCategory('moderate')}
          className={`px-4 py-2 rounded ${
            filterCategory === 'moderate'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Moderate Adherence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Patients Needing Attention</h2>

          {filteredPatients.length === 0 ? (
            <p className="text-gray-500">No patients with adherence concerns</p>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map(patient => (
                <div
                  key={patient.patientId}
                  onClick={() => handlePatientClick(patient)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPatient?.patientId === patient.patientId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{patient.patientName}</h3>
                      <p className="text-sm text-gray-600">
                        {patient.poorAdherenceMedications.length} medication(s) with concerns
                      </p>
                    </div>
                    {patient.alertCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {patient.alertCount} alert{patient.alertCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {patient.poorAdherenceMedications.slice(0, 3).map(med => (
                      <span
                        key={med.medicationId}
                        className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                          med.adherenceCategory
                        )}`}
                      >
                        {med.medicationName}: {(med.pdc * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Patient Details</h2>

          {!selectedPatient ? (
            <p className="text-gray-500">Select a patient to view details</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg">{selectedPatient.patientName}</h3>
                <p className="text-sm text-gray-600">Patient ID: {selectedPatient.patientId}</p>
              </div>

              {/* Medications */}
              <div>
                <h4 className="font-semibold mb-2">Medications</h4>
                <div className="space-y-3">
                  {selectedPatient.poorAdherenceMedications.map(med => (
                    <div key={med.medicationId} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{med.medicationName}</p>
                          <p className="text-sm text-gray-600">
                            PDC: {(med.pdc * 100).toFixed(1)}% | MPR: {(med.mpr * 100).toFixed(1)}%
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(med.adherenceCategory)}`}>
                          {med.adherenceCategory}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Gap: {med.gapDays} days</p>
                        <p>Trend: {getTrendIcon(med.trend)} {med.trend}</p>
                        {med.nextExpectedRefillDate && (
                          <p>Next refill: {new Date(med.nextExpectedRefillDate).toLocaleDateString()}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSendReminder(selectedPatient.patientId, med.medicationId)}
                        className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Send Reminder
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Active Alerts</h4>
                  <div className="space-y-2">
                    {alerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 border rounded ${getSeverityColor(alert.severity)}`}
                      >
                        <p className="font-medium">{alert.medicationName}</p>
                        <p className="text-sm">{alert.recommendedAction}</p>
                        {alert.daysOverdue && (
                          <p className="text-xs mt-1">{alert.daysOverdue} days overdue</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdherenceDashboard;
