/**
 * Patient Adherence Visualization
 * Gamified medication adherence tracking for patients
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
  totalDispensations: number;
}

interface AdherenceSummary {
  patientId: string;
  totalMedications: number;
  adherenceCounts: {
    optimal: number;
    moderate: number;
    poor: number;
  };
  averagePDC: number;
  overallCategory: 'optimal' | 'moderate' | 'poor';
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

// Mock API service
const adherenceAPI = {
  getPatientSummary: async (patientId: string): Promise<{ summary: AdherenceSummary; medications: AdherenceMetrics[] }> => {
    // Mock implementation
    return {
      summary: {
        patientId,
        totalMedications: 0,
        adherenceCounts: { optimal: 0, moderate: 0, poor: 0 },
        averagePDC: 0,
        overallCategory: 'optimal',
        criticalAlerts: 0,
        warningAlerts: 0,
        infoAlerts: 0
      },
      medications: []
    };
  },
  scheduleReminder: async (medicationId: string, time: string): Promise<void> => {
    console.log('Scheduling reminder for medication:', medicationId, time);
  }
};

export const AdherenceVisualization: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [summary, setSummary] = useState<AdherenceSummary | null>(null);
  const [medications, setMedications] = useState<AdherenceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedication, setSelectedMedication] = useState<AdherenceMetrics | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Gamification: Calculate streak (consecutive days with proper adherence)
  const [currentStreak, setCurrentStreak] = useState(7); // Mock
  const [longestStreak, setLongestStreak] = useState(14); // Mock
  const [vipPoints, setVipPoints] = useState(150); // Mock

  // Achievements
  const [achievements] = useState<Achievement[]>([
    { id: '1', title: 'First Week', description: '7 days perfect adherence', icon: '🌟', unlocked: true },
    { id: '2', title: 'On Track', description: '30 days perfect adherence', icon: '🏆', unlocked: false },
    { id: '3', title: 'Health Champion', description: '90 days perfect adherence', icon: '👑', unlocked: false },
    { id: '4', title: 'Never Miss', description: 'Zero missed refills in 6 months', icon: '💎', unlocked: false }
  ]);

  useEffect(() => {
    loadAdherenceData();
  }, [patientId]);

  const loadAdherenceData = async () => {
    try {
      setLoading(true);
      const data = await adherenceAPI.getPatientSummary(patientId);
      setSummary(data.summary);
      setMedications(data.medications);
    } catch (error) {
      console.error('Error loading adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReminder = async (medicationId: string) => {
    // In production, would show time picker and call API
    await adherenceAPI.scheduleReminder(medicationId, '09:00');
    alert('Reminder scheduled successfully!');
    setShowReminderModal(false);
  };

  const getScoreColor = (category: 'optimal' | 'moderate' | 'poor') => {
    switch (category) {
      case 'optimal':
        return 'text-green-600';
      case 'moderate':
        return 'text-orange-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreMessage = (category: 'optimal' | 'moderate' | 'poor') => {
    switch (category) {
      case 'optimal':
        return 'Excellent! Keep up the great work!';
      case 'moderate':
        return 'Good, but there is room for improvement';
      case 'poor':
        return 'Let us help you stay on track';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading your adherence data...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No adherence data available</p>
      </div>
    );
  }

  return (
    <div className="adherence-visualization p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Medication Adherence</h1>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Adherence Score</h2>
            <p className={`text-5xl font-bold ${getScoreColor(summary.overallCategory)}`}>
              {(summary.averagePDC * 100).toFixed(0)}%
            </p>
            <p className="text-lg mt-2">{getScoreMessage(summary.overallCategory)}</p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm">Current Streak</p>
              <p className="text-3xl font-bold">🔥 {currentStreak} days</p>
              <p className="text-xs mt-1">Longest: {longestStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* VIP Points */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⭐</span>
            <div>
              <p className="text-sm text-gray-600">VIP Points</p>
              <p className="text-2xl font-bold text-purple-600">{vipPoints}</p>
              <p className="text-xs text-gray-500">Earn more by staying adherent!</p>
            </div>
          </div>
        </div>

        {/* Medications Tracked */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">💊</span>
            <div>
              <p className="text-sm text-gray-600">Medications</p>
              <p className="text-2xl font-bold">{summary.totalMedications}</p>
              <div className="text-xs text-gray-500 mt-1">
                {summary.adherenceCounts.optimal} optimal, {summary.adherenceCounts.moderate} moderate
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔔</span>
            <div>
              <p className="text-sm text-gray-600">Alerts</p>
              <p className="text-2xl font-bold">
                {summary.criticalAlerts + summary.warningAlerts + summary.infoAlerts}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {summary.criticalAlerts} critical, {summary.warningAlerts} warnings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 border rounded-lg text-center transition-all ${
                achievement.unlocked
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-300 bg-gray-50 opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <p className="font-semibold text-sm">{achievement.title}</p>
              <p className="text-xs text-gray-600">{achievement.description}</p>
              {achievement.unlocked && (
                <span className="text-xs text-green-600 font-semibold">✓ Unlocked</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Medications</h2>

        {medications.length === 0 ? (
          <p className="text-gray-500">No medications tracked yet</p>
        ) : (
          <div className="space-y-4">
            {medications.map(med => (
              <div
                key={med.medicationId}
                className="border rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => setSelectedMedication(med)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{med.medicationName}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Adherence Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(med.adherenceCategory)}`}>
                          {(med.pdc * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Refills</p>
                        <p className="text-2xl font-bold text-gray-700">{med.totalDispensations}</p>
                      </div>
                    </div>
                    {med.nextExpectedRefillDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Next refill due: {new Date(med.nextExpectedRefillDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        med.adherenceCategory === 'optimal'
                          ? 'bg-green-100 text-green-700'
                          : med.adherenceCategory === 'moderate'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {med.adherenceCategory}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        med.adherenceCategory === 'optimal'
                          ? 'bg-green-500'
                          : med.adherenceCategory === 'moderate'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${med.pdc * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reminder Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedication(med);
                    setShowReminderModal(true);
                  }}
                  className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Set Reminder
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-lg mb-3">💡 Tips for Better Adherence</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Set daily reminders for your medication times</li>
          <li>✓ Use a pill organizer to track daily doses</li>
          <li>✓ Keep medications in a visible, accessible place</li>
          <li>✓ Refill prescriptions before running out</li>
          <li>✓ Talk to your doctor if you experience side effects</li>
        </ul>
      </div>

      {/* Reminder Modal (simplified) */}
      {showReminderModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Set Medication Reminder</h3>
            <p className="mb-4">
              Schedule a daily reminder for <strong>{selectedMedication.medicationName}</strong>
            </p>
            <input
              type="time"
              className="border rounded px-3 py-2 w-full mb-4"
              defaultValue="09:00"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleScheduleReminder(selectedMedication.medicationId)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Reminder
              </button>
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdherenceVisualization;
